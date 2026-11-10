// Canonical IDs and numerical tables: ElysiumRaces.java / ElysiumClasses.java.
export const ATTRIBUTES = [
  ["vitality", "Maximum life and recovery"],
  ["fortitude", "Armor"],
  ["resilience", "Elemental resistance"],
  ["strength", "Hit power"],
  ["agility", "Movement speed"],
  ["accuracy", "Critical chance"],
  ["reflexes", "Skill cooldown recovery"],
  ["retribution", "Reflect a share of incoming damage"],
  ["intellect", "Spell damage"],
  ["willpower", "Maximum energy"],
  ["luck", "Extra resource roll and critical chance"],
  ["presence", "Crafted equipment power"],
];
const race = (id, name, base, growth, trait, bonus) => ({
  id,
  name,
  base,
  growth,
  trait,
  bonus,
});
export const RACES = [
  race(
    "imperial",
    "Imperial",
    [4, 4, 3, 4, 3, 3, 3, 5, 3, 3, 3, 6],
    { retribution: 1, presence: 1, vitality: 1 },
    "Sanctioned Answer · Additional reflection scales with level",
    {},
  ),
  race(
    "druun",
    "Druun",
    [6, 8, 5, 8, 2, 3, 2, 2, 1, 3, 2, 2],
    { strength: 2, fortitude: 1 },
    "Cold Blood · +8 armor",
    { armor: 8 },
  ),
  race(
    "veylari",
    "Veylari",
    [3, 2, 2, 3, 6, 8, 5, 1, 7, 2, 3, 2],
    { intellect: 2, accuracy: 1 },
    "Lightfeather · +3% movement speed",
    { speed: 0.03 },
  ),
  race(
    "korrath",
    "Korrath",
    [5, 3, 3, 4, 8, 4, 7, 2, 2, 1, 4, 1],
    { agility: 2, reflexes: 1 },
    "Molt · +4% elemental resistance",
    { resistance: 0.04 },
  ),
  race(
    "lumari",
    "Lumari",
    [2, 1, 5, 2, 3, 3, 3, 3, 8, 9, 3, 2],
    { willpower: 2, intellect: 1 },
    "Photonic · +6% elemental damage",
    { elementalDamage: 0.06 },
  ),
  race(
    "unsworn",
    "Unsworn",
    [4, 3, 3, 5, 6, 4, 4, 2, 2, 2, 9, 0],
    { luck: 2, strength: 1 },
    "Uncounted · +0.25 gathering yield",
    { yield: 0.25 },
  ),
];
const calling = (id, name, growth, weapon, element, trait, bonus) => ({
  id,
  name,
  growth,
  weapon,
  element,
  trait,
  bonus,
});
export const CLASSES = [
  calling(
    "medicae",
    "Medicae",
    { vitality: 1, presence: 1 },
    "staff",
    "Tide",
    "Triage Field · +18% recovery",
    { recovery: 0.18 },
  ),
  calling(
    "factor",
    "Factor",
    { luck: 1, presence: 1 },
    "bow",
    "Volt",
    "Profiteer · +8% crafted power",
    { fabrication: 0.08 },
  ),
  calling(
    "artificer",
    "Artificer",
    { intellect: 1, presence: 1 },
    "staff",
    "Volt",
    "Field Repair · +10% crafted power",
    { fabrication: 0.1 },
  ),
  calling(
    "enforcer",
    "Enforcer",
    { strength: 1, fortitude: 1 },
    "blade",
    "Flame",
    "Sanctioned Force · +9% attack damage",
    { attackDamage: 0.09 },
  ),
  calling(
    "psion",
    "Psion",
    { intellect: 1, willpower: 1 },
    "staff",
    "Astral",
    "Resonance · +9% spell damage",
    { spellDamage: 0.09 },
  ),
  calling(
    "voidrunner",
    "Voidrunner",
    { agility: 1, reflexes: 1 },
    "blade",
    "Void",
    "Slipstream · +7% movement speed",
    { speed: 0.07 },
  ),
  calling(
    "reclaimer",
    "Reclaimer",
    { fortitude: 1, luck: 1 },
    "blade",
    "Solar",
    "Prospector · +1 extraction yield",
    { yield: 1 },
  ),
  calling(
    "warden",
    "Warden",
    { resilience: 1, retribution: 1 },
    "blade",
    "Tide",
    "Bulwark · +22 armor",
    { armor: 22 },
  ),
  calling(
    "marksman",
    "Marksman",
    { accuracy: 1, agility: 1 },
    "bow",
    "Gale",
    "Called Shot · +5% critical chance",
    { crit: 0.05 },
  ),
];
export const originFor = (s) => RACES.find((r) => r.id === s.race) || RACES[0];
export const classFor = (s) =>
  CLASSES.find((c) => c.id === s.calling) || CLASSES[3];
