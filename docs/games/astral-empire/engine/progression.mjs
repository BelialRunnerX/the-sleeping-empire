import {universeManifest} from './universe/manifest.mjs';
import { normalizeTerrainGeneration } from './terrain-generation.mjs';
import { normalizeTreeLedger, fellGameTree } from "./voxel-trees/tree-gameplay.mjs";
import {
  HEROES,
  SKILLS,
  SUPPORTS,
  AFFIXES,
  PROFESSIONS,
  RECIPES,
  CONSTELLATION,
  QUESTS,
  WEAPONS,
} from "./content.mjs";
import { numeric } from "./native.mjs";
import { normalizeExploration } from "./frontier.mjs";
import { FIBRE_PLANTS, fibreYield, fortuned } from "./ecology.mjs";
import { cropReadyAt, nearNursery, normalizeNursery } from "./nursery.mjs";
import { normalizeGeology, preserveCanonicalResources, RAW_COBALT, COBALT_INGOT } from "./geology-field.mjs";
import { normalizeTerrainDeltas } from "./terrain-volume.mjs";
import { normalizeMicrovoxels } from "./microvoxels.mjs";
import { SAVE_COORDINATE_LIMIT } from "./chunks.mjs";
import { GEODE_MATERIALS, GEODE_GROWTH_MS } from "./geodes.mjs";
import {
  WEAPON_FORMS,
  ARMOR_FORMS,
  ITEM_FRAMES,
  ASCENSION_PATHS,
  ascensionTier,
  ascensionCost,
  equippedForm,
  equipmentPower,
} from "./arsenal.mjs";
import { reachable } from "./constellation.mjs";
import {
  applyCodexStats,
  classFor,
  CLASSES,
  RACES,
  normalizeAttributes,
  passiveBudget,
} from "./codex.mjs";
import {
  freshProduction,
  normalizeProduction,
  nearStation,
} from "./artisan.mjs";
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const finite = (v, fallback = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;
export const hash = (seed, x, z) => numeric.world_hash(seed | 0, x | 0, z | 0);
export const roll = (seed, x, z) => hash(seed, x, z) / 4294967296;
export function makeItem(seed, level = 1, slot = "weapon", rarity = "rare") {
  const bases = {
    weapon: ["Oathblade", 18],
    armor: ["Warden mantle", 25],
    charm: ["Astral conduit", 12],
    offhand: ["Kinetic shield", 13],
  };
  const [name, power] = bases[slot] || bases.weapon;
  const pool = [...AFFIXES],
    affixes = [];
  for (
    let i = 0;
    i < (rarity === "rare" ? 3 : rarity === "epic" ? 4 : 1);
    i++
  ) {
    const a = pool.splice(hash(seed, i, 5) % pool.length, 1)[0];
    affixes.push({
      id: a.id,
      stat: a.stat,
      value: +(
        (a.min + (a.max - a.min) * roll(seed, i, 9)) *
        (1 + (level - 1) * 0.035)
      ).toFixed(3),
    });
  }
  return {
    id: "gear-" + seed,
    slot,
    name,
    level,
    rarity,
    base: Math.round(power * (1 + level * 0.08)),
    affixes,
    quality: 0,
  };
}
export function freshState(seed = 438102) {
  if (!Number.isSafeInteger(seed)) seed = 438102;
  return {
    version: 3,
    seed,
    universe: universeManifest(null,seed),
    level: 1,
    xp: 0,
    gold: 1600,
    crystals: 2500,
    tickets: 6,
    pity: 0,
    cosmeticShards: 0,
    hero: "kael",
    avatarBody: null,
    heroes: ["kael", "lumi", "mira", "tess"],
    heroLevels: { kael: 3, lumi: 2, mira: 3, tess: 1 },
    race: null,
    calling: null,
    attributes: normalizeAttributes(null, 1),
    legacyPassiveFloor: 0,
    realm: "bastion",
    position: { x: 0, z: 6 },
    life: 300,
    mana: 120,
    resources: {
      [RAW_COBALT]: 0, [COBALT_INGOT]: 0,
      cobalt: 0,
      stone: 0,
      timber: 0,
      herb: 0,
      loomflaxFibre: 0,
      downbloomTuft: 0,
      loomflaxSeed: 0,
      downbloomSeed: 0,
      fieldCord: 0,
      fish: 0,
      essence: 2,
      potions: 5,
      meal: 0,
      billet: 0,
      plank: 0,
      extract: 0,
      aether: 0,
      circuitry: 0,
      telemetry: 0,
      capacitor: 0,
      goldShard: 0,
      silverShard: 0,
      redstone: 0,
      rimeShard: 0,
      goldIngot: 0,
      silverIngot: 0,
      electrum: 0,
      signalAlloy: 0,
    },
    nursery: normalizeNursery(),
    microvoxels: normalizeMicrovoxels(),
    terrain: normalizeTerrainDeltas(),
    terrainGeneration: {version:1},
    geology: normalizeGeology(null, seed),
    professions: Object.fromEntries(PROFESSIONS.map((p) => [p.id, 0])),
    items: [
      makeItem(seed, 1, "weapon", "magic"),
      makeItem(seed + 1, 1, "armor", "magic"),
    ],
    equipped: { weapon: "gear-" + seed, armor: "gear-" + (seed + 1) },
    passives: [],
    links: {
      lance: ["echo", "none"],
      nova: ["cascade", "none"],
      dash: ["leech", "none"],
      burst: ["ignite", "none"],
    },
    trees: normalizeTreeLedger(),
    depleted: {},
    defeated: {},
    statistics: {
      kills: 0,
      gathers: 0,
      cropHarvests: 0,
      crafts: 0,
      bosses: 0,
      processed: 0,
      workstations: 0,
      salvages: 0,
      relays: 0,
    },
    production: freshProduction(),
    exploration: { discovered: [], changed: [] },
    claimed: [],
    deepest: 0,
    foodUntil: 0,
    shieldUntil: 0,
    lastSaved: 0,
  };
}
export function migrateState(input) {
  const fresh = freshState(finite(input?.seed ?? input?.sandbox?.seed, 438102));
  if (!input || typeof input !== "object") return fresh;
  if (input.version === 3) {
    const s = { ...fresh, ...input, version: 3 };
    s.universe=universeManifest(input.universe,fresh.seed);
    for (const key of [
      "level",
      "xp",
      "gold",
      "crystals",
      "tickets",
      "pity",
      "deepest",
    ])
      s[key] = clamp(finite(s[key], fresh[key]), 0, 1e9);
    s.level = clamp(Math.floor(s.level), 1, 100);
    for (const id of ["foodUntil", "shieldUntil"])
      s[id] = clamp(finite(input[id]), 0, Date.now() + 900000);
    s.avatarBody = ["male","female"].includes(input.avatarBody) ? input.avatarBody : null;
    s.hero = HEROES.some((h) => h.id === s.hero) ? s.hero : "kael";
    s.race = RACES.some((r) => r.id === input.race) ? input.race : null;
    s.calling = CLASSES.some((c) => c.id === input.calling)
      ? input.calling
      : null;
    s.cosmeticShards = Math.max(
      0,
      Math.min(999999, Math.floor(finite(input.cosmeticShards))),
    );
    s.attributes = normalizeAttributes(input.attributes, s.level);
    s.heroes = Array.isArray(s.heroes)
      ? s.heroes.filter((id) => HEROES.some((h) => h.id === id))
      : fresh.heroes;
    if (!s.heroes.includes(s.hero)) s.heroes.push(s.hero);
    s.resources = { ...fresh.resources };
    for (const k of Object.keys(fresh.resources).filter(k => !k.includes(":")))
      s.resources[k] = clamp(Math.floor(finite(input.resources?.[k])), 0, 1e8);
    preserveCanonicalResources(s.resources, input.resources);
    s.professions = { ...fresh.professions };
    for (const k of Object.keys(fresh.professions))
      s.professions[k] = clamp(finite(input.professions?.[k]), 0, 1e8);
    s.statistics = { ...fresh.statistics };
    for (const key of Object.keys(s.statistics))
      s.statistics[key] = clamp(
        Math.floor(finite(input.statistics?.[key])),
        0,
        1e9,
      );
    s.life = clamp(finite(input.life, 300), 1, 1e6);
    s.mana = clamp(finite(input.mana, 120), 0, 1e6);
    s.position = {
      x: clamp(
        finite(input.position?.x),
        -SAVE_COORDINATE_LIMIT,
        SAVE_COORDINATE_LIMIT,
      ),
      z: clamp(
        finite(input.position?.z, 6),
        -SAVE_COORDINATE_LIMIT,
        SAVE_COORDINATE_LIMIT,
      ),
    };
    if (Number.isFinite(input.position?.y)) s.position.y = clamp(input.position.y, -512, 512);
    s.items = Array.isArray(input.items)
      ? input.items
          .filter(
            (i) =>
              i && ["weapon", "armor", "charm", "offhand"].includes(i.slot),
          )
          .slice(0, 200)
          .map((i) => ({
            ...i,
            name: String(i.name || "Relic").slice(0, 60),
            base: clamp(finite(i.base, 10), 1, 500),
            quality: clamp(finite(i.quality), 0, 20),
            frame: Object.hasOwn(ITEM_FRAMES, i.frame) ? i.frame : null,
            form: Object.hasOwn(
              i.slot === "weapon" ? WEAPON_FORMS : ARMOR_FORMS,
              i.form,
            )
              ? i.form
              : null,
            ascension: Object.hasOwn(ASCENSION_PATHS, i.ascensionPath)
              ? ascensionTier(i)
              : 0,
            ascensionPath: Object.hasOwn(ASCENSION_PATHS, i.ascensionPath)
              ? i.ascensionPath
              : null,
            affixes: (Array.isArray(i.affixes) ? i.affixes : [])
              .filter((a) => AFFIXES.some((d) => d.id === a?.id))
              .slice(0, 4)
              .map((a) => ({
                ...a,
                stat: AFFIXES.find((d) => d.id === a.id).stat,
                value: clamp(finite(a.value), 0, 100),
              })),
          }))
      : fresh.items;
    s.equipped = {};
    for (const slot of ["weapon", "armor", "charm", "offhand"])
      if (
        s.items.some((i) => i.id === input.equipped?.[slot] && i.slot === slot)
      )
        s.equipped[slot] = input.equipped[slot];
    const selected = new Set();
    for (const id of Array.isArray(input.passives)
      ? input.passives.slice(0, 330)
      : []) {
      const node = CONSTELLATION.byId.get(id);
      if (id !== "origin" && node && !selected.has(node.opposed))
        selected.add(id);
    }
    const connected = reachable(selected, CONSTELLATION.neighbors);
    s.legacyPassiveFloor =
      input.legacyPassiveFloor === undefined
        ? Math.min(
            5,
            s.level + 3,
            connected.filter((id) => !id.startsWith("web-")).length,
          )
        : clamp(Math.floor(finite(input.legacyPassiveFloor)), 0, 5);
    s.passives = connected.slice(0, passiveBudget(s));
    s.links = {};
    for (const skill of SKILLS) {
      const links = input.links?.[skill.id];
      s.links[skill.id] = Array.isArray(links)
        ? links
            .slice(0, 2)
            .map((id) => (SUPPORTS.some((v) => v.id === id) ? id : "none"))
        : ["none", "none"];
    }
    s.trees = normalizeTreeLedger(input.trees);
    s.depleted =
      input.depleted && typeof input.depleted === "object"
        ? input.depleted
        : {};
    s.defeated =
      input.defeated && typeof input.defeated === "object"
        ? input.defeated
        : {};
    s.claimed = Array.isArray(input.claimed)
      ? input.claimed.filter((id) => QUESTS.some((q) => q.id === id))
      : [];
    s.realm = ["bastion", "moon", "cinder", "frost", "orbit"].includes(
      input.realm,
    )
      ? input.realm
      : "bastion";
    s.production = normalizeProduction(input.production);
    s.nursery = normalizeNursery(input.nursery);
    s.microvoxels = normalizeMicrovoxels(input.microvoxels);
    s.terrain = normalizeTerrainDeltas(input.terrain);
    s.terrainGeneration = normalizeTerrainGeneration(input.terrainGeneration);
    s.geology = normalizeGeology(input.geology, fresh.seed);
    s.seed = fresh.seed;
    s.exploration = normalizeExploration(input.exploration, s.seed);
    return s;
  }
  if (input.version === 1 || input.version === 2) {
    fresh.gold = clamp(finite(input.gold, 1600), 0, 1e9);
    fresh.crystals = clamp(finite(input.crystals, 2500), 0, 1e9);
    fresh.tickets = clamp(finite(input.tickets, 6), 0, 1e6);
    fresh.pity = clamp(finite(input.pity), 0, 39);
    fresh.heroes = Object.keys(input.heroes || {}).filter((id) =>
      HEROES.some((h) => h.id === id),
    );
    if (!fresh.heroes.length) fresh.heroes = ["kael", "lumi", "mira", "tess"];
    fresh.hero = fresh.heroes.includes(input.team?.[0])
      ? input.team[0]
      : fresh.heroes[0];
    fresh.heroLevels = Object.fromEntries(
      fresh.heroes.map((id) => [
        id,
        clamp(finite(input.heroes?.[id]?.level, 1), 1, 60),
      ]),
    );
    fresh.level = clamp(Math.max(...Object.values(fresh.heroLevels)), 1, 60);
    fresh.resources.cobalt = clamp(
      finite(input.sandbox?.resources?.cobalt) + finite(input.ore),
      0,
      1e8,
    );
    fresh.resources.timber = clamp(
      finite(input.sandbox?.resources?.wood),
      0,
      1e8,
    );
    fresh.resources.stone = clamp(
      finite(input.sandbox?.resources?.stone),
      0,
      1e8,
    );
    for (const [index, item] of (input.items || []).entries()) {
      const slot = { Weapon: "weapon", Armor: "armor", Charm: "charm" }[
        item.slot
      ];
      if (!slot) continue;
      const i = makeItem(
        fresh.seed + index + 100,
        clamp(finite(item.level, 1), 1, 60),
        slot,
        "magic",
      );
      i.name = String(item.name || i.name).slice(0, 60);
      i.base = clamp(finite(item.base, 18), 1, 500);
      fresh.items.push(i);
      if (item.owner === fresh.hero) fresh.equipped[slot] = i.id;
    }
  }
  return fresh;
}
export function stats(s, now = Date.now()) {
  const v = {
    life: 300 + (s.level - 1) * 28,
    mana: 120,
    damage: 0.0,
    attackDamage: 0,
    spellDamage: 0,
    elementalDamage: 0,
    elementalPenetration: 0,
    resistance: 0,
    armor: 18,
    armorRate: 0,
    crit: 0.08,
    critMultiplier: 1.6,
    haste: 0,
    recovery: 0,
    penetration: 0,
    speed: 0,
    yield: 0,
    fortune: 0,
    fabrication: 0,
    shield: 0,
    power: 26 + (s.level - 1) * 3,
    keystones: [],
  };
  applyCodexStats(v, s);
  for (const id of s.passives) {
    const p = CONSTELLATION.byId.get(id);
    if (!p) continue;
    if (p.stat === "keystone") v.keystones.push(p.value);
    else if (p.mods) for (const [key, value] of p.mods) v[key] += value;
    else v[p.stat] += p.value;
  }
  for (const item of s.items.filter((i) =>
    Object.values(s.equipped).includes(i.id),
  )) {
    const base = equipmentPower(item);
    if (item.slot === "weapon") v.power += base;
    if (item.slot === "armor") v.armor += base;
    if (item.slot === "charm") v.mana += base;
    if (item.slot === "offhand") v.shield = base;
    const tier = ascensionTier(item);
    for (const a of item.affixes)
      v[a.stat] = (v[a.stat] || 0) + a.value * (1 + tier * 0.07);
    const armor = ARMOR_FORMS[item.form];
    if (armor?.speed) v.speed += armor.speed;
    if (armor?.haste) v.haste += armor.haste;
    if (armor?.armorRate) v.armorRate += armor.armorRate;
    if (item.ascensionPath === "force") {
      v.attackDamage += tier * 0.06;
      v.spellDamage += tier * 0.06;
    }
    if (item.ascensionPath === "guard") {
      v.armorRate += tier * 0.08;
      v.resistance += tier * 0.02;
    }
    if (item.ascensionPath === "harvest")
      v.luckChance = 1 - (1 - v.luckChance) * (1 - tier * 0.04);
    const frame = ITEM_FRAMES[item.frame];
    if (frame?.yield) v.yield += frame.yield * (1 + tier * .07);
    if (frame?.fortune) v.fortune += frame.fortune + (item.ascensionPath === "harvest" ? tier : 0);
    if (frame?.luck) v.luckChance = 1 - (1 - v.luckChance) * (1 - frame.luck);
    if (frame?.reflect)
      v.reflection = 1 - (1 - v.reflection) * (1 - frame.reflect);
    if (frame?.resistance) v.resistance += frame.resistance;
    if (frame?.recovery) v.recovery += frame.recovery;
  }
  if (s.foodUntil > now) {
    v.life += 60;
    v.recovery += 0.35;
  }
  if (s.shieldUntil > now) {
    v.resistance += 0.16;
    v.recovery += 0.3;
  }
  if (v.keystones.includes("iron")) {
    v.life += 90;
    v.armor += 80;
    v.speed -= 0.08;
  }
  if (v.keystones.includes("wellspring")) v.mana *= 0.85;
  if (v.keystones.includes("fracture")) v.critMultiplier += 0.5;
  v.armor *= 1 + v.armorRate;
  v.crit = clamp(v.crit, 0, 0.75);
  v.penetration = clamp(v.penetration, 0, 0.8);
  v.resistance = clamp(v.resistance, -0.5, 0.75);
  v.elementalPenetration = clamp(v.elementalPenetration, 0, 0.75);
  return v;
}
export function skillStats(s, id) {
  const base = SKILLS.find((k) => k.id === id);
  if (!base) return null;
  const form = WEAPON_FORMS[equippedForm(s)],
    weapon = form?.style || classFor(s).weapon;
  const skill =
    id === "strike"
      ? { ...base, ...WEAPONS[weapon], ...form?.strike, weapon }
      : base;
  const v = {
    ...skill,
    supports: [],
    damage: 1,
    leech: 0,
    radius: skill.radius,
    cost: skill.cost,
    cooldown: skill.cooldown,
    echo: false,
    burn: false,
    pierce: skill.pierce || 0,
    chain: 0,
  };
  const used = new Set();
  for (const name of id === "strike" ? [] : s.links[id] || []) {
    const mod = SUPPORTS.find((m) => m.id === name);
    if (
      !mod ||
      mod.id === "none" ||
      used.has(name) ||
      (mod.tags && !mod.tags.some((t) => skill.tags.includes(t)))
    )
      continue;
    used.add(name);
    v.supports.push(mod.name);
    v.damage *= mod.damage ?? 1;
    v.radius *= mod.radius ?? 1;
    v.cost *= mod.mana ?? 1;
    v.cooldown *= mod.cooldown ?? 1;
    v.leech += mod.leech ?? 0;
    v.echo ||= name === "echo";
    v.burn ||= !!mod.burn;
    v.execute ||= !!mod.execute;
    v.pierce += mod.pierce || 0;
    v.chain += mod.chain || 0;
  }
  const st = stats(s);
  v.cooldown /= 1 + st.haste;
  if (st.keystones.includes("blood"))
    v.damage *= skill.tags.includes("attack") ? 1.2 : 0.8;
  if (st.keystones.includes("archmage") && skill.tags.includes("spell")) {
    v.power += (st.mana * 0.2) / st.power;
    v.cost *= 1.25;
  }
  return v;
}
export function canAllocate(s, id, selected = new Set(s.passives)) {
  const p = CONSTELLATION.byId.get(id);
  return (
    !!p &&
    id !== "origin" &&
    !selected.has(id) &&
    !selected.has(p.opposed) &&
    selected.size < passiveBudget(s) &&
    CONSTELLATION.neighbors
      .get(id)
      .some((parent) => parent === "origin" || selected.has(parent))
  );
}
export function allocate(s, id) {
  if (!canAllocate(s, id)) return false;
  s.passives.push(id);
  return true;
}
export function refund(s, id) {
  if (!s.passives.includes(id)) return false;
  const left = s.passives.filter((x) => x !== id);
  if (reachable(new Set(left), CONSTELLATION.neighbors).length !== left.length)
    return false;
  s.passives = left;
  return true;
}
export function addXP(s, amount) {
  s.xp += amount;
  let levels = 0;
  while (s.level < 100 && s.xp >= s.level * 100) {
    s.xp -= s.level * 100;
    s.level++;
    levels++;
  }
  return levels;
}
export function professionLevel(s, id) {
  return 1 + Math.floor(Math.sqrt((s.professions[id] || 0) / 30));
}
export function gatherYield(s, profession, isFibre) {
  const st = stats(s), tier = numeric.world_tier(s.level, s.deepest);
  const lucky = roll(s.seed, s.statistics.gathers, 1907) < st.luckChance;
  const yieldRoll = roll(s.seed, s.statistics.gathers, 9);
  const base = isFibre ? fibreYield(tier, yieldRoll) : numeric.ore_yield(tier, yieldRoll);
  const mastery = Math.floor(professionLevel(s, profession) / 3);
  const equipment = Math.floor(st.yield), artisan = st.keystones.includes("artisan") ? 1 : 0;
  const subtotal = base + mastery + equipment + artisan + (lucky ? 1 : 0);
  // Browser stacking order intentionally lets Fortune amplify the entire build.
  const fortune = isFibre ? Math.floor(st.fortune) : 0;
  const multiplier = fortuned(1, fortune, roll(s.seed, s.statistics.gathers, 1913));
  return { base, mastery, equipment, artisan, luck: lucky ? 1 : 0, subtotal, fortune, multiplier, total: subtotal * multiplier };
}
export function harvestCrop(s, index, now = Date.now()) {
  const crop = s.nursery.plots[index];
  if (!nearNursery(s) || !Number.isInteger(index) || !crop || now < cropReadyAt(crop))
    return { ok: false, message: "Visit the nursery and choose a mature crop." };
  const fibre = FIBRE_PLANTS[crop.species];
  const yieldInfo = gatherYield(s, "herbalism", true), count = yieldInfo.total;
  const seeds = fortuned(1, yieldInfo.fortune, roll(s.seed, s.statistics.gathers, 1919));
  s.nursery.plots[index] = null;
  s.statistics.cropHarvests = (s.statistics.cropHarvests || 0) + 1;
  s.resources[fibre.resource] += count;
  s.resources[fibre.seed] += seeds;
  s.professions.herbalism += 20;
  s.statistics.gathers++;
  addXP(s, 15);
  return { ok: true, yield: yieldInfo, seeds, message: "+" + count + " " + fibre.name + " fibre (" + yieldInfo.subtotal + " × " + yieldInfo.multiplier + " Fortune) · +" + seeds + " seed · Xenobotany +20 XP" };
}
export function gather(s, node, now = Date.now()) {
  const job = PROFESSIONS.find(
    (p) => p.node === (node.kind === "rock" ? "ore" : node.kind),
  );
  if (!job || s.depleted[node.id] > now)
    return { ok: false, message: "This resource is recovering." };
  const geode = node.kind === "geode" && GEODE_MATERIALS[node.material];
  const fibre = node.kind === "herb" && FIBRE_PLANTS[node.species];
  const resource = geode
    ? node.material
    : fibre ? fibre.resource : node.kind === "rock"
      ? "stone"
      : job.resource;
  if (!resource) return { ok: false, message: "Unknown material." };
  const yieldInfo = gatherYield(s, job.id, !!fibre);
  if(node.voxelManaged){
    const result=fellGameTree(s,node,yieldInfo.mastery+yieldInfo.equipment+yieldInfo.artisan+yieldInfo.luck);
    if(result.ok){s.professions[job.id]+=20;s.statistics.gathers++;addXP(s,15);}
    return result;
  }
  const count = yieldInfo.total + (geode ? 1 : 0);
  s.resources[resource] = (s.resources[resource] || 0) + count;
  if (fibre) s.resources[fibre.seed] += 2;
  if (node.kind === "ore") s.resources.stone += count;
  s.professions[job.id] += 20;
  s.statistics.gathers++;
  if (node.kind === "wreck") s.statistics.salvages++;
  s.depleted[node.id] = now + (geode ? GEODE_GROWTH_MS : 180000);
  addXP(s, 15);
  return {
    ok: true,
    message:
      "+" +
      count +
      " " +
      (geode ? geode.name + " shards" : fibre ? fibre.name + " fibre" : resource) +
      (fibre ? " (" + yieldInfo.subtotal + " × " + yieldInfo.multiplier + " Fortune) · +2 seeds · " : " · ") +
      job.name +
      " +20 XP",
  };
}
export function craft(s, id, seed = Date.now()) {
  const recipe = RECIPES.find((r) => r.id === id);
  if (
    recipe?.station &&
    (!nearStation(s, recipe.station) ||
      (s.production?.stations[recipe.station]?.tier || 0) < recipe.tier)
  )
    return {
      ok: false,
      message: "Visit the recipe's upgraded sanctuary workstation first.",
    };
  if (recipe?.level && s.level < recipe.level)
    return { ok: false, message: "Requires field rank " + recipe.level + "." };
  if (
    !recipe ||
    !Object.entries(recipe.cost).every(([k, n]) => s.resources[k] >= n)
  )
    return { ok: false, message: "Gather the required materials first." };
  if (recipe.type && s.items.length >= 200)
    return {
      ok: false,
      message: "Your inventory is full. Salvage equipment first.",
    };
  for (const [k, n] of Object.entries(recipe.cost)) s.resources[k] -= n;
  if (recipe.type) {
    const item = makeItem(seed, s.level, recipe.type, recipe.rarity || "rare");
    if (recipe.itemName) item.name = recipe.itemName;
    if (recipe.frame) item.frame = recipe.frame;
    if (recipe.form) item.form = recipe.form;
    item.base = Math.round(
      item.base *
        (1 +
          (professionLevel(
            s,
            recipe.profession === "fabrication" ? "fabrication" : "smithing",
          ) -
            1) *
            0.03) *
        (1 + stats(s).fabrication) *
        (recipe.baseBonus || 1),
    );
    if (stats(s).keystones.includes("artisan"))
      item.base = Math.round(item.base * 1.25);
    s.items.push(item);
  } else
    s.resources[recipe.result] +=
      recipe.count + Math.floor(professionLevel(s, recipe.profession) / 3);
  s.professions[recipe.profession] += 40;
  s.statistics.crafts++;
  addXP(s, 30);
  return { ok: true, message: recipe.name + " crafted." };
}
export function alterItem(s, id, action, seed = Date.now()) {
  const i = s.items.find((v) => v.id === id);
  if (!i) return false;
  if (typeof action === "string" && action.startsWith("ascend-")) {
    const path = action.slice(7),
      cost = ascensionCost(i);
    if (
      !Object.hasOwn(ASCENSION_PATHS, path) ||
      (i.ascensionPath && i.ascensionPath !== path) ||
      !cost ||
      i.quality < cost.temper ||
      s.gold < cost.gold ||
      !Object.entries(cost.resources).every(([key, n]) => s.resources[key] >= n)
    )
      return false;
    s.gold -= cost.gold;
    for (const [key, n] of Object.entries(cost.resources))
      s.resources[key] -= n;
    i.ascension = ascensionTier(i) + 1;
    i.ascensionPath = path;
    return true;
  }
  if (action === "equip") {
    s.equipped[i.slot] = i.id;
    return true;
  }
  if (action === "salvage") {
    if (Object.values(s.equipped).includes(id)) return false;
    s.items = s.items.filter((v) => v.id !== id);
    s.resources.cobalt += 2;
    s.resources.essence += i.rarity === "rare" || i.rarity === "epic" ? 1 : 0;
    return true;
  }
  if (action === "temper") {
    if (s.resources.cobalt < 2 || s.gold < 50 || i.quality >= 20) return false;
    s.resources.cobalt -= 2;
    s.gold -= 50;
    i.quality++;
    s.professions.smithing += 10;
    return true;
  }
  if (action === "reroll") {
    if (s.resources.essence < 1) return false;
    s.resources.essence--;
    i.affixes = makeItem(seed, i.level, i.slot, i.rarity).affixes;
    return true;
  }
  return false;
}
export function questStatus(s, q) {
  const raw = q.stat === "passives" ? s.passives.length
    : q.stat === "discoveries" ? new Set(s.exploration?.discovered || []).size
    : q.stat === "nursery" ? s.nursery?.tier : s.statistics[q.stat];
  const value = Math.max(0, Number.isFinite(raw) ? raw : 0);
  const claimed = s.claimed.includes(q.id);
  const unlocked = (q.needs || []).every(id => s.claimed.includes(id));
  return { value, claimed, unlocked, ready: !claimed && unlocked && value >= q.goal };
}
export function claimQuest(s, id) {
  const q = QUESTS.find(q => q.id === id);
  if (!q || !questStatus(s, q).ready) return false;
  // Mark first: a repeat click or migrated claimed ID cannot award twice.
  s.claimed.push(id);
  s.gold += q.gold;
  s.crystals += q.crystals;
  for (const [key, count] of Object.entries(q.resources || {}))
    s.resources[key] = (s.resources[key] || 0) + count;
  addXP(s, q.xp || 0);
  return true;
}
export function summon(s, random = Math.random) {
  if (s.tickets > 0) s.tickets--;
  else if (s.crystals >= 160) s.crystals -= 160;
  else return null;
  let rarity = random() < 0.03 || s.pity >= 39 ? 5 : random() < 0.25 ? 4 : 3;
  const pool = HEROES.filter((h) =>
    rarity === 5
      ? ["celeste", "clarissa", "aurelia", "nyx"].includes(h.id)
      : rarity === 4
        ? ["kael", "lumi", "vexa", "orin"].includes(h.id)
        : ["mira", "riven", "sora", "tess"].includes(h.id),
  );
  const hero = pool[Math.floor(random() * pool.length)];
  const duplicate = s.heroes.includes(hero.id);
  if (!duplicate) s.heroes.push(hero.id);
  else s.cosmeticShards = (s.cosmeticShards || 0) + 2;
  s.pity = rarity === 5 ? 0 : s.pity + 1;
  return { ...hero, rarity, duplicate };
}

// An explicit, one-time starter grant makes the bow discipline testable on old saves.
export function recruitScout(s) {
  if (s.heroes.includes("sora")) return false;
  s.heroes.push("sora");
  return true;
}
