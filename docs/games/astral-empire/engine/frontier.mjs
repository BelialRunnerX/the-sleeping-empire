import { numeric } from "./native.mjs";
import { fieldNoise, savedChunkFeature } from "./chunks.mjs";
const realms = ["bastion", "moon", "cinder", "frost", "orbit"];
const roll = (seed, x, z) =>
  numeric.world_hash(seed | 0, x | 0, z | 0) / 2 ** 32;
const smooth = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
export const enemySites = [
  [1, -18],
  [-10, -24],
  [12, -23],
  [-18, -37],
  [14, -42],
  [-6, -55],
  [24, -60],
  [-27, -61],
  [5, -75],
  [34, -28],
];
export const cottages = [
  { x: -13, z: -4, half: 3.2, height: 6 },
  { x: 13, z: -5, half: 3.2, height: 6 },
];
export const infrastructure = (realm) =>
  (realm === "orbit"
    ? [
        [-21, -12],
        [17, -26],
        [-31, 28],
        [45, -19],
        [9, 32],
      ]
    : [
        [-18, 8],
        [16, 9],
      ]
  ).map(([x, z]) => ({ x, z, radius: 0.62, height: 3.85 }));
const mix = (seed, realm) =>
  numeric.world_hash(seed | 0, realms.indexOf(realm), 1901);

export function terrainFor(seed, realm) {
  const key = mix(seed, realm);
  const a = roll(key, 1, 90) * 6.28,
    b = roll(key, 2, 90) * 6.28;
  return (x, z) => {
    const r = Math.hypot(x, z);
    if (r < 13) return 0;
    const hill =
      (Math.sin(x * 0.028) * Math.cos(z * 0.035) * 2 +
        Math.sin(z * 0.08 + x * 0.02) * 0.7) *
      Math.min(1, (r - 13) / 20);
    const wild =
      (Math.sin(x * 0.052 + z * 0.025 + a) * Math.cos(z * 0.056 + b) * 4.5 +
        Math.sin(x * 0.085 - z * 0.071 + b) * 1.25) *
      smooth((r - 22) / 32) *
      smooth((Math.hypot(x, z + 48) - 11) / 14);
    if (Math.abs(x - 30) < 5.8 && Math.abs(z - 6) < 1.25) return 0.05;
    const bank =
      smooth((5.8 - Math.abs(x - 30)) / 1.8) *
      (1 - smooth((Math.abs(z + 10) - 114) / 20));
    const relief =
      r < 110
        ? 0
        : smooth((r - 110) / 76) *
          ((fieldNoise(key, x, z, 220) - 0.45) * 38 +
            (fieldNoise(key ^ 0x5123, x, z, 72) - 0.5) * 11);
    return (
      ((realm === "moon" ? hill * 0.6 : hill) + wild + relief) * (1 - bank) -
      0.72 * bank
    );
  };
}