const starterStats = {
  imperial: "presence",
  druun: "resilience",
  veylari: "willpower",
  korrath: "strength",
  lumari: "intellect",
  unsworn: "agility",
  medicae: "vitality",
  factor: "luck",
  artificer: "intellect",
  enforcer: "retribution",
  psion: "willpower",
  voidrunner: "reflexes",
  reclaimer: "fortitude",
  warden: "strength",
  marksman: "accuracy",
};
export const earnedPassives = (level) => Math.max(0, level - 1) * 3;
export const earnedAttributes = (level) => Math.max(0, level - 1) * 10;
export const passiveBudget = (s) =>
  Math.max(earnedPassives(s.level), s.legacyPassiveFloor || 0);
export const attributeBudget = (s) =>
  earnedAttributes(s.level) -
  Object.values(s.attributes || {}).reduce((a, b) => a + b, 0);
export function normalizeAttributes(raw, level) {
  let remaining = earnedAttributes(level);
  return Object.fromEntries(
    ATTRIBUTES.map(([key]) => {
      const n = Number.isFinite(raw?.[key])
        ? Math.max(0, Math.floor(raw[key]))
        : 0;
      const spent = Math.min(remaining, n);
      remaining -= spent;
      return [key, spent];
    }),
  );
}
export function attributeTotals(s) {
  const race = originFor(s),
    calling = classFor(s);
  return Object.fromEntries(
    ATTRIBUTES.map(([id], i) => [
      id,
      race.base[i] +
        ((race.growth[id] || 0) + (calling.growth[id] || 0)) * (s.level - 1) +
        (s.attributes?.[id] || 0) +
        3 *
          (Number(starterStats[race.id] === id) +
            Number(starterStats[calling.id] === id)),
    ]),
  );
}
export function assignAttribute(s, id, amount) {
  if (
    !ATTRIBUTES.some(([key]) => key === id) ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    attributeBudget(s) < amount
  )
    return false;
  s.attributes[id] = (s.attributes[id] || 0) + amount;
  return true;
}
export function applyCodexStats(v, s) {
  const a = attributeTotals(s);
  const share = (n, half) => n / (n + half);
  v.life += a.vitality * 1.8;
  v.recovery += share(a.vitality, 110) * 0.25;
  v.armor += a.fortitude * 1.8;
  v.resistance += share(a.resilience, 100) * 0.4;
  v.power += a.strength * 0.7;
  v.speed += share(a.agility, 100) * 0.4;
  v.crit = 1 - (1 - v.crit) * (1 - share(a.accuracy, 800 / 4));
  v.haste += share(a.reflexes, 110) * 0.45;
  v.reflection = share(a.retribution, 900 / 4);
  if (originFor(s).id === "imperial")
    v.reflection = 1 - (1 - v.reflection) * (1 - share(s.level, 100));
  v.spellDamage += a.intellect * 0.008;
  v.mana += a.willpower * 1.5;
  v.luckChance = share(a.luck, 700 / 4);
  // Browser build: Luck adds an independent crit opportunity at a quarter of
  // its resource chance. Elysium's normal combat crit source is Accuracy.
  v.crit = 1 - (1 - v.crit) * (1 - v.luckChance * 0.25);
  v.fabrication += share(a.presence, 110) * 0.22;
  for (const bonus of [originFor(s).bonus, classFor(s).bonus])
    for (const [key, value] of Object.entries(bonus)) v[key] += value;
}
