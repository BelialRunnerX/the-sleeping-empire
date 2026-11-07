// JavaScript reference path keeps old browsers and failed WASM loads playable.
export const numeric = {
  backend: "JavaScript reference",
  world_hash(seed, x, z) {
    let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  },
  world_tier(level, deepest) {
    return Math.max(0, Math.floor(level / 10), deepest);
  },
  ore_yield(tier, roll) {
    tier = Math.max(0, tier);
    return 1 + (roll < tier / (tier + 6) ? Math.floor(tier / 3) : 0);
  },
  resolve_damage(
    base,
    increased,
    more,
    armor,
    penetration,
    critical,
    critMultiplier,
  ) {
    let hit = base * (1 + increased) * more * (critical ? critMultiplier : 1),
      a = Math.max(0, armor * (1 - penetration));
    return hit * (1 - a / (a + 8 * hit + 1));
  },
};
export async function loadNative() {
  try {
    const response = await fetch(
      new URL("../native/simulation.wasm", import.meta.url),
    );
    if (!response.ok) throw Error(response.status);
    const { instance } = await WebAssembly.instantiate(
      await response.arrayBuffer(),
      {},
    );
    if (instance.exports.abi_version() !== 1) throw Error("Unsupported ABI");
    for (const key of ["world_tier", "ore_yield", "resolve_damage"])
      numeric[key] = instance.exports[key];
    numeric.world_hash = (seed, x, z) =>
      instance.exports.world_hash(seed, x, z) >>> 0;
    numeric.backend = "C++ / WebAssembly";
  } catch (error) {
    console.warn("Using numeric reference simulation:", error.message);
  }
  return numeric.backend;
}
