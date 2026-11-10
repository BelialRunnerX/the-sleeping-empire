// GeodeRules.CHAIN in elysium-arcana. Aetherbound runs growth on wall time
// so a distant or unloaded bud progresses without a simulation tick.
export const GEODE_GROWTH_MS = 180000;
export const GEODE_STAGES = [
  "Small bud",
  "Medium bud",
  "Large bud",
  "Mature cluster",
];
export const GEODE_MATERIALS = {
  goldShard: {
    name: "Gold",
    color: 0xeac46c,
    region: "Emerald Bastion and High Orbit",
    purpose: "Refine into gold ingots for electrum.",
  },
  silverShard: {
    name: "Silver",
    color: 0xb8dae9,
    region: "Emerald Bastion and Pale Moon",
    purpose: "Refine into silver ingots for electrum.",
  },
  redstone: {
    name: "Redstone",
    color: 0xf67079,
    region: "Emerald Bastion and Cinderveil",
    purpose: "Combine with electrum to make signal alloy.",
  },
  rimeShard: {
    name: "Rime",
    color: 0x79e1fb,
    region: "Frostfall",
    purpose: "Build a frost-resistant Rime Shunt from signal alloy and rime.",
  },
};
const byRealm = {
  bastion: ["goldShard", "silverShard", "redstone"],
  moon: ["silverShard"],
  cinder: ["redstone"],
  frost: ["rimeShard"],
  orbit: ["goldShard"],
};
export function geodeMaterial(realm, index) {
  const available = byRealm[realm] || byRealm.bastion;
  return available[index % available.length];
}
export function geodeStage(readyAt, now = Date.now()) {
  if (!Number.isFinite(readyAt) || now >= readyAt) return 3;
  return Math.max(
    0,
    Math.min(
      2,
      Math.floor((now - readyAt + GEODE_GROWTH_MS) / (GEODE_GROWTH_MS / 3)),
    ),
  );
}
export function localGeodes(realm) {
  return [
    [-15, 12],
    [16, -10],
    [4, 19],
  ].map(([x, z], i) => ({
    id: realm + "-geode-" + i,
    kind: "geode",
    material: geodeMaterial(realm, i),
    x,
    z,
    radius: 0.76,
    height: 1.8,
  }));
}
export const GEODE_FRAMES = {
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
};
