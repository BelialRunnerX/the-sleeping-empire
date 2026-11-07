import {
  HEROES,
  SKILLS,
  SUPPORTS,
  AFFIXES,
  PROFESSIONS,
  RECIPES,
  PASSIVES,
  QUESTS,
} from "./content.mjs";
import { numeric } from "./native.mjs";
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
  return {
    version: 3,
    seed,
    level: 1,
    xp: 0,
    gold: 1600,
    crystals: 2500,
    tickets: 6,
    pity: 0,
    hero: "kael",
    heroes: ["kael", "lumi", "mira", "tess"],
    heroLevels: { kael: 3, lumi: 2, mira: 3, tess: 1 },
    realm: "bastion",
    position: { x: 0, z: 6 },
    life: 300,
    mana: 120,
    resources: {
      cobalt: 0,
      stone: 0,
      timber: 0,
      herb: 0,
      fish: 0,
      essence: 2,
      potions: 5,
      meal: 0,
    },
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
    depleted: {},
    defeated: {},
    statistics: { kills: 0, gathers: 0, crafts: 0, bosses: 0 },
    claimed: [],
    deepest: 0,
    foodUntil: 0,
    lastSaved: 0,
  };
}
export function migrateState(input) {
  const fresh = freshState(finite(input?.seed || input?.sandbox?.seed, 438102));
  if (!input || typeof input !== "object") return fresh;
  if (input.version === 3) {
    const s = { ...fresh, ...input, version: 3 };
    for (const key of [
      "level",
      "xp",
      "gold",
      "crystals",
      "tickets",
      "pity",
      "deepest",
      "foodUntil",
    ])
      s[key] = clamp(finite(s[key], fresh[key]), 0, 1e9);
    s.level = clamp(Math.floor(s.level), 1, 100);
    s.hero = HEROES.some((h) => h.id === s.hero) ? s.hero : "kael";
    s.heroes = Array.isArray(s.heroes)
      ? s.heroes.filter((id) => HEROES.some((h) => h.id === id))
      : fresh.heroes;
    if (!s.heroes.includes(s.hero)) s.heroes.push(s.hero);
    s.resources = { ...fresh.resources };
    for (const k of Object.keys(fresh.resources))
      s.resources[k] = clamp(Math.floor(finite(input.resources?.[k])), 0, 1e8);
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
      x: clamp(finite(input.position?.x), -140, 140),
      z: clamp(finite(input.position?.z, 6), -140, 140),
    };
    s.items = Array.isArray(input.items)
      ? input.items
          .filter((i) => i && ["weapon", "armor", "charm"].includes(i.slot))
          .slice(0, 200)
          .map((i) => ({
            ...i,
            name: String(i.name || "Relic").slice(0, 60),
            base: clamp(finite(i.base, 10), 1, 500),
            quality: clamp(finite(i.quality), 0, 20),
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
    for (const slot of ["weapon", "armor", "charm"])
      if (
        s.items.some((i) => i.id === input.equipped?.[slot] && i.slot === slot)
      )
        s.equipped[slot] = input.equipped[slot];
    s.passives = [];
    for (const p of PASSIVES)
      if (
        input.passives?.includes(p.id) &&
        (p.parent === "origin" || s.passives.includes(p.parent)) &&
        s.passives.length < s.level + 3
      )
        s.passives.push(p.id);
    s.links = {};
    for (const skill of SKILLS) {
      const links = input.links?.[skill.id];
      s.links[skill.id] = Array.isArray(links)
        ? links
            .slice(0, 2)
            .map((id) => (SUPPORTS.some((v) => v.id === id) ? id : "none"))
        : ["none", "none"];
    }
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
    s.realm = ["bastion", "moon", "cinder", "frost"].includes(input.realm)
      ? input.realm
      : "bastion";
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
  const hero = HEROES.find((h) => h.id === s.hero) || HEROES[0],
    v = {
      life: 300 + (s.level - 1) * 28,
      mana: 120,
      damage: 0.0,
      armor: 18,
      armorRate: 0,
      crit: 0.08,
      critMultiplier: 1.6,
      haste: 0,
      recovery: 0,
      penetration: 0,
      speed: 0,
      yield: 0,
      power: 26 + (s.level - 1) * 3,
      keystones: [],
    };
  v[hero.stat] = (v[hero.stat] || 0) + hero.value;
  for (const p of PASSIVES.filter((p) => s.passives.includes(p.id))) {
    if (p.stat === "keystone") v.keystones.push(p.value);
    else v[p.stat] += p.value;
  }
  for (const item of s.items.filter((i) =>
    Object.values(s.equipped).includes(i.id),
  )) {
    const base = item.base * (1 + item.quality * 0.04);
    if (item.slot === "weapon") v.power += base;
    if (item.slot === "armor") v.armor += base;
    if (item.slot === "charm") v.mana += base;
    for (const a of item.affixes) v[a.stat] = (v[a.stat] || 0) + a.value;
  }
  if (s.foodUntil > now) {
    v.life += 60;
    v.recovery += 0.35;
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
  return v;
}
export function skillStats(s, id) {
  const skill = SKILLS.find((k) => k.id === id);
  if (!skill) return null;
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
  };
  const used = new Set();
  for (const name of s.links[id] || []) {
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
export function allocate(s, id) {
  const p = PASSIVES.find((p) => p.id === id);
  if (
    !p ||
    id === "origin" ||
    s.passives.includes(id) ||
    s.passives.length >= s.level + 3 ||
    (p.parent !== "origin" && !s.passives.includes(p.parent))
  )
    return false;
  s.passives.push(id);
  return true;
}
export function refund(s, id) {
  if (
    !s.passives.includes(id) ||
    PASSIVES.some((p) => p.parent === id && s.passives.includes(p.id))
  )
    return false;
  s.passives = s.passives.filter((x) => x !== id);
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
export function gather(s, node, now = Date.now()) {
  const job = PROFESSIONS.find((p) => p.node === node.kind);
  if (!job || s.depleted[node.id] > now)
    return { ok: false, message: "This resource is recovering." };
  const mastery = professionLevel(s, job.id),
    st = stats(s),
    tier = numeric.world_tier(s.level, s.deepest);
  let count =
    numeric.ore_yield(tier, roll(s.seed, s.statistics.gathers, 9)) +
    Math.floor(mastery / 3) +
    Math.floor(st.yield) +
    (st.keystones.includes("artisan") ? 1 : 0);
  s.resources[job.resource] = (s.resources[job.resource] || 0) + count;
  if (job.id === "mining") s.resources.stone += count;
  s.professions[job.id] += 20;
  s.statistics.gathers++;
  s.depleted[node.id] = now + 180000;
  addXP(s, 15);
  return {
    ok: true,
    message: "+" + count + " " + job.resource + " · " + job.name + " +20 XP",
  };
}
export function craft(s, id, seed = Date.now()) {
  const recipe = RECIPES.find((r) => r.id === id);
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
    const item = makeItem(seed, s.level, recipe.type);
    item.base = Math.round(
      item.base * (1 + (professionLevel(s, "smithing") - 1) * 0.03),
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
export function claimQuest(s, id) {
  const q = QUESTS.find((q) => q.id === id),
    value = q?.stat === "passives" ? s.passives.length : s.statistics[q?.stat];
  if (!q || s.claimed.includes(id) || value < q.goal) return false;
  s.claimed.push(id);
  s.gold += q.gold;
  s.crystals += q.crystals;
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
  else s.resources.essence += 2;
  s.pity = rarity === 5 ? 0 : s.pity + 1;
  return { ...hero, rarity, duplicate };
}

export class Simulation {
  constructor(state) {
    this.state = state;
    this.player = {
      ...state.position,
      y: 0,
      facing: Math.PI,
      hp: clamp(finite(state.life, stats(state).life), 1, stats(state).life),
      mana: clamp(finite(state.mana, stats(state).mana), 0, stats(state).mana),
      stamina: 100,
      invulnerable: 0,
      dodge: 0,
      jump: 0,
      velocityY: 0,
    };
    this.enemies = [];
    this.cooldowns = {};
    this.events = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.clock = 0;
    this.effectId = 0;
    this.potionCD = 0;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  spawn(id, x, z, boss = false) {
    const st = this.state,
      level = st.level,
      hp = (boss ? 1400 : 140) * (1 + st.deepest * 0.4);
    this.enemies.push({
      id,
      x,
      z,
      homeX: x,
      homeZ: z,
      hp,
      max: hp,
      armor: boss ? 55 : 18,
      level,
      boss,
      phase: "idle",
      timer: 0,
      cooldown: 1,
      stagger: 0,
      aura: null,
      burn: 0,
      burnTime: 0,
      respawnAt: st.defeated[id] || 0,
    });
  }
  nearest(range = 22) {
    let nearest = null,
      best = range;
    for (const e of this.enemies)
      if (e.hp > 0) {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d < best) {
          nearest = e;
          best = d;
        }
      }
    return nearest;
  }
  attack(id) {
    const skill = skillStats(this.state, id),
      p = this.player,
      st = stats(this.state);
    if (!skill || this.cooldowns[id] > 0 || p.mana < skill.cost || p.hp <= 0)
      return false;
    p.mana -= skill.cost;
    this.cooldowns[id] = skill.cooldown;
    const target =
      this.locked?.hp > 0
        ? this.locked
        : this.nearest(skill.range || skill.radius);
    if (target) p.facing = Math.atan2(target.x - p.x, target.z - p.z);
    if (id === "strike") {
      this.combo = this.comboTimer > 0 ? (this.combo + 1) % 3 : 0;
      this.comboTimer = 1.6;
    }
    if (id === "dash") {
      const travel = target
        ? Math.max(
            0,
            Math.min(7, Math.hypot(target.x - p.x, target.z - p.z) - 1.6),
          )
        : 7;
      p.x = clamp(p.x + Math.sin(p.facing) * travel, -140, 140);
      p.z = clamp(p.z + Math.cos(p.facing) * travel, -140, 140);
      p.invulnerable = 0.5;
    }
    this.emit("skill", {
      id,
      x: p.x,
      z: p.z,
      facing: p.facing,
      radius: skill.radius,
    });
    const targets = this.enemies.filter(
      (e) =>
        e.hp > 0 &&
        (skill.range > 0
          ? e === target
          : Math.hypot(e.x - p.x, e.z - p.z) <= skill.radius),
    );
    for (const e of targets) {
      if (id === "strike" && Math.hypot(e.x - p.x, e.z - p.z) > skill.range)
        continue;
      const critical = Math.random() < st.crit,
        more =
          skill.damage *
          (id === "strike" && this.combo === 2 ? 1.55 : 1) *
          (skill.execute && e.hp / e.max < 0.35 ? 1.45 : 1) *
          (st.keystones.includes("fracture") && !critical ? 0.9 : 1);
      let amount = numeric.resolve_damage(
        st.power * skill.power,
        st.damage,
        more,
        e.armor,
        st.penetration,
        critical ? 1 : 0,
        st.critMultiplier,
      );
      if (skill.echo) amount *= 1.6;
      const element = HEROES.find((h) => h.id === this.state.hero).element;
      if (e.aura && e.aura !== element) {
        amount *= 1.3;
        this.emit("reaction", {
          text:
            element === "Tide"
              ? "STEAM BREAK"
              : element === "Volt"
                ? "OVERLOAD"
                : "RESONANCE",
          x: e.x,
          z: e.z,
        });
      }
      e.aura = element;
      if (skill.burn) {
        e.burnTime = 4;
        e.burn = st.power * skill.power * 0.225;
      }
      e.hp -= amount;
      e.stagger = id === "strike" && this.combo === 2 ? 0.8 : 0.12;
      p.hp = Math.min(st.life, p.hp + amount * skill.leech);
      if (e.phase === "idle") e.phase = "chase";
      this.emit("damage", {
        amount: Math.round(amount),
        critical,
        x: e.x,
        z: e.z,
      });
      if (e.hp <= 0) this.kill(e);
    }
    return true;
  }
  kill(e) {
    if (e.rewarded) return;
    e.rewarded = true;
    e.hp = 0;
    e.respawnAt = Date.now() + (e.boss ? 600000 : 90000);
    this.state.defeated[e.id] = e.respawnAt;
    this.state.statistics.kills++;
    if (e.boss) this.state.statistics.bosses++;
    this.state.gold += e.boss ? 250 : 20;
    this.state.crystals += e.boss ? 120 : 8;
    const levels = addXP(this.state, e.boss ? 180 : 35);
    if (e.boss || Math.random() < 0.3) {
      const i = makeItem(
        Date.now() + hash(this.state.seed, this.state.statistics.kills, 4),
        this.state.level,
        ["weapon", "armor", "charm"][this.state.statistics.kills % 3],
        e.boss ? "epic" : "rare",
      );
      if (this.state.items.length < 200) this.state.items.push(i);
      this.emit("loot", { text: i.rarity.toUpperCase() + " · " + i.name });
    }
    this.emit("kill", { boss: e.boss, levels });
  }
  dodge(dx = 0, dz = 0) {
    if (this.player.stamina < 30 || this.player.dodge > 0) return false;
    const p = this.player;
    p.stamina -= 30;
    p.dodge = 0.28;
    p.invulnerable = 0.42;
    if (dx || dz) p.facing = Math.atan2(dx, dz);
    this.emit("dodge");
    return true;
  }
  heal() {
    if (this.state.resources.potions <= 0 || this.potionCD > 0) return false;
    this.state.resources.potions--;
    this.player.hp = Math.min(
      stats(this.state).life,
      this.player.hp + stats(this.state).life * 0.45,
    );
    this.potionCD = 12;
    this.emit("heal");
    return true;
  }
  tick(dt, input = {}) {
    dt = clamp(dt, 0, 0.05);
    this.clock += dt;
    const p = this.player,
      st = stats(this.state);
    for (const k of Object.keys(this.cooldowns))
      this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    this.comboTimer -= dt;
    this.potionCD = Math.max(0, this.potionCD - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.stamina = Math.min(100, p.stamina + 19 * dt);
    p.mana = Math.min(st.mana, p.mana + 8 * (1 + st.recovery) * dt);
    p.hp = Math.min(
      st.life,
      p.hp +
        st.life *
          (st.keystones.includes("wellspring") ? 0.02 : 0.002) *
          (1 + st.recovery) *
          dt,
    );
    let dx = input.x || 0,
      dz = input.z || 0,
      len = Math.hypot(dx, dz);
    if (len > 1) {
      dx /= len;
      dz /= len;
    }
    const movement = !!len,
      speed = 6.2 * (1 + st.speed) * (input.sprint ? 1.35 : 1);
    if (p.dodge > 0) {
      dx = Math.sin(p.facing) * 3.2;
      dz = Math.cos(p.facing) * 3.2;
      p.dodge -= dt;
    } else if (movement) p.facing = Math.atan2(dx, dz);
    if (p.hp > 0) {
      p.x = clamp(p.x + dx * speed * dt, -140, 140);
      p.z = clamp(p.z + dz * speed * dt, -140, 140);
    }
    if (p.y > 0 || p.velocityY > 0) {
      p.velocityY -= 20 * dt;
      p.y = Math.max(0, p.y + p.velocityY * dt);
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) {
        if (e.respawnAt <= Date.now()) {
          e.hp = e.max;
          e.rewarded = false;
          e.x = e.homeX;
          e.z = e.homeZ;
          e.phase = "idle";
        }
        continue;
      }
      if (e.respawnAt > Date.now() && !e.rewarded) {
        e.hp = 0;
        continue;
      }
      e.stagger = Math.max(0, e.stagger - dt);
      e.cooldown -= dt;
      if (e.burnTime > 0) {
        e.burnTime -= dt;
        e.hp -= e.burn * dt;
        if (e.hp <= 0) {
          this.kill(e);
          continue;
        }
      }
      const d = Math.hypot(e.x - p.x, e.z - p.z),
        home = Math.hypot(e.x - e.homeX, e.z - e.homeZ);
      if (e.phase === "windup") {
        e.timer -= dt;
        if (e.timer <= 0) {
          if (d < (e.boss ? 6 : 3.3) && p.invulnerable <= 0) {
            const amount = numeric.resolve_damage(
              e.boss ? 75 : 24,
              0,
              1,
              st.armor,
              0,
              0,
              1,
            );
            p.hp -= amount;
            this.emit("hurt", { amount: Math.round(amount) });
          }
          e.phase = "recover";
          e.timer = e.boss ? 1.1 : 0.7;
        }
        continue;
      }
      if (e.phase === "recover") {
        e.timer -= dt;
        if (e.timer <= 0) e.phase = "chase";
        continue;
      }
      if (home > 28 || d > 27) {
        e.phase = "idle";
        const back = Math.hypot(e.homeX - e.x, e.homeZ - e.z);
        if (back > 0.1) {
          e.x += ((e.homeX - e.x) / back) * dt * 4;
          e.z += ((e.homeZ - e.z) / back) * dt * 4;
        }
        continue;
      }
      if (d < (e.boss ? 18 : 13)) e.phase = "chase";
      if (e.phase === "chase" && e.stagger <= 0) {
        if (d < (e.boss ? 5.5 : 2.7) && e.cooldown <= 0) {
          e.phase = "windup";
          e.timer = e.boss ? 1.3 : 0.8;
          e.cooldown = e.boss ? 3 : 2;
          this.emit("windup", { enemy: e });
        } else if (d > 2) {
          e.x += ((p.x - e.x) / d) * dt * (e.boss ? 2.2 : 3.1);
          e.z += ((p.z - e.z) / d) * dt * (e.boss ? 2.2 : 3.1);
        }
      }
    }
    if (p.hp <= 0) {
      p.hp = st.life;
      p.mana = st.mana;
      p.x = 0;
      p.z = 6;
      this.state.gold = Math.max(0, this.state.gold - 40);
      this.emit("death");
      for (const e of this.enemies) e.phase = "idle";
    }
    this.state.position = { x: p.x, z: p.z };
    this.state.life = p.hp;
    this.state.mana = p.mana;
  }
}
