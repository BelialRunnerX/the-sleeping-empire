import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { numeric } from "../engine/native.mjs";
import {
  freshState,
  migrateState,
  stats,
  skillStats,
  allocate,
  refund,
  makeItem,
  professionLevel,
  gather,
  craft,
  alterItem,
  claimQuest,
  summon,
  Simulation,
} from "../engine/simulation.mjs";
import { Profiles } from "../engine/profiles.mjs";

test("C++ WebAssembly exports match JavaScript at boundaries and negative coordinates", async () => {
  const bytes = await readFile(
    new URL("../native/simulation.wasm", import.meta.url),
  );
  const { instance } = await WebAssembly.instantiate(bytes, {}),
    native = instance.exports;
  assert.equal(native.abi_version(), 1);
  for (const x of [-9999, -1, 0, 1, 9999])
    for (const z of [-100, 0, 100])
      assert.equal(
        native.world_hash(438102, x, z) >>> 0,
        numeric.world_hash(438102, x, z),
      );
  for (const tier of [-1, 0, 1, 3, 6, 18, 100])
    for (const roll of [0, 0.1, 0.5, 0.999])
      assert.equal(native.ore_yield(tier, roll), numeric.ore_yield(tier, roll));
  assert.equal(native.world_tier(60, 2), 6);
  assert.equal(
    native.resolve_damage(30, 0.4, 1.2, 80, 0.2, 1, 1.6),
    numeric.resolve_damage(30, 0.4, 1.2, 80, 0.2, 1, 1.6),
  );
});
test("version 1 heroes, equipment and currencies migrate without consuming source", () => {
  const old = {
      version: 1,
      gold: 999,
      crystals: 123,
      tickets: 4,
      heroes: { nyx: { level: 21 } },
      team: ["nyx"],
      items: [
        { name: "Null edge", slot: "Weapon", base: 81, owner: "nyx", level: 9 },
      ],
    },
    copy = JSON.stringify(old),
    s = migrateState(old);
  assert.equal(s.hero, "nyx");
  assert.equal(s.gold, 999);
  assert.equal(s.level, 21);
  assert.ok(s.items.some((i) => i.name === "Null edge"));
  assert.equal(JSON.stringify(old), copy);
});
test("passives require adjacency and leaf refunds preserve connectivity", () => {
  const s = freshState();
  assert.equal(allocate(s, "blade5"), false);
  assert.equal(allocate(s, "blade1"), true);
  assert.equal(allocate(s, "blade2"), true);
  assert.equal(refund(s, "blade1"), false);
  assert.equal(refund(s, "blade2"), true);
  assert.equal(stats(s).damage, 0.22);
});
test("capstone tradeoffs affect derived combat stats", () => {
  const s = freshState();
  s.level = 10;
  for (let i = 1; i <= 5; i++) assert.ok(allocate(s, "arcane" + i));
  const modified = skillStats(s, "lance");
  assert.ok(modified.power > 2.1);
  assert.ok(modified.cost > 18 * 1.35);
});
test("linked skill modifiers apply cost, area, cooldown and compatibility", () => {
  const s = freshState();
  s.links.nova = ["cascade", "swift"];
  const nova = skillStats(s, "nova");
  assert.equal(nova.radius, 7 * 1.45);
  assert.ok(nova.cooldown < 7);
  assert.ok(nova.cost > 28);
  s.links.strike = ["echo", "echo"];
  assert.equal(skillStats(s, "strike").echo, false);
});
test("gathering persists depletion and gates repeated rewards until recovery", () => {
  const s = freshState(),
    node = { id: "ore0", kind: "ore" };
  assert.ok(gather(s, node, 100).ok);
  const count = s.resources.cobalt;
  assert.equal(gather(s, node, 101).ok, false);
  assert.equal(s.resources.cobalt, count);
  assert.ok(gather(s, node, 180101).ok);
  assert.ok(s.resources.cobalt > count);
  assert.ok(professionLevel(s, "mining") > 1);
});
test("crafting pays exact inputs and grants affixed equipment", () => {
  const s = freshState();
  s.resources.cobalt = 5;
  s.resources.timber = 3;
  const before = s.items.length;
  assert.ok(craft(s, "blade", 123).ok);
  assert.equal(s.resources.cobalt, 0);
  assert.equal(s.items.length, before + 1);
  assert.equal(s.items.at(-1).affixes.length, 3);
  assert.equal(craft(s, "blade").ok, false);
});
test("equipped gear cannot be salvaged, temper and reshape consume resources", () => {
  const s = freshState();
  s.resources.cobalt = 5;
  const item = s.items[0];
  assert.equal(alterItem(s, item.id, "salvage"), false);
  const base = stats(s).power;
  assert.ok(alterItem(s, item.id, "temper"));
  assert.ok(stats(s).power > base);
  assert.equal(s.resources.cobalt, 3);
  assert.ok(alterItem(s, item.id, "reroll", 35));
  assert.equal(s.resources.essence, 1);
});
test("world attacks respect mana, cooldown, range and dodge invulnerability", () => {
  const s = freshState(),
    sim = new Simulation(s);
  sim.spawn("enemy", 0, 8);
  const e = sim.enemies[0];
  assert.ok(sim.attack("lance"));
  assert.ok(e.hp < e.max);
  assert.equal(sim.attack("lance"), false);
  sim.player.mana = 0;
  assert.equal(sim.attack("nova"), false);
  sim.player.hp = 100;
  e.phase = "windup";
  e.timer = 0.01;
  sim.player.invulnerable = 1;
  sim.tick(0.02, {});
  assert.ok(sim.player.hp >= 100);
});
test("kill rewards are idempotent and enemy deaths persist", () => {
  const s = freshState(),
    sim = new Simulation(s);
  sim.spawn("enemy", 0, 0);
  const e = sim.enemies[0];
  sim.kill(e);
  const gold = s.gold;
  sim.kill(e);
  assert.equal(s.gold, gold);
  assert.equal(s.statistics.kills, 1);
  assert.ok(s.defeated.enemy > Date.now());
});
test("quest rewards can be claimed only once", () => {
  const s = freshState();
  s.statistics.gathers = 5;
  assert.ok(claimQuest(s, "gather"));
  assert.equal(claimQuest(s, "gather"), false);
});
test("summon pity guarantees the legendary pool", () => {
  const s = freshState();
  s.pity = 39;
  const result = summon(s, () => 0.99);
  assert.equal(result.rarity, 5);
  assert.equal(s.pity, 0);
  assert.ok(s.heroes.includes(result.id));
});
test("malformed imports are constrained and unknown gear affixes are discarded", () => {
  const s = freshState();
  s.level = Infinity;
  s.items[0].affixes = [{ id: "bad", stat: "power", value: 99999 }];
  s.position = { x: Infinity, z: -9999 };
  const loaded = migrateState(s);
  assert.equal(loaded.level, 1);
  assert.equal(loaded.position.z, -140);
  assert.equal(loaded.items[0].affixes.length, 0);
});
test("profile isolation, PIN validation, reload, and legacy preservation", () => {
  const storage = new Map(),
    adapter = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    };
  storage.set("astral_empire_v1", JSON.stringify({ version: 1, gold: 712 }));
  const manager = new Profiles(adapter);
  const one = manager.login("One", "1234", true);
  assert.equal(one.gold, 712);
  one.resources.cobalt = 55;
  manager.save(one);
  manager.logout();
  const two = manager.login("Two", "5678", true);
  assert.equal(two.resources.cobalt, 0);
  assert.throws(() => manager.login("One", "0000"));
  assert.equal(manager.login("One", "1234").resources.cobalt, 55);
  assert.equal(JSON.parse(storage.get("astral_empire_v1")).version, 1);
});
