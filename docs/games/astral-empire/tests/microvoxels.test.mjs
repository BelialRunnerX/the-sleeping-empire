import { test } from "node:test";
import assert from "node:assert/strict";
import { MICRO, MICRO_VOLUME, microAddress, editKey, normalizeMicrovoxels, materialAt, mineMicro, raycastMicro, meshMicro, boxOccupied, MeshPublication } from "../engine/microvoxels.mjs";
import { freshState, migrateState } from "../engine/simulation.mjs";

test("source resolution and negative stable addresses", () => {
  assert.equal(MICRO, 16); assert.equal(MICRO_VOLUME, 4096);
  assert.deepEqual(microAddress([-1, -512, 512]), { chunk: [-1, -1, 1], block: [31, 0, 0], micro: [15, 0, 0] });
});
test("fine surface exists before edits; halo suppresses enclosed faces", () => {
  const store = normalizeMicrovoxels();
  const first = meshMicro(store);
  assert.ok(first.quads > 0);
  assert.equal(Object.keys(store.edits).length, 0);
  assert.equal(meshMicro(store, [-1, 1, 223], [1, 3, 225]).quads, 0);
  assert.ok(boxOccupied(store, [-.1, .1, 13.9], [.1, .2, 14.1]));
  assert.equal(boxOccupied(store, [30, 1, 30], [31, 2, 31]), false);
});
test("DDA, sparse removal and integer volume persist without repeated rewards", () => {
  const store = normalizeMicrovoxels();
  const ray = () => raycastMicro(store, [0, 1, 18], [0, 0, -1]);
  const hit = ray(); assert.ok(hit);
  assert.ok(mineMicro(store, hit.cell));
  assert.equal(store.recoveredUnits, 1);
  assert.equal(mineMicro(store, hit.cell), false);
  assert.equal(store.recoveredUnits, 1);
  assert.equal(materialAt(store, hit.cell), 0);
  assert.ok(Math.abs(ray().distance - hit.distance - 1 / 16) < 1e-9);
  const state = freshState(); state.microvoxels = store;
  const loaded = migrateState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(loaded.microvoxels, store);
  assert.equal(materialAt(loaded.microvoxels, hit.cell), 0);
  const canonical = editKey(hit.cell);
  const padded = canonical.split(":").map(n => n.startsWith("-") ? n : "0" + n).join(":");
  const repaired = normalizeMicrovoxels({ edits: { [padded]: 0, [canonical]: 0 }, recoveredUnits: 999999 });
  assert.equal(materialAt(repaired, hit.cell), 0);
  assert.equal(repaired.recoveredUnits, 1);
  assert.deepEqual(Object.keys(repaired.edits), [canonical]);
  assert.ok(meshMicro(loaded.microvoxels).quads > 0);
  assert.deepEqual(normalizeMicrovoxels({ edits: { bad: 0, '0:0:0:0:0:0:16:0:0': 0 }, recoveredUnits: -1 }), { version: 1, edits: {}, recoveredUnits: 0 });
});
test("stale or unloaded mesh work cannot publish", () => {
  const gate = new MeshPublication(), old = gate.begin(), current = gate.begin();
  assert.equal(gate.accepts(old), false); assert.equal(gate.accepts(current), true);
  gate.dispose(); assert.equal(gate.accepts(current), false);
  assert.equal(gate.accepts(gate.begin()), false);
});
