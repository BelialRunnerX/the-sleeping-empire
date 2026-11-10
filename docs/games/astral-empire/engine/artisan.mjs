// Elysium's two-slot matching/count logic is translated below. Workstations,
// recipes, wall-clock queues and the local-save economy are browser adaptations.
export const STATIONS = [
  {
    id: "foundry",
    name: "Cobalt foundry",
    icon: "⚒",
    x: -10,
    z: 5,
    cell: 0,
    color: 0xf1b56c,
    cost: { cobalt: 2, stone: 2, timber: 2 },
    desc: "Smelt ore into billets and infuse advanced alloys.",
  },
  {
    id: "joinery",
    name: "Lumenwood joinery",
    icon: "▧",
    x: -8,
    z: -6,
    cell: 1,
    color: 0x9ed6ab,
    cost: { timber: 2, stone: 1 },
    desc: "Prepare precision planks for equipment and upgrades.",
  },
  {
    id: "alchemy",
    name: "Starleaf laboratory",
    icon: "⚗",
    x: 9,
    z: 4,
    cell: 2,
    color: 0xc7a7f3,
    cost: { stone: 2, timber: 1, herb: 1 },
    desc: "Distil extracts and brew efficient recovery batches.",
  },
];
export const PROCESS_RECIPES = [
  {
    id: "refine-gold",
    name: "Gold ingot",
    station: "foundry",
    first: { id: "goldShard", count: 2 },
    second: { id: "stone", count: 1 },
    output: { id: "goldIngot", count: 1 },
    seconds: 10,
    profession: "smithing",
    xp: 20,
    tier: 1,
  },
  {
    id: "refine-silver",
    name: "Silver ingot",
    station: "foundry",
    first: { id: "silverShard", count: 2 },
    second: { id: "stone", count: 1 },
    output: { id: "silverIngot", count: 1 },
    seconds: 10,
    profession: "smithing",
    xp: 20,
    tier: 1,
  },
  {
    id: "electrum",
    name: "Electrum",
    station: "foundry",
    first: { id: "goldIngot", count: 1 },
    second: { id: "silverIngot", count: 1 },
    output: { id: "electrum", count: 1 },
    seconds: 8,
    profession: "smithing",
    xp: 25,
    tier: 2,
  },
  {
    id: "signal-alloy",
    name: "Signal alloy",
    station: "foundry",
    first: { id: "electrum", count: 1 },
    second: { id: "redstone", count: 2 },
    output: { id: "signalAlloy", count: 1 },
    seconds: 11,
    profession: "smithing",
    xp: 32,
    tier: 3,
  },
  {
    id: "billet",
    name: "Cobalt billet",
    station: "foundry",
    first: { id: "cobalt", count: 2 },
    second: { id: "stone", count: 1 },
    output: { id: "billet", count: 1 },
    seconds: 12,
    profession: "smithing",
    xp: 18,
    tier: 1,
  },
  {
    id: "plank",
    name: "Lumenwood planks ×2",
    station: "joinery",
    first: { id: "timber", count: 2 },
    second: { id: "stone", count: 1 },
    output: { id: "plank", count: 2 },
    seconds: 8,
    profession: "forestry",
    xp: 12,
    tier: 1,
  },
  {
    id: "extract",
    name: "Starleaf extract ×2",
    station: "alchemy",
    first: { id: "herb", count: 2 },
    second: { id: "fish", count: 1 },
    output: { id: "extract", count: 2 },
    seconds: 10,
    profession: "alchemy",
    xp: 18,
    tier: 1,
  },
  {
    id: "draughts",
    name: "Concentrated draught batch ×4",
    station: "alchemy",
    first: { id: "extract", count: 1 },
    second: { id: "herb", count: 1 },
    output: { id: "potions", count: 4 },
    seconds: 10,
    profession: "alchemy",
    xp: 20,
    tier: 1,
  },
  {
    id: "aether",
    name: "Aether alloy",
    station: "foundry",
    first: { id: "billet", count: 1 },
    second: { id: "extract", count: 1 },
    output: { id: "aether", count: 1 },
    seconds: 18,
    profession: "smithing",
    xp: 25,
    tier: 2,
  },
];
export const MATERIAL_NAMES = {
  goldShard: "Gold shards",
  silverShard: "Silver shards",
  redstone: "Redstone",
  rimeShard: "Rime shards",
  goldIngot: "Gold ingot",
  silverIngot: "Silver ingot",
  electrum: "Electrum",
  signalAlloy: "Signal alloy",
  cobalt: "Cobalt ore",
  stone: "Stone",
  timber: "Lumenwood",
  herb: "Starleaf",
  fish: "Moonfin",
  billet: "Cobalt billet",
  plank: "Lumenwood plank",
  extract: "Starleaf extract",
  aether: "Aether alloy",
  potions: "Draughts",
  essence: "Essence",
  meal: "Feast",
};
const integer = (v, max = 1e8) =>
  Math.min(
    max,
    Math.max(0, Math.floor(Number.isFinite(Number(v)) ? Number(v) : 0)),
  );
