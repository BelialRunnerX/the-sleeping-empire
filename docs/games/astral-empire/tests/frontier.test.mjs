import { test } from "node:test";
import assert from "node:assert/strict";
import { makeFrontier, discover, useFeature } from "../engine/frontier.mjs";
import {
  blocked,
  routeTo,
  segmentClear,
  obstacles,
  walk,
} from "../engine/navigation.mjs";
import { CameraRig, clearBoom } from "../engine/camera.mjs";
import {
  Simulation,
  freshState,
  migrateState,
  stats,
  skillStats,
  gather,
  craft,
  allocate,
  refund,
  summon,
} from "../engine/simulation.mjs";
import { CONSTELLATION } from "../engine/content.mjs";
import { reachable } from "../engine/constellation.mjs";
import {
  RACES,
  CLASSES,
  earnedPassives,
  earnedAttributes,
  passiveBudget,
  attributeBudget,
  assignAttribute,
  attributeTotals,
} from "../engine/codex.mjs";

test("frontier generation varies by seed and realm without moving legacy node IDs", () => {
  const a = makeFrontier(438102, "bastion"),
    b = makeFrontier(438102, "bastion");
  assert.deepEqual(a.nodes, b.nodes);
  assert.deepEqual(a.features, b.features);
  assert.notDeepEqual(a.features, makeFrontier(438103, "bastion").features);
  assert.notDeepEqual(a.features, makeFrontier(438102, "moon").features);
  assert.equal(a.height(0, 6), 0);
  assert.equal(a.height(30, 6), 0.05);
  assert.notEqual(
    a.height(-70, 70),
    makeFrontier(438103, "bastion").height(-70, 70),
  );
  assert.deepEqual(
    a.nodes.slice(0, 4).map(({ id, x, z }) => [id, x, z]),
    [
      ["bastion-node-0", -7, 1],
      ["bastion-node-1", -7, 7],
      ["bastion-node-2", 6, 5],
      ["bastion-node-3", 25, 6],
    ],
  );
  assert.equal(a.features.length, 20);
  assert.ok(a.nodes.filter((n) => n.kind === "tree").length > 110);
  assert.equal(a.nodes.filter((n) => n.kind === "rock").length, 40);
  for (const f of a.features.slice(1)) {
    assert.ok(Math.abs(f.x - 30) >= 9 && Math.hypot(f.x, f.z) >= 24);
    assert.ok(a.nodes.every((n) => Math.hypot(n.x - f.x, n.z - f.z) > 4));
  }
});
test("cache, rubble and relay rewards are single-use and reload with the same layout", () => {
  const s = freshState(88),
    layout = makeFrontier(s.seed, s.realm);
  const cache = layout.features[0],
    rubble = layout.features.find((f) => f.kind === "rubble"),
    relay = layout.features.find((f) => f.kind === "beacon");
  assert.ok(discover(s, layout.features, s.position).includes(cache));
  assert.equal(useFeature(s, rubble, s.position).xp, undefined);
  assert.equal(useFeature(s, cache, cache).xp, 25);
  assert.equal(useFeature(s, cache, cache).xp, undefined);
  assert.equal(s.resources.essence, 3);
  assert.ok(blocked(rubble.x, rubble.z, obstacles(s, layout)));
  useFeature(s, rubble, rubble);
  assert.ok(!blocked(rubble.x, rubble.z, obstacles(s, layout)));
  assert.equal(useFeature(s, relay, relay).xp, 30);
  assert.equal(useFeature(s, relay, relay).returnHome, true);
  assert.equal(s.resources.telemetry, 1);
  const loaded = migrateState({
    ...s,
    exploration: {
      ...s.exploration,
      changed: [...s.exploration.changed, "unknown"],
    },
  });
  assert.deepEqual(loaded.exploration, s.exploration);
  assert.equal(useFeature(loaded, cache, cache).xp, undefined);
});
test("trees, boulders and wreckage deplete, restore and feed fabrication", () => {
  const s = freshState(),
    layout = makeFrontier(s.seed, s.realm);
  const now = Date.now(),
    tree = layout.nodes.find((n) => n.id.endsWith("cherry-0"));
  const rock = layout.nodes.find((n) => n.kind === "rock");
  const wreck = layout.nodes.find((n) => n.kind === "wreck");
  assert.ok(
    gather(s, tree, now).ok &&
      gather(s, rock, now).ok &&
      gather(s, wreck, now).ok,
  );
  assert.equal(s.resources.cobalt, 0);
  assert.ok(
    s.resources.stone > 0 &&
      s.resources.timber > 0 &&
      s.resources.circuitry > 0,
  );
  assert.ok(
    !obstacles(s, layout).some(
      (n) => n.id === tree.id || n.id === rock.id || n.id === wreck.id,
    ),
  );
  const reloaded = migrateState(s);
  assert.equal(gather(reloaded, tree, now + 1000).ok, false);
  assert.equal(gather(reloaded, tree, now + 180001).ok, true);
  reloaded.resources.circuitry = 2;
  reloaded.resources.cobalt = 1;
  assert.equal(craft(reloaded, "capacitor").ok, true);
  assert.equal(reloaded.resources.capacitor, 1);
  reloaded.shieldUntil = now + 600000;
  assert.equal(migrateState(reloaded).shieldUntil, reloaded.shieldUntil);
  assert.ok(
    stats(reloaded, now).resistance > stats(reloaded, now + 600001).resistance,
  );
});
test("navigation paths skirt solid props and dash steps do not tunnel through them", () => {
  const obstacle = [{ x: 0, z: 0, half: 3.2, height: 5 }];
  const start = { x: -6, z: 0 },
    goal = { x: 6, z: 0 };
  const route = routeTo(start, goal, obstacle);
  assert.ok(route.length > 1);
  let current = start;
  for (const end of route) {
    assert.ok(segmentClear(current.x, current.z, end.x, end.z, obstacle));
    current = end;
  }
  assert.deepEqual(current, goal);
  const player = { ...start };
  walk(player, 18, 0, obstacle);
  assert.ok(player.x < -3.2);
  assert.deepEqual(routeTo(start, goal, []), [goal]);
});
test("camera clamps input, shortens on obstruction and recovers smoothly", () => {
  const rig = new CameraRig({ yaw: 0, pitch: 0.05, distance: 10 });
  const player = { x: 0, z: 0 },
    height = () => 0,
    blocker = [{ x: 0, z: 5, half: 1, height: 5 }];
  const pose = rig.update(0.05, player, {}, height, blocker);
  assert.ok(pose.eye.z < 4);
  assert.equal(
    clearBoom({ x: 0, y: 2, z: 0 }, { x: 0, y: 0, z: 8 }, height, []),
    1,
  );
  const recovered = rig.update(0.05, player, {}, height, []);
  assert.ok(recovered.eye.z > pose.eye.z && recovered.eye.z < 8);
  rig.zoom(99);
  rig.orbit(1, 0.4);
  assert.equal(rig.goal.distance, 22);
  assert.equal(rig.update(0.03, player, {}, height, [], true).eye.x > 0, true);
  rig.translate(50, 0);
  assert.ok(Math.abs(rig.pan.x) <= 12);
  rig.recenter(true);
  assert.equal(rig.pan.x, 0);
});
test("survey drones telegraph three aimed Volt shots and Orbit changes jump physics", () => {
  const ground = new Simulation(freshState());
  const drone = ground.spawn("rogue-drone", 0, -4, false, "drone");
  drone.cooldown = 0;
  ground.tick(.05);
  assert.equal(drone.phase, "windup");
  assert.equal(drone.move, "volley");
  assert.equal(ground.projectiles.length, 0);
  for (let i = 0; i < 17; i++) ground.tick(.05);
  const shots = ground.projectiles.filter(p => p.faction === "enemy");
  assert.equal(shots.length, 3);
  assert.ok(shots.every(p => p.element === "Volt"));
  assert.equal(new Set(shots.map(p => p.x)).size, 3);
  const state = freshState();
  state.realm = "orbit";
  const orbit = new Simulation(state);
  ground.player.velocityY = orbit.player.velocityY = 8;
  for (let i = 0; i < 15; i++) {
    ground.tick(.05);
    orbit.tick(.05);
  }
  assert.ok(orbit.player.y > ground.player.y + 2);
});
test("Codex imports the race/class lists and point budgets; costumes cannot affect combat", () => {
  assert.deepEqual(
    RACES.map((r) => r.id),
    ["imperial", "druun", "veylari", "korrath", "lumari", "unsworn"],
  );
  assert.equal(CLASSES.length, 9);
  assert.deepEqual([1, 2, 10].map(earnedPassives), [0, 3, 27]);
  assert.deepEqual([1, 2, 10].map(earnedAttributes), [0, 10, 90]);
  const s = freshState();
  assert.equal(allocate(s, "blade1"), false);
  s.race = "veylari";
  s.calling = "marksman";
  s.level = 3;
  assert.equal(attributeTotals(s).accuracy, 15);
  assert.ok(assignAttribute(s, "accuracy", 5));
  assert.equal(attributeBudget(s), 15);
  assert.equal(assignAttribute(s, "accuracy", 16), false);
  const before = stats(s),
    strike = skillStats(s, "strike");
  s.hero = "nyx";
  assert.deepEqual(stats(s), before);
  assert.deepEqual(skillStats(s, "strike"), strike);
  assert.equal(strike.weapon, "bow");
  const essence = s.resources.essence;
  const pulls = [0.5, 0.1, 0];
  assert.ok(summon(s, () => pulls.shift()).duplicate);
  assert.equal(s.resources.essence, essence);
  assert.equal(s.cosmeticShards, 2);
  const loaded = migrateState(s);
  assert.equal(loaded.race, "veylari");
  assert.equal(loaded.calling, "marksman");
  assert.equal(loaded.attributes.accuracy, 5);
});
test("web is traversable, saves alternate routes, and excludes opposed doctrines", () => {
  assert.equal(CONSTELLATION.nodes.length, 331);
  assert.equal(
    reachable(new Set(CONSTELLATION.byId.keys()), CONSTELLATION.neighbors)
      .length,
    330,
  );
  const s = freshState();
  delete s.legacyPassiveFloor;
  s.passives = ["blade1", "blade2", "blade3", "blade4"];
  const loaded = migrateState(s);
  assert.deepEqual(loaded.passives, s.passives);
  assert.equal(passiveBudget(loaded), 4);
  loaded.level = 40;
  for (const id of [
    "web-0-0-road",
    "web-0-0-0",
    "web-0-0-1",
    "web-0-0-2",
    "web-0-0-3",
    "web-0-0-core",
    "web-0-0-7",
    "web-0-0-8",
    "web-0-0-9",
  ])
    assert.ok(allocate(loaded, id), id);
  assert.ok(refund(loaded, "web-0-0-1"));
  assert.ok(!refund(loaded, "web-0-0-road"));
  for (const id of [
    "web-0-0-6",
    "web-0-0-5",
    "web-0-2-road",
    "web-0-2-0",
    "web-0-2-1",
    "web-0-2-2",
    "web-0-2-3",
    "web-0-2-4",
    "web-0-2-5",
    "web-0-2-doctrine",
    "web-0-1-road",
    "web-0-1-0",
    "web-0-1-1",
    "web-0-1-2",
    "web-0-1-3",
    "web-0-1-4",
    "web-0-1-5",
    "web-0-3-road",
    "web-0-3-0",
    "web-0-3-1",
    "web-0-3-2",
    "web-0-3-3",
    "web-0-3-4",
    "web-0-3-5",
  ])
    assert.ok(allocate(loaded, id), id);
  assert.equal(allocate(loaded, "web-0-3-doctrine"), false);
  assert.deepEqual(
    new Set(migrateState(loaded).passives),
    new Set(loaded.passives),
  );
});
