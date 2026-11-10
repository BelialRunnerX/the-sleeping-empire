# Terrain integration work in progress (not published)

Public release is 3.14.3 controls/targeting hotfix. The dirty terrain integration
is not a completed planet/world port and is not release-ready.

## Working foundation
- Native seed/noise/density/cave/solid numerical slice:2784 C++ fixture rows,
  8352 scalar comparisons, zero observed error. Gradient-index caching is bounded.
- Browser planar mapping and inherited terrain base-height are adaptations.
  Climate generation, native planet parameters, cube-sphere world mapping,
  biome/material selection and source hazard simulation are not ported here.
- All ground now renders and collides as volume; legacy settlement elevation is
  preserved and edits inside160m remain temporarily protected. Sparse edits
  use32m persistence chunks,1m blocks and16-cubed microcells (4096 integer units).
- Main-thread swept body collision and DDA read current edits independently of
  mesh completion. Worker meshes retain previous visible coverage until ready.
- Terrain tools panel provides whole-block excavation, micro carving, placement,
  fractional stone persistence and temporary survey transfer access.
- Existing placeholder nodes are retained; this is not the new source spawning
  system. Full data-driven biome/planet spawning awaits rule/material integration.

## Known release gates
- First browser WIP showed center-sampled macro blocks and dark diagonal-looking
  patches. Coarse partial surface boxes are unacceptable. New worker refinement
  detects exposed mixed blocks before publication; textured heightfield remains
  fallback until replacement ready. Verify latest visuals, never infer from data.
- Full-surface fine meshing has substantial JS cost. Sparse bounded streaming,
  efficient dense/greedy meshing and exact native WASM bulk sampling are being
  investigated; WASM toolchain was unavailable/crashing at last check.
- Verify fine/coarse seams across tiles, stale jobs, unload/reload, underground
  saves, tool interaction/rewards, actual terrain movement and desktop/mobile.
- Broad regression suite and public release have NOT run on finished terrain.

## Connected requirements
Procedural rivers, lakes and oceans need continuous water sampling and persistent
edits, not painted-only water. Voxel flora and structural building pieces must use
compatible materials/shape data and support/collision rules. Minecraft is a
biome-variety reference; planets and hazards must follow Elysium source. Rendering
palettes/remeshing/spawn rules should be data-driven. Actual EnTT is not yet in
this JavaScript simulation; any C++/WASM ECS migration must be described honestly.

## Latest user direction (November 10)
Natural terrain features, including settlement ground, trees, rocks and ores, must use editable voxel data rather than decorative mesh substitutes. Machines and structures may remain authored meshes/modular pieces. The protected legacy settlement is a temporary compatibility transition only; voxelize it while preserving building surface heights/save positions. Next foundation needs material-valued cells and sparse persistent edits before authentic host-rock/ore chunks, dropped piles and tree cuts. Ore inclusion varies by actual ore type; host debris matches local stone. A single ore chunk and a scattered dropped pile are distinct representations.

Near detailed terrain radius must widen with budgeted distance LOD, not simply multiply fine work. Retain matching far surface until replacement is ready, smooth palette transitions, preserve source density fixture parity. Current renderer is binary occupancy and nine detailed8m tiles; no material-valued vegetation/ore implementation claimed.

Settlement integration now renders and collides against the same volume, preserving legacy height inside160m rather than perturbing building foundations.15 volume tests pass including settlement support/save reload. Settlement browser passed actual movement and no page errors. Editing remains temporarily protected in the settlement; narrow foundation masks are future work. Later player-built walls/floors/roofs also require voxel data, attachment/damage/LOD coherence; many authored machines can remain meshes.

Current confirmed blockers: center-only candidate selection can miss narrow cavities; legacy fallback overlap can cap fine edits; exact boundary stitching and conservative classification required. Wider LOD and bounded vertical slabs pending. Optimized mesher (~11x measured scratch) and packed exact gradient-cell cache (~2.38x classifier) are integrated with native fixture parity.

