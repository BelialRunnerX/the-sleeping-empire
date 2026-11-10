// Each discipline has two inner and two outer circuits. Edges are undirected:
// the player can route through adjacent disciplines rather than buy a fixed chain.
const sectors = [
  [
    "Blade",
    [
      ["Edge calibration", "attackDamage", 0.018, "crit", 0.005],
      ["Hull breach", "penetration", 0.018, "power", 1.4],
      ["Cinder array", "elementalDamage", 0.018, "attackDamage", 0.012],
      ["Momentum drive", "haste", 0.014, "speed", 0.009],
    ],
  ],
  [
    "Psionics",
    [
      ["Psi circuit", "spellDamage", 0.022, "mana", 4],
      ["Phase shunt", "elementalPenetration", 0.016, "haste", 0.013],
      ["Spectrum lance", "elementalDamage", 0.02, "spellDamage", 0.016],
      ["Deep capacitor", "mana", 6, "recovery", 0.025],
    ],
  ],
  [
    "Defense",
    [
      ["Ceramic shell", "armor", 6, "life", 6],
      ["Deflector grid", "resistance", 0.012, "armorRate", 0.018],
      ["Bastion core", "life", 10, "armor", 7],
      ["Reactive plating", "armorRate", 0.023, "resistance", 0.01],
    ],
  ],
  [
    "Targeting",
    [
      ["Optic lattice", "crit", 0.008, "penetration", 0.01],
      ["Fracture analytics", "critMultiplier", 0.032, "power", 1.2],
      ["Rail alignment", "attackDamage", 0.018, "crit", 0.006],
      ["Overclock", "haste", 0.019, "critMultiplier", 0.024],
    ],
  ],
  [
    "Medtech",
    [
      ["Biofeedback", "recovery", 0.035, "life", 7],
      ["Adrenal bypass", "speed", 0.011, "haste", 0.011],
      ["Adaptive tissue", "life", 11, "resistance", 0.011],
      ["Emergency reserves", "mana", 5, "recovery", 0.04],
    ],
  ],
  [
    "Engineering",
    [
      ["Deep extraction", "yield", 0.085, "armor", 4],
      ["Precision fabrication", "fabrication", 0.021, "power", 1.2],
      ["Scavenger protocols", "yield", 0.1, "speed", 0.008],
      ["Composite design", "fabrication", 0.024, "armorRate", 0.015],
    ],
  ],
];
export const STAT_LABELS = {
  attackDamage: "attack damage",
  spellDamage: "spell damage",
  elementalDamage: "elemental damage",
  elementalPenetration: "elemental penetration",
  crit: "critical chance",
  critMultiplier: "critical damage",
  armorRate: "armor multiplier",
  haste: "cooldown recovery",
  speed: "movement speed",
  mana: "energy",
  yield: "gathering yield",
  fabrication: "crafted equipment power",
  power: "hit power",
  resistance: "elemental resistance",
};
const flat = new Set(["life", "mana", "power", "armor", "yield"]);
const desc = ([stat, value]) =>
  (value > 0 ? "+" : "−") +
  (flat.has(stat)
    ? +Math.abs(value).toFixed(2)
    : +Math.abs(value * 100).toFixed(1) + "%") +
  " " +
  (STAT_LABELS[stat] || stat);

export function buildConstellation(legacy, branches) {
  const nodes = [...legacy],
    edges = legacy.filter((n) => n.parent).map((n) => [n.parent, n.id]);
  const add = (id, name, x, y, mods, type, group, opposed) => {
    nodes.push({
      id,
      name,
      x,
      y,
      mods,
      type,
      group,
      opposed,
      desc: mods.map(desc).join(" · "),
    });
    return id;
  };
  const hubs = [],
    titles = [];
  sectors.forEach(([sector, clusters], i) => {
    const b = branches[i];
    titles.push({
      name: sector,
      x: Math.cos(b.angle) * 824,
      y: Math.sin(b.angle) * 824,
    });
    hubs[i] = [];
    clusters.forEach(([name, a, av, bStat, bv], j) => {
      const angle = b.angle + (j % 2 ? 0.26 : -0.26),
        radius = j < 2 ? 442 : 682;
      const x = Math.cos(angle) * radius,
        y = Math.sin(angle) * radius;
      const prefix = "web-" + i + "-" + j;
      const notable = add(
        prefix + "-core",
        name,
        x,
        y,
        [
          [a, av * 2.6],
          [bStat, bv * 2.6],
        ],
        "notable",
        sector,
      );
      const ring = [];
      for (let k = 0; k < 10; k++) {
        const t = angle + Math.PI + (k * Math.PI) / 5;
        const id = add(
          prefix + "-" + k,
          name + " " + (k + 1),
          x + Math.cos(t) * 64,
          y + Math.sin(t) * 64,
          k % 2 ? [[bStat, bv]] : [[a, av]],
          "minor",
          sector,
        );
        ring.push(id);
      }
      for (let k = 0; k < ring.length; k++)
        edges.push([ring[k], ring[(k + 1) % 10]]);
      edges.push([ring[3], notable], [ring[7], notable]);
      if (j < 2) {
        const tx = Math.cos(angle) * 330,
          ty = Math.sin(angle) * 330;
        const road = add(
          prefix + "-road",
          sector + " relay",
          tx,
          ty,
          [[bStat, bv * 0.65]],
          "road",
          sector,
        );
        edges.push([b.id + "4", road], [road, ring[0]]);
      } else {
        const tx = Math.cos(angle) * 562,
          ty = Math.sin(angle) * 562;
        const road = add(
          prefix + "-road",
          name + " relay",
          tx,
          ty,
          [[bStat, bv * 0.65]],
          "road",
          sector,
        );
        edges.push(["web-" + i + "-" + (j - 2) + "-5", road], [road, ring[0]]);
        const keyAngle = angle + (j % 2 ? 0.08 : -0.08);
        const doctrine = add(
          prefix + "-doctrine",
          name + " doctrine",
          Math.cos(keyAngle) * 785,
          Math.sin(keyAngle) * 785,
          [
            [a, av * 6],
            [bStat, -bv * 3],
          ],
          "doctrine",
          sector,
          "web-" + i + "-" + (j === 2 ? 3 : 2) + "-doctrine",
        );
        edges.push([ring[5], doctrine]);
      }
      hubs[i][j] = ring;
    });
    edges.push([hubs[i][0][3], hubs[i][1][7]], [hubs[i][2][3], hubs[i][3][7]]);
  });
  for (let i = 0; i < sectors.length; i++) {
    const next = (i + 1) % sectors.length;
    edges.push(
      [hubs[i][1][3], hubs[next][0][7]],
      [hubs[i][3][3], hubs[next][2][7]],
    );
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighbors = new Map(nodes.map((n) => [n.id, []]));
  for (const [a, b] of edges) {
    neighbors.get(a).push(b);
    neighbors.get(b).push(a);
  }
  return { nodes, edges, byId, neighbors, titles };
}
export function reachable(selected, neighbors) {
  const seen = new Set(["origin"]),
    queue = ["origin"];
  for (let i = 0; i < queue.length; i++)
    for (const id of neighbors.get(queue[i]) || [])
      if (selected.has(id) && !seen.has(id)) {
        seen.add(id);
        queue.push(id);
      }
  return queue.slice(1);
}
