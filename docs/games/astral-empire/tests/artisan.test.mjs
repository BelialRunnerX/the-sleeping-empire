import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  migrateState,
  craft,
  makeItem,
  claimQuest,
} from "../engine/simulation.mjs";
import {
  STATIONS,
  PROCESS_RECIPES,
  matchAlloy,
  buildStation,
  enqueueProcessing,
  settleProduction,
  cancelProcessing,
  collectProduction,
  upgradeStation,
  normalizeProduction,
} from "../engine/artisan.mjs";
const at = (s, id) => {
  const d = STATIONS.find((d) => d.id === id);
  s.position = { x: d.x, z: d.z };
  s.realm = "bastion";
};
function supplied() {
  const s = freshState();
  for (const key of Object.keys(s.resources)) s.resources[key] = 100;
  return s;
}

test("Elysium two-slot matching preserves either order and exact consumption counts", () => {
  const r = PROCESS_RECIPES.find((recipe) => recipe.id === "billet");
  assert.deepEqual(
    matchAlloy(r, { id: "cobalt", count: 8 }, { id: "stone", count: 7 }),
    { left: 2, right: 1 },
  );
  assert.deepEqual(
    matchAlloy(r, { id: "stone", count: 7 }, { id: "cobalt", count: 8 }),
    { left: 1, right: 2 },
  );
  assert.equal(
    matchAlloy(r, { id: "cobalt", count: 1 }, { id: "stone", count: 7 }),
    null,
  );
  assert.equal(
    matchAlloy(r, { id: "cobalt", count: 8 }, { id: "timber", count: 7 }),
    null,
  );
  assert.equal(
    matchAlloy(r, { id: "stone", count: 0 }, { id: "cobalt", count: 8 }),
    null,
  );
});
test("construction is paid once and requires the actual sanctuary site", () => {
  const s = supplied();
  assert.equal(buildStation(s, "foundry").ok, false);
  at(s, "foundry");
  assert.equal(buildStation(s, "foundry").ok, true);
  assert.equal(s.resources.cobalt, 98);
  assert.equal(s.resources.timber, 98);
  assert.equal(buildStation(s, "foundry").ok, false);
  assert.equal(s.statistics.workstations, 1);
  assert.equal(claimQuest(s, "atelier-build"), true);
  assert.equal(claimQuest(s, "atelier-build"), false);
  s.realm = "moon";
  assert.equal(enqueueProcessing(s, "billet", 1, 1000).ok, false);
});
test("batch queues reserve inputs atomically and enforce capacity", () => {
  const s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  assert.ok(enqueueProcessing(s, "billet", 3, 1000).ok);
  assert.equal(s.resources.cobalt, 92);
  assert.equal(s.resources.stone, 95);
  const snapshot = JSON.stringify(s.resources);
  assert.equal(enqueueProcessing(s, "billet", 1, 1001).ok, false);
  assert.equal(enqueueProcessing(s, "billet", 1.5, 1001).ok, false);
  assert.equal(JSON.stringify(s.resources), snapshot);
  assert.deepEqual(
    s.production.stations.foundry.jobs.map((j) => j.end),
    [13000, 25000, 37000],
  );
});
test("paid orders catch up in sequence while away without inventing recurring production", () => {
  const s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  enqueueProcessing(s, "billet", 3, 1000);
  assert.equal(settleProduction(s, 12999), 0);
  assert.equal(settleProduction(s, 13000), 1);
  assert.equal(settleProduction(s, 13000), 0);
  assert.equal(s.production.stations.foundry.output.billet, 1);
  assert.equal(settleProduction(s, 100), 0); // Clock rollback cannot repeat a completion.
  assert.equal(settleProduction(s, 1e9), 2);
  assert.equal(settleProduction(s, 2e9), 0);
  assert.equal(s.production.stations.foundry.output.billet, 3);
  assert.equal(s.resources.billet, 100); // Still in the output tray.
});
test("collection grants goods and profession XP exactly once at the station", () => {
  const s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  enqueueProcessing(s, "billet", 1, 1000);
  s.position = { x: 0, z: 6 };
  assert.equal(collectProduction(s, "foundry", 14000).ok, false);
  at(s, "foundry");
  assert.equal(collectProduction(s, "foundry", 14000).ok, true);
  assert.equal(s.resources.billet, 101);
  assert.equal(s.professions.smithing, 18);
  assert.equal(s.statistics.processed, 1);
  assert.equal(collectProduction(s, "foundry", 15000).ok, false);
  assert.equal(s.resources.billet, 101);
  assert.equal(s.professions.smithing, 18);
});
test("waiting cancellation refunds exact inputs and closes the queue gap", () => {
  const s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  enqueueProcessing(s, "billet", 3, 1000);
  const q = s.production.stations.foundry.jobs;
  assert.equal(cancelProcessing(s, "foundry", q[0].id, 2000).ok, false);
  assert.equal(cancelProcessing(s, "foundry", q[1].id, 2000).ok, true);
  assert.equal(s.resources.cobalt, 94);
  assert.equal(s.resources.stone, 96);
  assert.deepEqual(
    q.map((j) => j.end),
    [13000, 25000],
  );
  const finishedId = q[0].id;
  assert.equal(cancelProcessing(s, "foundry", finishedId, 14000).ok, false);
  assert.equal(s.production.stations.foundry.output.billet, 1);
});
test("upgrades require an empty queue and change future duration, capacity and recipe gates", () => {
  const s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  assert.equal(enqueueProcessing(s, "aether", 1, 1000).ok, false);
  enqueueProcessing(s, "billet", 1, 1000);
  assert.equal(upgradeStation(s, "foundry", 2000).ok, false);
  settleProduction(s, 13000);
  assert.equal(upgradeStation(s, "foundry", 13000).ok, true);
  assert.equal(s.production.stations.foundry.tier, 2);
  assert.equal(s.gold, 1350);
  assert.ok(enqueueProcessing(s, "aether", 3, 14000).ok);
  assert.equal(s.production.stations.foundry.jobs[0].end, 28400);
  assert.ok(enqueueProcessing(s, "aether", 2, 14000).ok);
  assert.equal(enqueueProcessing(s, "aether", 1, 14000).ok, false);
});
test("save migration preserves legitimate queues/output and rejects malformed station data", () => {
  const now = Date.now(),
    s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  enqueueProcessing(s, "billet", 3, now - 14000);
  settleProduction(s, now);
  const original = JSON.stringify(s),
    restored = migrateState(JSON.parse(original));
  assert.equal(JSON.stringify(s), original);
  assert.equal(restored.production.stations.foundry.output.billet, 1);
  assert.equal(restored.production.stations.foundry.jobs.length, 2);
  assert.equal(settleProduction(restored, now + 30000), 2);
  collectProduction(restored, "foundry", now + 30000);
  assert.equal(restored.resources.billet, 103);
  const malformed = normalizeProduction(
    {
      stations: {
        foundry: {
          tier: 99,
          output: { billet: -5, invented: 999 },
          jobs: [
            { recipe: "invented", start: 0 },
            { recipe: "extract", start: 0 },
          ],
        },
      },
    },
    now,
  );
  assert.equal(malformed.stations.foundry.tier, 3);
  assert.equal(malformed.stations.foundry.output.billet, 0);
  assert.equal(malformed.stations.foundry.output.invented, undefined);
  assert.deepEqual(malformed.stations.foundry.jobs, []);
  const old = migrateState({
    version: 3,
    level: 10,
    resources: { cobalt: 17 },
    statistics: { gathers: 50 },
  });
  assert.equal(old.resources.cobalt, 17);
  assert.equal(old.production.stations.foundry.tier, 0);
  assert.equal(old.resources.billet, 0);
});
test("refined equipment recipes enforce site/tier, consume stock and produce stronger four-affix gear", () => {
  const s = supplied();
  at(s, "foundry");
  buildStation(s, "foundry");
  assert.equal(craft(s, "aetherblade", 41).ok, false);
  upgradeStation(s, "foundry", 1000);
  const before = s.resources.aether;
  assert.equal(craft(s, "aetherblade", 41).ok, true);
  assert.equal(s.resources.aether, before - 1);
  assert.equal(s.items.at(-1).rarity, "epic");
  assert.equal(s.items.at(-1).affixes.length, 4);
  assert.equal(s.items.at(-1).name, "Aetherbound oathblade");
  assert.ok(s.items.at(-1).base > makeItem(41, 1, "weapon", "epic").base);
  s.items = Array.from({ length: 200 }, (_, i) => makeItem(i));
  const stock = JSON.stringify(s.resources);
  assert.equal(craft(s, "aetherblade", 42).ok, false);
  assert.equal(JSON.stringify(s.resources), stock);
});
