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
