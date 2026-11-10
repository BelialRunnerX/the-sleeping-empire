import { FIBRE_PLANTS } from "./ecology.mjs";

export const NURSERY = {
  id: "dawnwake-nursery",
  name: "Dawnwake hydroponics",
  x: -3.6,
  z: 10.5,
  radius: 1.65,
  height: 1.5,
};
export const CROP_STAGES = 8;
export const NURSERY_TIERS = [
  { plots: 0, interval: 0, cost: {} },
  { plots: 2, interval: 30_000, cost: { stone: 2, timber: 2, cobalt: 1 } },
  { plots: 4, interval: 20_000, cost: { billet: 2, plank: 2, circuitry: 2 } },
];

export function normalizeNursery(raw, now = Date.now()) {
  const tier = [1, 2].includes(raw?.tier) ? raw.tier : 0;
  const plots = Array.from(
    { length: NURSERY_TIERS[tier].plots },
    (_, index) => {
      const crop = Array.isArray(raw.plots) ? raw.plots[index] : null;
      if (
        !crop ||
        !Object.hasOwn(FIBRE_PLANTS, crop.species) ||
        ![1, 2].includes(crop.tier) ||
        crop.tier > tier ||
        !Number.isSafeInteger(crop.plantedAt) ||
        crop.plantedAt < 0
      )
        return null;
      return {
        species: crop.species,
        tier: crop.tier,
        plantedAt: Math.min(now, crop.plantedAt),
      };
    },
  );
  return { tier, plots };
}

export function cropStage(crop, now = Date.now()) {
  const elapsed = Math.max(0, now - crop.plantedAt);
  return Math.min(
    CROP_STAGES - 1,
    Math.floor(elapsed / NURSERY_TIERS[crop.tier].interval),
  );
}

export function cropReadyAt(crop) {
  return crop.plantedAt + (CROP_STAGES - 1) * NURSERY_TIERS[crop.tier].interval;
}

export function nearNursery(state, position = state.position) {
  return (
    state.realm === "bastion" &&
    Math.hypot(position.x - NURSERY.x, position.z - NURSERY.z) <= 4
  );
}

export function canAffordNursery(state, cost) {
  return Object.entries(cost).every(
    ([id, count]) => state.resources[id] >= count,
  );
}

export function buildNursery(state) {
  if (!nearNursery(state)) return false;
  const next = NURSERY_TIERS[state.nursery.tier + 1];
  if (!next || !canAffordNursery(state, next.cost)) return false;
  for (const [id, count] of Object.entries(next.cost))
    state.resources[id] -= count;
  state.nursery.tier++;
  while (state.nursery.plots.length < next.plots)
    state.nursery.plots.push(null);
  return true;
}

export function plantCrop(state, index, species, now = Date.now()) {
  if (
    !nearNursery(state) ||
    !Number.isInteger(index) ||
    state.nursery.plots[index] !== null ||
    !Object.hasOwn(FIBRE_PLANTS, species)
  )
    return false;
  const seed = FIBRE_PLANTS[species].seed;
  if (state.resources[seed] < 1) return false;
  state.resources[seed]--;
  state.nursery.plots[index] = {
    species,
    tier: state.nursery.tier,
    plantedAt: now,
  };
  return true;
}
