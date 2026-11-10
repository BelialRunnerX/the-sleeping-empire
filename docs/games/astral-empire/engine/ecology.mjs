export const FIBRE_PLANTS = {
  loomflax: { name: "Loomflax", seed: "loomflaxSeed", resource: "loomflaxFibre", color: 0x8fd3e4 },
  downbloom: { name: "Downbloom", seed: "downbloomSeed", resource: "downbloomTuft", color: 0xffc1e8 },
};

export function fibreYield(tier, roll) {
  const worldTier = Math.max(0, tier);
  return (
    1 + (roll < worldTier / (worldTier + 10) ? Math.floor(worldTier / 6) : 0)
  );
}

// Pure port of FloraRules.fortuned; callers supply a roll in [0, 1).
export function fortuned(amount, fortune, roll) {
  if (fortune <= 0 || amount <= 0) return Math.max(0, amount);
  const multiplier = Math.floor(roll * (fortune + 2));
  return amount * Math.max(1, Math.min(multiplier, fortune + 1));
}

export function fibrePatch(realm, id, species, x, z) {
  return {
    id: realm + "-fibre-" + id,
    kind: "herb",
    species,
    name: FIBRE_PLANTS[species].name,
    x,
    z,
    height: 0.85,
  };
}

export const FIELD_ANIMALS = {
  fenstag: {
    height: 1.6,
    speed: 3.2,
    flight: 8,
    run: "Gallop",
    tint: 0xc2d9c8,
  },
  brackhide: { height: 0.9, speed: 2.4, flight: 5, run: "Run", tint: 0xbeb0ba },
};

export function localWildlife(realm) {
  if (realm === "orbit") return [];
  return [
    {
      id: realm + "-fenstag-outpost",
      species: "fenstag",
      x: 9,
      z: 15,
      phase: 1,
    },
    {
      id: realm + "-brackhide-outpost",
      species: "brackhide",
      x: -15,
      z: 14,
      phase: 4,
    },
  ];
}
