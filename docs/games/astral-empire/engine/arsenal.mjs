export const WEAPON_FORMS = {
  pistol: { name: "Aethercoil pistol", style: "pistol", magazine: 12, reload: 1.35,
    strike: { name: "Aethercoil shot", range: 30, power: 1.15, cooldown: 0.25 } },
  sword: {
    name: "Longsword",
    style: "blade",
    strike: {
      name: "Ion cleave",
      range: 4.1,
      radius: 2.1,
      power: 1.12,
      cooldown: 0.51,
    },
  },
  daggers: {
    name: "Twin daggers",
    style: "blade",
    strike: {
      name: "Twin incision",
      range: 2.7,
      radius: 1.35,
      power: 0.71,
      cooldown: 0.28,
    },
  },
  spear: {
    name: "Spear",
    style: "blade",
    strike: {
      name: "Lance thrust",
      range: 6.3,
      radius: 1.5,
      power: 1.25,
      cooldown: 0.66,
    },
  },
  longbow: {
    name: "Longbow",
    style: "bow",
    strike: {
      name: "Railbolt volley",
      range: 26,
      projectileSpeed: 34,
      power: 1.03,
      cooldown: 0.65,
    },
  },
  projector: {
    name: "Psi projector",
    style: "staff",
    strike: {
      name: "Resonant pulse",
      range: 21,
      projectileSpeed: 19,
      power: 1.17,
      cost: 5,
      cooldown: 0.64,
    },
  },
};
export const ARMOR_FORMS = {
  light: {
    name: "Light armor",
    description: "+6% movement speed and +8% cooldown recovery",
    speed: 0.06,
    haste: 0.08,
  },
  heavy: {
    name: "Heavy armor",
    description: "+20% armor and −6% movement speed",
    armorRate: 0.2,
    speed: -0.06,
  },
  shield: {
    name: "Kinetic shield",
    description: "Hold G to block frontal attacks while you have stamina",
  },
};
export const ITEM_FRAMES = {
  assay: { label: "Cobalt assay optics", description: "+1 gathered material before fibre Fortune; ascension strengthens yield.", yield: 1 },
  cultivator: {
    label: "Fortune harvest lattice",
    description: "Fibre Fortune 1; each Prospector ascension adds 1 Fortune. Multiplies the complete fibre yield and independently rolls cultivated seed returns.",
    fortune: 1,
  },
  electrum: {
    label: "Prospector optics",
    description: "+8 percentage points of independent material luck",
    luck: 0.08,
  },
  signal: {
    label: "Feedback lining",
    description: "Reflect an additional independent 10% of each blow",
    reflect: 0.1,
  },
  rime: {
    label: "Cryogenic dampers",
    description: "+12% elemental resistance and +8% recovery",
    resistance: 0.12,
    recovery: 0.08,
  },
  xenotwill: {
    label: "Field harvest mesh",
    description: "+6 percentage points of independent material luck",
    luck: 0.06,
  },
};
export const ASCENSION_PATHS = {
  force: {
    name: "Force",
    description: "+6% attack and spell damage per ascension",
  },
  guard: {
    name: "Aegis",
    description: "+8% armor and +2% elemental resistance per ascension",
  },
  harvest: {
    name: "Prospector",
    description: "+4% independent material luck per ascension",
  },
};
export const ascensionTier = (item) =>
  Math.max(0, Math.min(3, Math.floor(Number(item.ascension) || 0)));
export const equipmentPower = (item) =>
  item.base * (1 + item.quality * 0.04) * (1 + ascensionTier(item) * 0.12);
export function ascensionCost(item) {
  const next = ascensionTier(item) + 1;
  if (next > 3) return null;
  return {
    temper: 4 * next,
    gold: 160 * next,
    resources:
      next === 1 ? { electrum: 1 } : { signalAlloy: next - 1, electrum: 1 },
  };
}
export const equippedForm = (s) =>
  s.items.find((i) => i.id === s.equipped.weapon)?.form;