export function makeFrontier(seed, realm) {
  const key = mix(seed, realm);
  const nodes = [
    { kind: "ore", x: -7, z: 1 },
    { kind: "tree", x: -7, z: 7 },
    { kind: "herb", x: 6, z: 5 },
    { kind: "fish", x: 25, z: 6 },
  ];
  for (let i = 0; i < 50; i++) {
    const x = roll(seed, i, 41) * 170 - 85,
      z = roll(seed, i, 42) * 170 - 85;
    if (Math.hypot(x, z) < 15) continue;
    nodes.push({
      kind: ["ore", "tree", "herb", "fish"][i % 4],
      x: i % 4 === 3 ? 25 : x,
      z,
    });
  }
  const features = [],
    wilds = [],
    scenery = [
      {
        id: realm + "-cherry-0",
        kind: "tree",
        x: -8.8,
        z: -9.5,
        radius: 0.48,
        height: 5.8,
        scale: 1.15,
        blossom: true,
      },
      {
        id: realm + "-cherry-1",
        kind: "tree",
        x: 8.8,
        z: -9.5,
        radius: 0.48,
        height: 5.8,
        scale: 1.15,
        blossom: true,
      },
    ];
  const add = (kind, i, x, z) =>
    features.push({
      id: realm + "-" + kind + "-" + i,
      kind,
      x,
      z,
      name: {
        cache: "Survey cache",
        rubble: "Cobalt rubble",
        beacon: "Survey relay",
      }[kind],
      yield: 2 + Math.floor(roll(key, i, 218) * 3),
      radius: kind === "rubble" ? 1.35 : kind === "beacon" ? 0.65 : 0.8,
      height: kind === "beacon" ? 3.4 : 1.45,
    });
  // The starter discovery is safely separated from the plaza and old nodes.
  add("cache", 0, -5.8 + roll(key, 0, 207) * 1.2, -1.4 + roll(key, 0, 208));
  const heights = terrainFor(seed, realm);
  const biome = (x, z) => {
    if (Math.hypot(x, z) < 18) return "Dawnwake outpost";
    if (Math.abs(x - 30) < 7)
      return realm === "orbit" ? "Coolant trench" : "Glassing river";
    if (realm === "orbit")
      return heights(x, z) > 2 ? "Antenna ridge" : "Derelict platform";
    return heights(x, z) > 2.2
      ? "Basalt highlands"
      : heights(x, z) < -2
        ? "Crater basin"
        : realm === "frost"
          ? "Cryofields"
          : realm === "cinder"
            ? "Ash scrub"
            : realm === "moon"
              ? "Lunar barrens"
              : "Lumenwood frontier";
  };
  scenery.push({
    id: realm + "-wreck-0",
    kind: "wreck",
    x: 9,
    z: 13.8,
    radius: 0.95,
    height: 1.2,
    scale: 1,
  });
  const structures = infrastructure(realm);
  const occupied = [
    ...nodes,
    ...features,
    ...scenery,
    ...structures,
    ...enemySites.map(([x, z]) => ({ x, z })),
  ];
  for (const [type, count, salt] of [
    ["cache", 5, 211],
    ["beacon", 3, 311],
    ["rubble", 12, 411],
    ["wild", 5, 511],
    ["grove", 110, 611],
    ["boulder", 40, 711],
    ["wreck", 13, 811],
  ]) {
    const resource = ["grove", "boulder", "wreck"].includes(type);
    let i = type === "cache" || type === "wreck" ? 1 : 0;
    for (let attempt = 0; attempt < 1600 && i < count; attempt++) {
      const x = roll(key, attempt, salt) * 235 - 117.5;
      const z = roll(key, attempt, salt + 1) * 235 - 117.5;
      if (
        Math.hypot(x, z) < (type === "wild" ? 52 : 24) ||
        Math.abs(x - 30) < 9 ||
        Math.hypot(x, z + 48) < 16 ||
        (resource && Math.abs(x) < 4) ||
        occupied.some(
          (p) => Math.hypot(x - p.x, z - p.z) < (resource ? 4.1 : 6),
        )
      )
        continue;
      if (
        Math.abs(heights(x + 1, z) - heights(x - 1, z)) +
          Math.abs(heights(x, z + 1) - heights(x, z - 1)) >
        1.1
      )
        continue;
      if (type === "wild") wilds.push({ id: realm + "-wild-" + i, x, z });
      else if (resource) {
        const scale = 0.82 + roll(key, i, salt + 2) * 0.62;
        scenery.push({
          id: realm + "-" + type + "-" + i,
          kind: type === "grove" ? "tree" : type === "wreck" ? "wreck" : "rock",
          x,
          z,
          radius: (type === "grove" ? 0.41 : 1.12) * scale,
          height: (type === "grove" ? 5.2 : 1.3) * scale,
          scale,
        });
      } else add(type, i, x, z);
      occupied.push({ x, z });
      i++;
    }
  }
  return {
    height: heights,
    biome,
    structures,
    nodes: [
      ...nodes.map((n, i) => ({ ...n, id: realm + "-node-" + i })),
      ...scenery,
    ],
    features,
    wilds,
  };
}

export function normalizeExploration(raw, seed) {
  if (!raw?.discovered?.length && !raw?.changed?.length)
    return { discovered: [], changed: [] };
  const valid = new Set(
    realms.flatMap((realm) =>
      makeFrontier(seed, realm).features.map((f) => f.id),
    ),
  );
  const list = (value) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter((id) => valid.has(id) || savedChunkFeature(id, seed)),
          ),
        ]
      : [];
  return { discovered: list(raw?.discovered), changed: list(raw?.changed) };
}

export function discover(state, features, position) {
  const found = features.filter(
    (f) =>
      !state.exploration.discovered.includes(f.id) &&
      Math.hypot(f.x - position.x, f.z - position.z) < 20,
  );
  state.exploration.discovered.push(...found.map((f) => f.id));
  return found;
}

export function useFeature(state, feature, player) {
  if (!feature || Math.hypot(feature.x - player.x, feature.z - player.z) > 3.4)
    return { message: "Move closer first." };
  const explored = state.exploration;
  if (explored.changed.includes(feature.id))
    return feature.kind === "beacon"
      ? { returnHome: true, message: "Relay extraction · Dawnwake outpost" }
      : { message: "Already collected." };
  explored.changed.push(feature.id);
  if (!explored.discovered.includes(feature.id))
    explored.discovered.push(feature.id);
  if (feature.kind === "cache") {
    state.resources.herb += feature.yield;
    state.resources.essence += 1;
    return {
      xp: 25,
      message: `Cache opened · +${feature.yield} starleaf · +1 essence`,
    };
  }
  if (feature.kind === "rubble") {
    state.resources.stone += feature.yield;
    state.resources.cobalt += 1;
    return {
      xp: 15,
      message: `Rubble cleared · +${feature.yield} stone · +1 cobalt`,
    };
  }
  state.resources.telemetry +=
    1 + Math.floor(Math.sqrt(state.professions.surveying / 30) / 3);
  state.professions.surveying += 35;
  state.statistics.relays++;
  return {
    xp: 30,
    message:
      "Relay synchronized · Telemetry recovered · Use again to return to base",
  };
}
