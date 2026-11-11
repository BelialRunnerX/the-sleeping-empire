# Terrain planning performance check

The renderer previously rebuilt its tile coverage, scanned all saved block edits for
nearby edit halos, and rebuilt each tile signature every world update, even when
nothing that affects those requests changed.

`TerrainRenderer.sync` now replans on tile crossing, 8-unit vertical-band crossing,
terrain revision, backing data replacement, or field identity replacement. It still
drains pending mesh publications on **every** update. Meshing, geometry, coverage,
publication ownership, saves, and procedural field values are unchanged. This does
not lower the requested terrain/tree scale or impose a new geometry budget.

## Reproduce

From this directory:

```sh
node --test tests/terrain-sync.test.mjs
node tests/terrain-sync-benchmark.mjs
node tests/terrain-sync-benchmark.mjs --replan
node tests/terrain-sync-benchmark.mjs --replan --scan
```

The benchmark uses a stationary player and 0, 100, or 1,000 remote edited blocks.
Each output is five samples in milliseconds per sync (120 calls per sample).
`--replan` forces coverage replanning; `--scan` additionally replaces the spatial
index with an independent full-scan oracle.
Before spatial indexing, on StarStation the 1,000-edit fixture measured about 4.5–5.3 ms per sync with
forced replanning versus under 0.001 ms with unchanged coverage cached. This is a
**CPU planning microbenchmark**, not a whole-frame FPS or mobile GPU result.

Tests assert zero additional saved-edit scans during unchanged/subtile movement;
identical request plans through positive/negative tile and vertical-band crossings,
edits and transactional commits; continued publication draining; and invalidation
on backing data replacement. Existing seam/publication/save tests remain necessary.

## Limits and next profiling targets

Coverage crossings now use renderer-local X/Z edit buckets, including the exact
one-block halo, Y bounds and original insertion order. Both saved blocks and edit
revision tombstones are indexed. Request stores and seam publication dependencies
use the same index. Indexes rebuild once on revision or backing-store replacement;
there is no persistence format change or index serialized into saves. Edits still
require one full rebuild, deliberately avoiding risky incremental invalidation.
A 1,000-remote-edit forced-replan fixture now measures about 0.012�0.026 ms per sync.
The independent scan oracle checks exact job/store ordering, seam dependencies,
negative coordinates, transactional commits, removed edits and dictionary reloads. Actual generation,
remeshing, mesh upload, draw calls, shadows and GPU time are separate costs. No claim
is made that every submitted triangle is directly visible: frustum culling cannot
by itself prove occlusion, and shadow passes can need offscreen geometry.

## Pipeline profiling and external optimization references

`node tests/terrain-pipeline-benchmark.mjs` separates refinement classification,
its block-generation/cache-access subset, and adaptive meshing. `--scan` retains
the prior 4,096-cell classification scan for comparison. These are cold CPU runs,
not GPU timing or whole-game FPS. Instrumentation adds some measurement overhead.
Seed 9372 legacy baseline, 8x16x8 tiles on StarStation:

- Settlement x=0: classification approximately 42 ms before, 5 ms after; block data
  itself about 5 ms; meshing about 2.4 ms. Mesh unchanged at one quad.
- Frontier x=168: classification about 685 ms (648 ms in block data) in the initial
  baseline run; meshing about 76 ms. After the shortcut, cold generation timing
  varied enough that no whole-tile speedup is claimed. Mesh stays 2,215 quads.

The implemented shortcut reuses TerrainVolume's exact uniform-page classification.
No density values, material keys, seams, AO, geometry or storage format change.
Tests compare refinement lists and mesh bytes, including edits, reverting edits,
transactional commits, full/empty and mixed fields. GPU profiling remains separate
and was not completed by this Node benchmark.

References reviewed:
- Tantan video: https://youtu.be/qnGoGq7DWMc and its public demo:
  https://github.com/TanTanDev/binary_greedy_mesher_demo
- Tantan generation video: https://youtu.be/ru_oz09Zo-s
  (YouTube's fetched page did not expose its description/transcript; specific
  implementation details from that video are not treated as verified.)
- Vercidium: https://youtu.be/40JzyaOYJeY and public source:
  https://github.com/vercidium-patreon/meshing/blob/main/ChunkMeshActual.cs
- Run-merging tradeoff: https://vercidium.com/blog/voxel-world-optimisations/

Application decisions:
1. Binary occupancy/face masks are a candidate after generation cost is addressed.
   The current engine already removes covered faces and greedily merges occupancy.
   Packed masks must still respect neighboring data and every material/AO merge key.
2. 32-cubed meshing jobs can be independent of persistence chunks. Do not change
   save coordinates to imitate a demo; compare job latency and draw-call count.
3. Exact cached field/column results are preferable first. Upsampling noise changes
   the scalar field and can close narrow caves or rivers, so it requires a versioned
   generation design and fidelity tests rather than a silent optimization.
4. RLE may reduce storage but scattered edits can split runs and make random reads
   expensive. Keep sparse deltas and dense working pages until an edit benchmark
   demonstrates a net gain. No compression conversion is included here.
5. Run merging may trade extra triangles for lower rebuild latency. Benchmark edits
   as well as static triangles before replacing greedy meshing. Creator headline
   FPS cannot predict this browser engine's performance.
