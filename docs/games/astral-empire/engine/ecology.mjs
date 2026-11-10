export const FIBRE_PLANTS = {
  loomflax: { name: "Loomflax", resource: "loomflaxFibre", color: 0x8fd3e4 },
  downbloom: { name: "Downbloom", resource: "downbloomTuft", color: 0xffc1e8 },
};

export function fibreYield(tier, roll) {
  const worldTier = Math.max(0, tier);
  return (
    1 + (roll < worldTier / (worldTier + 10) ? Math.floor(worldTier / 6) : 0)
  );
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