const moneyCost = (s, cost) =>
  Object.entries(cost).every(([id, count]) => (s.resources[id] || 0) >= count);
const pay = (s, cost, sign = -1) => {
  for (const [id, count] of Object.entries(cost))
    s.resources[id] = (s.resources[id] || 0) + sign * count;
};
export const stationCapacity = (tier) => [0, 3, 5, 8][integer(tier, 3)];
export const stationSpeed = (tier) => [1, 1, 1.25, 1.6][integer(tier, 3)];
export function processCost(recipe, quantity = 1) {
  const cost = {};
  for (const part of [recipe.first, recipe.second])
    cost[part.id] = (cost[part.id] || 0) + part.count * quantity;
  return cost;
}
// Adaptation of AlloyRecipe.matches/oneWay and takeFromLeft/takeFromRight:
// Minecraft Ingredient predicates are narrowed to exact browser material IDs.
export function matchAlloy(recipe, left, right) {
  const test = (a, b) =>
    a?.id === recipe.first.id &&
    a.count >= recipe.first.count &&
    b?.id === recipe.second.id &&
    b.count >= recipe.second.count;
  if (test(left, right))
    return { left: recipe.first.count, right: recipe.second.count };
  if (test(right, left))
    return { left: recipe.second.count, right: recipe.first.count };
  return null;
}
export function freshProduction() {
  return {
    serial: 1,
    lastTick: 0,
    stations: Object.fromEntries(
      STATIONS.map((d) => [
        d.id,
        { tier: 0, jobs: [], output: {}, xp: {}, completed: 0 },
      ]),
    ),
  };
}
export function normalizeProduction(input, now = Date.now()) {
  const p = freshProduction();
  p.lastTick = Math.min(integer(input?.lastTick, 1e14), now);
  for (const def of STATIONS) {
    const raw = input?.stations?.[def.id],
      target = p.stations[def.id];
    target.tier = integer(raw?.tier, 3);
    if (!target.tier) continue;
    for (const recipe of PROCESS_RECIPES.filter((r) => r.station === def.id)) {
      target.output[recipe.output.id] = integer(
        raw?.output?.[recipe.output.id],
        1e6,
      );
      target.xp[recipe.profession] = integer(raw?.xp?.[recipe.profession], 1e6);
    }
    target.completed = integer(raw?.completed, 1000);
    let previousEnd = 0;
    for (const job of (Array.isArray(raw?.jobs) ? raw.jobs : []).slice(
      0,
      stationCapacity(target.tier),
    )) {
      const recipe = PROCESS_RECIPES.find(
        (r) =>
          r.id === job?.recipe && r.station === def.id && r.tier <= target.tier,
      );
      if (!recipe) continue;
      const duration = Math.round(
        (recipe.seconds * 1000) / stationSpeed(target.tier),
      );
      const start =
        previousEnd || Math.min(integer(job.start, 1e14), now + 600000);
      target.jobs.push({
        id: p.serial++,
        recipe: recipe.id,
        start,
        end: start + duration,
      });
      previousEnd = start + duration;
    }
  }
  return p;
}
export function nearStation(s, id) {
  const def = STATIONS.find((d) => d.id === id);
  return (
    !!def &&
    s.realm === "bastion" &&
    Math.hypot((s.position?.x || 0) - def.x, (s.position?.z || 0) - def.z) <= 4
  );
}
export function upgradeCost(tier) {
  return tier === 1
    ? { gold: 250, materials: { plank: 2, billet: 1 } }
    : { gold: 600, materials: { plank: 2, aether: 1 } };
}
export function buildStation(s, id) {
  const def = STATIONS.find((d) => d.id === id),
    station = s.production?.stations[id];
  if (!def || !station || station.tier || !nearStation(s, id))
    return {
      ok: false,
      message: "Visit an unbuilt sanctuary workstation to construct it.",
    };
  if (!moneyCost(s, def.cost))
    return {
      ok: false,
      message: "Gather the workstation's construction materials first.",
    };
  pay(s, def.cost);
  station.tier = 1;
  s.statistics.workstations = (s.statistics.workstations || 0) + 1;
  return {
    ok: true,
    message: def.name + " constructed. Three queue slots are ready.",
  };
}
export function settleProduction(s, now = Date.now()) {
  const p = s.production;
  if (!p) return 0;
  now = Math.max(integer(now, 1e14), p.lastTick);
  p.lastTick = now;
  let completed = 0;
  for (const def of STATIONS) {
    const station = p.stations[def.id];
    while (station.jobs.length && station.jobs[0].end <= now) {
      const job = station.jobs.shift(),
        recipe = PROCESS_RECIPES.find((r) => r.id === job.recipe);
      if (!recipe) continue;
      station.output[recipe.output.id] =
        (station.output[recipe.output.id] || 0) + recipe.output.count;
      station.xp[recipe.profession] =
        (station.xp[recipe.profession] || 0) + recipe.xp;
      station.completed++;
      completed++;
    }
  }
  return completed;
}
export function enqueueProcessing(s, id, quantity = 1, now = Date.now()) {
  settleProduction(s, now);
  const recipe = PROCESS_RECIPES.find((r) => r.id === id),
    station = s.production?.stations[recipe?.station];
  if (
    !recipe ||
    !station ||
    station.tier < recipe.tier ||
    !nearStation(s, recipe.station)
  )
    return {
      ok: false,
      message: "Visit the required workstation and tier first.",
    };
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 3 ||
    station.jobs.length + quantity > stationCapacity(station.tier)
  )
    return {
      ok: false,
      message: "The production queue has no room for this batch.",
    };
  if (!moneyCost(s, processCost(recipe, quantity)))
    return { ok: false, message: "Gather both recipe inputs first." };
  const take = matchAlloy(
    recipe,
    { id: recipe.first.id, count: s.resources[recipe.first.id] },
    { id: recipe.second.id, count: s.resources[recipe.second.id] },
  );
  if (!take)
    return { ok: false, message: "The two inputs do not match this recipe." };
  pay(s, processCost(recipe, quantity));
  let start = Math.max(
    now,
    s.production.lastTick,
    station.jobs.at(-1)?.end || 0,
  );
  const duration = Math.round(
    (recipe.seconds * 1000) / stationSpeed(station.tier),
  );
  for (let i = 0; i < quantity; i++) {
    station.jobs.push({
      id: s.production.serial++,
      recipe: id,
      start,
      end: start + duration,
    });
    start += duration;
  }
  return {
    ok: true,
    message: recipe.name + " queued ×" + quantity + ". Inputs reserved.",
  };
}
export function cancelProcessing(s, stationId, jobId, now = Date.now()) {
  settleProduction(s, now);
  const station = s.production?.stations[stationId];
  if (!station || !nearStation(s, stationId))
    return { ok: false, message: "Visit the workstation to change its queue." };
  const index = station.jobs.findIndex((j) => j.id === jobId);
  if (index <= 0)
    return {
      ok: false,
      message: "An active or finished order cannot be cancelled.",
    };
  const [job] = station.jobs.splice(index, 1),
    recipe = PROCESS_RECIPES.find((r) => r.id === job.recipe);
  pay(s, processCost(recipe), 1);
  const duration = job.end - job.start;
  for (let i = index; i < station.jobs.length; i++) {
    station.jobs[i].start -= duration;
    station.jobs[i].end -= duration;
  }
  return {
    ok: true,
    message: "Waiting order cancelled; its exact inputs were returned.",
  };
}
export function collectProduction(s, id, now = Date.now()) {
  settleProduction(s, now);
  const station = s.production?.stations[id];
  if (!station || !nearStation(s, id))
    return {
      ok: false,
      message: "Visit the workstation to collect its output.",
    };
  if (!station.completed)
    return { ok: false, message: "No finished orders are ready." };
  const output = { ...station.output };
  pay(s, output, 1);
  for (const [profession, xp] of Object.entries(station.xp))
    s.professions[profession] += xp;
  s.statistics.processed = (s.statistics.processed || 0) + station.completed;
  station.output = {};
  station.xp = {};
  station.completed = 0;
  return {
    ok: true,
    message:
      "Collected " +
      Object.entries(output)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => n + " " + MATERIAL_NAMES[id])
        .join(", ") +
      ".",
    output,
  };
}
export function upgradeStation(s, id, now = Date.now()) {
  settleProduction(s, now);
  const station = s.production?.stations[id];
  if (!station || !station.tier || station.tier >= 3 || !nearStation(s, id))
    return {
      ok: false,
      message: "Visit a built workstation below tier three.",
    };
  if (station.jobs.length)
    return {
      ok: false,
      message: "Finish or cancel waiting orders before upgrading.",
    };
  const cost = upgradeCost(station.tier);
  if (s.gold < cost.gold || !moneyCost(s, cost.materials))
    return {
      ok: false,
      message: "Collect the upgrade's refined materials and gold first.",
    };
  s.gold -= cost.gold;
  pay(s, cost.materials);
  station.tier++;
  return {
    ok: true,
    message:
      "Workstation upgraded to tier " +
      station.tier +
      ". Future orders are faster.",
  };
}
