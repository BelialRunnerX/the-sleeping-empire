import { cottages, LIMIT } from "./frontier.mjs";

export function obstacles(state, layout) {
  return [
    ...cottages,
    ...layout.structures,
    ...layout.features.filter(
      (f) => f.kind !== "rubble" || !state.exploration.changed.includes(f.id),
    ),
    ...layout.nodes.filter(
      (n) => n.radius && !(state.depleted[n.id] > Date.now()),
    ),
  ];
}
export function blocked(x, z, blockers, padding = 0.32) {
  return (
    Math.abs(x) > LIMIT ||
    Math.abs(z) > LIMIT ||
    blockers.some((o) =>
      o.half
        ? Math.abs(x - o.x) < o.half + padding &&
          Math.abs(z - o.z) < o.half + padding
        : (x - o.x) ** 2 + (z - o.z) ** 2 < (o.radius + padding) ** 2,
    )
  );
}
export function segmentClear(x, z, tx, tz, blockers) {
  const steps = Math.max(1, Math.ceil(Math.hypot(tx - x, tz - z) / 0.48));
  for (let i = 1; i <= steps; i++)
    if (
      blocked(x + ((tx - x) * i) / steps, z + ((tz - z) * i) / steps, blockers)
    )
      return false;
  return true;
}
export function walk(player, dx, dz, blockers) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.38));
  dx /= steps;
  dz /= steps;
  for (let i = 0; i < steps; i++) {
    if (!blocked(player.x + dx, player.z + dz, blockers)) {
      player.x += dx;
      player.z += dz;
    } else {
      if (!blocked(player.x + dx, player.z, blockers)) player.x += dx;
      if (!blocked(player.x, player.z + dz, blockers)) player.z += dz;
    }
  }
}
export function freeSpawn(point, blockers) {
  if (!blocked(point.x, point.z, blockers)) return point;
  for (let r = 1; r <= 12; r++)
    for (let i = 0; i < 16; i++) {
      const x = point.x + r * Math.cos((i * Math.PI) / 8),
        z = point.z + r * Math.sin((i * Math.PI) / 8);
      if (!blocked(x, z, blockers)) return { x, z };
    }
  return { x: 0, z: 6 };
}
export function routeTo(start, goal, blockers, reach = 0) {
  // Try the shortest unobstructed approach before searching a bounded grid.
  const d = Math.hypot(start.x - goal.x, start.z - goal.z);
  if (reach && d <= reach) return [];
  const ends = [];
  if (!blocked(goal.x, goal.z, blockers) && !reach) ends.push(goal);
  for (const r of reach
    ? [reach * 0.76, reach * 0.95]
    : ends.length
      ? []
      : [1, 2, 4])
    for (let i = 0; i < 16; i++) {
      const a =
        Math.atan2(start.z - goal.z, start.x - goal.x) + (i * Math.PI) / 8;
      const x = goal.x + Math.cos(a) * r,
        z = goal.z + Math.sin(a) * r;
      if (!blocked(x, z, blockers)) ends.push({ x, z });
    }
  if (!ends.length) return null;
  ends.sort(
    (a, b) =>
      Math.hypot(a.x - start.x, a.z - start.z) -
      Math.hypot(b.x - start.x, b.z - start.z),
  );
  for (const end of ends)
    if (segmentClear(start.x, start.z, end.x, end.z, blockers)) return [end];
  const cell = 1.5,
    key = (x, z) => x + ":" + z,
    open = [],
    best = new Map();
  const heuristic = (x, z) => Math.hypot(goal.x - x, goal.z - z);
  function queue(ix, iz, cost, parent) {
    const id = key(ix, iz);
    if ((best.get(id) ?? Infinity) <= cost) return;
    best.set(id, cost);
    open.push({
      ix,
      iz,
      x: ix * cell,
      z: iz * cell,
      cost,
      score: cost + heuristic(ix * cell, iz * cell),
      parent,
    });
  }
  const ix = Math.round(start.x / cell),
    iz = Math.round(start.z / cell);
  for (let x = ix - 1; x <= ix + 1; x++)
    for (let z = iz - 1; z <= iz + 1; z++)
      if (segmentClear(start.x, start.z, x * cell, z * cell, blockers))
        queue(x, z, Math.hypot(x * cell - start.x, z * cell - start.z), null);
  for (let expanded = 0; open.length && expanded < 2200; expanded++) {
    let min = 0;
    for (let i = 1; i < open.length; i++)
      if (open[i].score < open[min].score) min = i;
    const p = open[min];
    open[min] = open.at(-1);
    open.pop();
    if (best.get(key(p.ix, p.iz)) !== p.cost) continue;
    const end = ends.find(
      (e) =>
        Math.hypot(e.x - p.x, e.z - p.z) < 5 &&
        segmentClear(p.x, p.z, e.x, e.z, blockers),
    );
    if (end) {
      const route = [end];
      for (let q = p; q; q = q.parent) route.push({ x: q.x, z: q.z });
      route.reverse();
      const clean = [];
      let from = start;
      for (let i = 0; i < route.length; i++) {
        let j = i;
        while (
          j + 1 < route.length &&
          segmentClear(from.x, from.z, route[j + 1].x, route[j + 1].z, blockers)
        )
          j++;
        clean.push(route[j]);
        from = route[j];
        i = j;
      }
      return clean;
    }
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        if (
          (!dx && !dz) ||
          !segmentClear(p.x, p.z, p.x + dx * cell, p.z + dz * cell, blockers)
        )
          continue;
        queue(p.ix + dx, p.iz + dz, p.cost + Math.hypot(dx, dz) * cell, p);
      }
  }
  return null;
}
