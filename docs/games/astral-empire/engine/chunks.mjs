import { numeric } from "./native.mjs";
import { geodeMaterial } from "./geodes.mjs";

export const CHUNK_SIZE = 40;
// Save validation guard for numerical precision, not a terrain or travel gate.
export const SAVE_COORDINATE_LIMIT = 2 ** 35;
export const CHUNK_RADIUS = 3;
const keyOf = (x, z) => x + ":" + z;
const fraction = (seed, x, z) =>
  numeric.world_hash(seed | 0, x | 0, z | 0) / 2 ** 32;
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
export function fieldNoise(seed, x, z, span) {
  const u = x / span,
    v = z / span,
    a = Math.floor(u),
    b = Math.floor(v);
  const sx = smooth(u - a),
    sz = smooth(v - b);
  return lerp(
    lerp(fraction(seed, a, b), fraction(seed, a + 1, b), sx),
    lerp(fraction(seed, a, b + 1), fraction(seed, a + 1, b + 1), sx),
    sz,
  );
}
export function generateChunk(seed, realm, cx, cz) {
  const key = keyOf(cx, cz);
  const salt = [...realm].reduce(
    (n, c) => Math.imul(n, 31) + c.charCodeAt(0),
    17,
  );
  const hash = numeric.world_hash((seed ^ salt) | 0, cx | 0, cz | 0);
  const biome = fieldNoise(
    seed ^ salt,
    (cx + 0.5) * CHUNK_SIZE,
    (cz + 0.5) * CHUNK_SIZE,
    155,
  );
  const types =
    biome < 0.33
      ? ["ore", "rock", "wreck", "rock", "herb"]
      : biome > 0.63
        ? ["tree", "tree", "herb", "tree", "wreck"]
        : ["tree", "rock", "ore", "herb", "wreck"];
  const nodes = types.flatMap((kind, i) => {
    const x = cx * CHUNK_SIZE + (i % 3) * 12 + 4 + fraction(hash, i, 1) * 7;
    const z =
      cz * CHUNK_SIZE + Math.floor(i / 3) * 18 + 5 + fraction(hash, i, 2) * 8;
    if (Math.max(Math.abs(x), Math.abs(z)) < 130) return [];
    const scale = 0.86 + fraction(hash, i, 4) * 0.52;
    return [
      {
        id: realm + "-sector-" + key + "-" + i,
        kind,
        x,
        z,
        scale,
        radius:
          (kind === "tree"
            ? 0.43
            : kind === "rock" || kind === "wreck"
              ? 0.9
              : 0.28) * scale,
        height: (kind === "tree" ? 5 : 1.3) * scale,
      },
    ];
  });
  const features = [];
  const frontier = nodes.length === types.length;
  if (frontier && fraction(hash, 15, 9) < 0.48)
    nodes.push({
      id: realm + "-crystal-" + key,
      kind: "geode",
      material: geodeMaterial(realm, Math.floor(fraction(hash, 16, 9) * 3)),
      x: cx * CHUNK_SIZE + 6,
      z: cz * CHUNK_SIZE + 33,
      radius: 0.76,
      height: 1.8,
    });
  if (frontier && fraction(hash, 8, 3) < 0.24) {
    const kind =
      fraction(hash, 9, 7) < 0.13
        ? "beacon"
        : fraction(hash, 10, 7) < 0.53
          ? "cache"
          : "rubble";
    features.push({
      id: realm + "-survey-" + key,
      x: cx * CHUNK_SIZE + 31,
      z: cz * CHUNK_SIZE + 31,
      kind,
      radius: kind === "rubble" ? 1.35 : 0.8,
      height: kind === "beacon" ? 3.4 : 1.45,
      yield: 2 + Math.floor(fraction(hash, 12, 2) * 4),
      name: {
        cache: "Expedition cache",
        beacon: "Deep survey relay",
        rubble: "Mineral debris",
      }[kind],
    });
  }
  const enemy =
    frontier && fraction(hash, 14, 3) < 0.36
      ? {
          id: realm + "-patrol-" + key,
          x: cx * CHUNK_SIZE + 28,
          z: cz * CHUNK_SIZE + 21,
          archetype:
            biome < 0.33 ? "drone" : biome > 0.63 ? "stalker" : "sentinel",
        }
      : null;
  return { key, cx, cz, nodes, features, enemy };
}
export function savedChunkFeature(id, seed) {
  if (typeof id !== "string") return null;
  const match =
    /^(bastion|moon|cinder|frost|orbit)-survey-(-?\d{1,10}):(-?\d{1,10})$/.exec(
      id,
    );
  if (
    !match ||
    Math.max(Math.abs(+match[2]), Math.abs(+match[3])) >
      SAVE_COORDINATE_LIMIT / CHUNK_SIZE
  )
    return null;
  return (
    generateChunk(seed, match[1], +match[2], +match[3]).features.find(
      (f) => f.id === id,
    ) ?? null
  );
}
export class ChunkWindow {
  constructor(seed, realm) {
    this.seed = seed;
    this.realm = realm;
    this.tiles = new Map();
    this.center = "";
  }
  update(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE),
      cz = Math.floor(z / CHUNK_SIZE);
    const center = keyOf(cx, cz);
    if (this.center === center) return false;
    this.center = center;
    const next = new Map();
    for (let i = cx - CHUNK_RADIUS; i <= cx + CHUNK_RADIUS; i++)
      for (let j = cz - CHUNK_RADIUS; j <= cz + CHUNK_RADIUS; j++) {
        const key = keyOf(i, j);
        next.set(
          key,
          this.tiles.get(key) || generateChunk(this.seed, this.realm, i, j),
        );
      }
    this.tiles = next;
    return true;
  }
}