Conservative classification now scans all non-certified blocks, fixing the thin tunnel regression. New interval arithmetic bounds Perlin/fbm/native density/cave tests without changing scalar source arithmetic.20 focused tests pass (including native percell certificate checks), but cave-rich36m columns can still cost~10s in worker; bounded disjoint surface/local vertical bands needed. Worker mixed-page cache limited to2048×4096bytes avoids repeated meshing re-samples; main collision cache stays256pages. Boundary stitching remains pending.


## Integrated tree slice (local 3.15 candidate)
- V2 sparse quarter-metre log/leaf voxels generated in one queued worker; nearest12 resident,40m admission/52m unload hysteresis. Old tree proxies remain distant; not full voxel tree LOD parity.
- Stable node identity, original deterministic density surface anchor (not edited ground height), biome-like seeded moisture/temperature/wind selects four canonical-material species. These habitat fields and existing node locations are browser adaptations, not faithful mod spawn distribution.
- Actual woody cells contribute swept body collision. Leaves are nonblocking. Existing coarse navigation circles remain path planning proxies; whole-tree cut removes the blocker.
- Whole-tree cutting removes visible tree and collision permanently. Exact4096microvolume/m³ log accounting maps1m³ to1timber, pooling fractional remainder; existing harvesting mastery/equipment/Artisan/Luck are separately labeled bonus timber. Leaves have no automatic inventory loot. No claim of Minecraft loot parity.
- Fresh/migrated saves retain a version2 tree ledger. Per-node felled IDs stop duplicate payouts after reload; no180second tree respawn. Full delta tree-cutting/falling physics, broad source species, terrain support-collapse and voxel far proxies remain future increments.
- Actual desktop and touch browser chop/reload passed; terrain micro carve/full mine/placement/reload passed on both layouts (55.2/58.7ms sampled atomic patch time on desktop Chrome emulation, NOT physical phone timing).

### Verification checkpoint 2026-11-10
- `npm test`:19 smoke,8352 exact native scalar comparisons,109 Node tests passed.
- `tests/terrain-browser.mjs`: desktop and real touch-emulated390x844 actual UI micro-carve/full mine/place plus true offline reload passed. Final sampled synchronous patch57.1ms/54.2ms on desktop Chrome, not physical device measurement.
- `tests/voxel-tree-browser.mjs`: actual tree chop/reload passed both layouts after stable baseline anchoring; offline variant added for next run.
- Coarse exact clipping replaced centroid overlap; source normals/UV/color preserved. Boundary transitions remain under independent investigation; this checkpoint is NOT release approval or a live deployment.

### Final safety refinements
Natural fine/coarse perimeter gaps were measured up to0.355m, not ignored as cosmetic. Exact clipping plus narrow vertical edge strips now connect actual fine top edges to original coarse triangles; no horizontal caps are added. Edited blocks pin fine face-neighbor tiles inside the interaction bubble. Far edited/open excavations outside that bubble remain an explicit LOD approximation, not full distant edit fidelity.
Underground movement checks the published resident vertical bands and holds at the boundary if the worker is still preparing the next visible band, then resumes without resetting fall velocity. Large tree meshes likewise defer publication if their woody cells would engulf the player; the old visible/collision proxy remains until clear. No teleport is used.

### Release-candidate verification
Final complete unit command passed19smoke tests,8352native scalar comparisons and126Node tests. The full legacy browser aggregate passed desktop/mobile/offline flows. Independent five-realm visual checks passed original geometry/scene budgets after both asynchronous terrain and tree jobs settled. All60mobile GUI renders passed. Actual desktop/touch terrain and tree flows, including true offline reload, passed before the final pending-neighbor publication gate; the release rerun covers that final gate. Diagnosticunlit terrain confirmed the dark contours are stepped side shading, not missing triangles; exact sample tile coverage64m² and1536seam segments/zero skipped were verified. This does not claim physicalSafari performance or fullnativefar-editLOD parity.

Final publication-gate rerun passed actual desktop and touch terrain edit/place/offline reload plus tree chop/offline reload. Release candidate is3.15.0; no save reset.
