# Universal hierarchy: first production slice

Version 3.21 exposes a read-only Universe panel under Fieldwork. The already-persisted profile seed is explicitly adopted as this profile universe seed; no new random entropy is introduced and no existing terrain/save identities are rewritten. A small saved universe manifest pins the adopted seed, version and recipe. Unknown future recipes are preserved and shown as unavailable rather than silently reinterpreted. Generator recipe universe-survey-v1 includes placement thresholds and system radius. This is a bounded query service, not completed space travel or planetary terrain.

Galactic material-density local maxima above 0.85 identify sparse systems. A separate field inside each system radius 4 coarse cells identifies planets above 0.65. Object-ID-scoped atmosphere, type, richness and canonical Iron/Copper/Cobalt potential fields are deterministic. IDs use exact BigInt global cell coordinates serialized as decimal strings. The 64 × 1 × 64 default slice is an inspection window, not universe size; physical spacing/orbital scales remain undefined. 16-cell pages yield cooperatively; maximum 4096 cells/query, 128/page. Close, cancellation and replacement scans invalidate old results. Legitimate empty space is not silently filled.

Mod SpaceWorld.java commit c0ebd4692c4e95964149a119bd5fff7a4f9d4ea4 supplies preset gravity/air/hazards. Placement and procedural preset selection are explicit browser adaptations. Gas worlds have no invented source preset or traversable surface. Potential fields are not ore deposits or inventory quantities. Existing material registry IDs remain authoritative.

The chart is an X/Z projection of one Y-cell slice; planets are subordinate metadata records. Reserved terrain seeds do not generate surfaces yet. Existing five playable realms and planar continental saves remain unchanged. Future hierarchy work: physical system/planet scales, stable cube-sphere patch hierarchy, global connected drainage/refinement, sparse near edits, horizon LOD/floating origin and actual EnTT runtime. These are not implemented by this panel.

Verification: tests/universe.test.mjs covers exact-coordinate identity, page partition/resume, bounded queries, forged parent rejection, source hazards, resource independence and cancellation. tests/universe-browser.mjs covers desktop/touch scan, planet selection, cancel/close/reopen, repeatability and actual offline reload.

## 3.22 parameterized geometry and inherited-resource previews

A selected planet can open a smooth reference-shell inspector using the exact tangent-adjusted source mapping. Radii are explicit, unsaved examples: 3,000 / 6,371,000 / 64,000,000 / 131,000,000 metres. These are not assigned to generated planets. The source prototype actually used 1,200–6,400 metres, not kilometres; enormous examples follow the user's later direction. Signed32 subvoxel envelope validation includes relief. Wide face indices and canonical edge/corner addresses avoid int32 narrowing.

The renderer uses normalized coordinates, all six faces at a shared resolution, error-driven levels 8–64, and at most 49,152 solid triangles. The wire overlay is a projection guide, not terrain. Keeping uniform edge resolution avoids mixed-LOD cracks in this bounded inspector; it does not implement adaptive quadtree terrain stitching, horizon streaming, collision, landings or sparse planetary edits. GPU resources and contexts are disposed on replacement/Close.

A separately named hierarchical-resource-potentials-v1 preview combines broad galactic, system and planet potential fields. It does not overwrite the original survey-v1 fields, stable body identities, terrain seeds or deposits. Resource eligibility, source host/depth/biome rules and actual yield remain separate necessary gates. In particular source Bastion composition and no-ocean constraints are not erased by generic potentials; the playable continental ocean prototype is a later user-directed adaptation, not source parity.


## 3.23 bounded surface study
A separate, unsaved `planetary-direction-relief-v1` recipe samples continental and warped mountain-chain fields in canonical direction space. The inspector can display dry land or an explicitly adapted ocean-bearing study, not assigned geography for the selected survey planet. Source Bastion ocean restrictions remain enforced when a source preset is supplied; the ocean study deliberately does not claim source parity. Gas-world surface controls are disabled.

Mesh generation and the bounded 16-resolution tangent cube graph run in a dedicated worker. Close, radius, mode, or resolution replacement terminates obsolete work; the old resident mesh stays visible while a new resolution is pending. Physical relief is not vertically exaggerated. Radial lighting is an approximation, not fine terrain-normal parity. The six faces use equal tessellation, at most 49,152 triangles.

Drainage statistics describe a coarse acyclic connected graph. Candidate edges are not fine carved rivers, filled nodes are not rendered lakes, and this is not a local fluid simulation. No terrain save, existing planetary seed, inventory, or movement/collision system is replaced. Landing needs a local tangent frame, coherent collision/material sampling, stable edit ownership and tested near/far LOD transitions before activation.

Drainage identity additionally includes its graph recipe and macro resolution, independently of the stable relief recipe. During LOD regeneration the resident mesh is retained but readiness is false until the latest worker job publishes its completed resolution.
