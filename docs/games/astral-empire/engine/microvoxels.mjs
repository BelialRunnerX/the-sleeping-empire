// Elysium resolution/address contracts, adapted to a bounded browser outcrop.
export const MICRO = 16, MICRO_VOLUME = 4096, PERSISTENCE_CHUNK = 32;
export const OUTCROP = { id: "dawnwake-micro-outcrop", name: "Microvoxel outcrop", x: 0, z: 14, type: "microvoxel", radius: 1.5, height: 2 };
export const OUTCROP_MIN = [-2 * MICRO, 0, 12 * MICRO];
export const OUTCROP_MAX = [2 * MICRO, 2 * MICRO, 16 * MICRO];

export function microAddress(p) {
  const block = p.map(n => Math.floor(n / MICRO));
  return {
    chunk: block.map(n => Math.floor(n / PERSISTENCE_CHUNK)),
    block: block.map(n => ((n % PERSISTENCE_CHUNK) + PERSISTENCE_CHUNK) % PERSISTENCE_CHUNK),
    micro: p.map((n, i) => n - block[i] * MICRO),
  };
}
export function editKey(p) {
  const a = microAddress(p);
  return [...a.chunk, ...a.block, ...a.micro].join(":");
}
export function baselineMicro(p) {
  const [x, y, z] = p.map(n => (n + .5) / MICRO);
  // Continuous material sampling, independent of whether the player has edited.
  return y >= 0 && ((x - OUTCROP.x) / 1.6) ** 2 + (y / 1.85) ** 2 + ((z - OUTCROP.z) / 1.6) ** 2 <= 1 ? 1 : 0;
}
export function normalizeMicrovoxels(raw) {
  const edits = {};
  for (const [k, value] of Object.entries(raw?.edits || {})) {
    const a = k.split(":").map(Number);
    if (a.length !== 9 || a.some(n => !Number.isSafeInteger(n)) || value !== 0) continue;
    if (a.slice(3, 6).some(n => n < 0 || n >= 32) || a.slice(6).some(n => n < 0 || n >= 16)) continue;
    const p = a.slice(0, 3).map((n, i) => (n * 32 + a[i + 3]) * 16 + a[i + 6]);
    if (baselineMicro(p) && p.every((n, i) => n >= OUTCROP_MIN[i] && n < OUTCROP_MAX[i])) edits[editKey(p)] = 0;
  }
  return { version: 1, edits, recoveredUnits: Object.keys(edits).length };
}
export function materialAt(store, p) {
  const k = editKey(p);
  return Object.hasOwn(store.edits, k) ? store.edits[k] : baselineMicro(p);
}
export function mineMicro(store, p) {
  if (!p.every(Number.isSafeInteger) || !materialAt(store, p)) return false;
  store.edits[editKey(p)] = 0;
  store.recoveredUnits++;
  return true;
}

// Integer-grid Amanatides/Woo traversal; distance is in world metres.
export function raycastMicro(store, origin, direction, maxDistance = 8) {
  const length = Math.hypot(...direction);
  if (!Number.isFinite(length) || length <= 0 || !origin.every(Number.isFinite) || !Number.isFinite(maxDistance) || maxDistance < 0) return null;
  const d = direction.map(n => n / length), p = origin.map(n => Math.floor(n * MICRO));
  const step = d.map(Math.sign);
  const delta = d.map(n => n ? 1 / (Math.abs(n) * MICRO) : Infinity);
  const next = d.map((n, i) => n ? ((p[i] + (n > 0 ? 1 : 0)) / MICRO - origin[i]) / n : Infinity);
  let distance = 0, normal = [0, 0, 0];
  while (distance <= maxDistance) {
    if (materialAt(store, p)) return { cell: [...p], distance, normal };
    const axis = next[0] <= next[1] && next[0] <= next[2] ? 0 : next[1] <= next[2] ? 1 : 2;
    distance = next[axis]; p[axis] += step[axis]; next[axis] += delta[axis];
    normal = [0, 0, 0]; normal[axis] = -step[axis];
  }
  return null;
}

export function boxOccupied(store, min, max) {
  const lo = min.map(n => Math.floor(n * MICRO));
  const hi = max.map(n => Math.ceil(n * MICRO) - 1);
  for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++)
    if (materialAt(store, [x, y, z])) return true;
  return false;
}

// Greedy coplanar surface quads. Neighbours use the same sampler (one-cell halo).
export function meshMicro(store, min = OUTCROP_MIN, max = OUTCROP_MAX) {
  const positions = [], normals = [];
  const lo = min.map(n => n - 1), size = max.map((n, i) => n - min[i] + 2);
  const dense = new Uint8Array(size[0] * size[1] * size[2]);
  const index = p => (p[0] - lo[0]) + size[0] * ((p[1] - lo[1]) + size[1] * (p[2] - lo[2]));
  for (let z = lo[2]; z <= max[2]; z++) for (let y = lo[1]; y <= max[1]; y++) for (let x = lo[0]; x <= max[0]; x++) {
    const p = [x, y, z]; dense[index(p)] = baselineMicro(p);
  }
  // Resolve sparse overrides once per mesh, rather than hash-probing six times per cell.
  for (const [k, value] of Object.entries(store.edits)) {
    const a = k.split(":").map(Number);
    const p = a.slice(0, 3).map((n, i) => (n * 32 + a[i + 3]) * 16 + a[i + 6]);
    if (p.every((n, i) => n >= lo[i] && n <= max[i])) dense[index(p)] = value;
  }
  const sample = p => dense[index(p)];
  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3, v = (axis + 2) % 3;
    const width = max[u] - min[u], height = max[v] - min[v];
    for (const sign of [-1, 1]) for (let slice = min[axis]; slice < max[axis]; slice++) {
      const mask = new Uint8Array(width * height);
      for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
        const p = [...min]; p[axis] = slice; p[u] += i; p[v] += j;
        const neighbor = [...p]; neighbor[axis] += sign;
        if (sample(p) && !sample(neighbor)) mask[j * width + i] = 1;
      }
      for (let j = 0; j < height; j++) for (let i = 0; i < width;) {
        if (!mask[j * width + i]) { i++; continue; }
        let w = 1, h = 1;
        while (i + w < width && mask[j * width + i + w]) w++;
        outer: while (j + h < height) {
          for (let k = 0; k < w; k++) if (!mask[(j + h) * width + i + k]) break outer;
          h++;
        }
        const p = [...min]; p[axis] = slice + (sign > 0 ? 1 : 0); p[u] += i; p[v] += j;
        const a = [...p], b = [...p], c = [...p]; a[u] += w; b[u] += w; b[v] += h; c[v] += h;
        const corners = sign > 0 ? [p, a, b, p, b, c] : [p, b, a, p, c, b];
        for (const corner of corners) { positions.push(...corner.map(n => n / MICRO)); const n = [0, 0, 0]; n[axis] = sign; normals.push(...n); }
        for (let y = 0; y < h; y++) mask.fill(0, (j + y) * width + i, (j + y) * width + i + w);
        i += w;
      }
    }
  }
  return { positions, normals, quads: positions.length / 18 };
}

// Use a ticket even for synchronous builds so delayed work cannot revive an unloaded view.
export class MeshPublication {
  revision = 0;
  disposed = false;
  begin() { return ++this.revision; }
  accepts(ticket) { return !this.disposed && ticket === this.revision; }
  dispose() { this.disposed = true; this.revision++; }
}
