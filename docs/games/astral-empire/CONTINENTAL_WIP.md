# Continental terrain candidate (unreleased)

The public 3.16 release is unchanged. This working candidate is opt-in through
`terrainGeneration: {version: 2}` on a test profile. Normal new and existing
profiles still use version 1. The selected dry sanctuary anchor is persisted;
worker identity includes generator and anchor. Sparse voxel edits still apply
last. Do not reinterpret a populated version-1 profile as version 2.

## Implemented
- Deterministic finite 32.768 km irregular continental macro atlas with mountain-range anchors,
  foothills, plains, coast and continuous ocean-floor exterior.
- Priority-flood lake spills, acyclic ocean outlet graph, catchment accumulation,
  narrow river centerline carve. This is a browser adaptation, not native parity.
- One translated height/water datum. A certified dry plain anchors the authored
  sanctuary; original foundations inside 32 m blend to the new field by 96 m.
- Bastion-only opt-in. Other realms retain their prior generator pending actual
  source-specific water, climate and hazard integration.
- Hydrology owns the surface zero crossing, so surface noise cannot create dams.
  Existing exact native cave arithmetic remains below 24 m of soil.
- Shared simulation, fine worker and far-field baseline. Existing fine sampling,
  edits, atomic publication, collision and conservative block certificates remain.
- Land trees, encounters, wildlife and survey debris excluded from wet terrain.
  The disconnected legacy river plane is omitted for the new generator.

## Not complete / release gates
- Two-batch near/far water renderer and budgeted 2 km terrain horizon implemented locally; visual/performance acceptance continues. No fluid
  simulation, dynamic erosion, edited-dam rerouting or swimming claim.
- Not infinite continental distribution or spherical planetary generation.
- Existing ecology/biome display labels are browser adapters, not a new faithful
  Elysium biome or ore distribution implementation.
- No default-profile rollout, no save reset and no public release yet.
- Needs actual mobile/offline persistence, mountain/coast/lake/rivers walkthrough,
  water traversal policy, world streaming/LOD budget and complete regression pass.

## Current checks
Six focused continental/migration/admission tests pass. Existing 143 units pass
before the final wet-spawn filter. Initial opt-in browser scene initializes nine
fine terrain tiles without page errors; this alone is not visual water acceptance.
Hydrology worker separately verified all graph outlets, 9,367 connected channel
samples, continuous domain boundary, deterministic anchors and dry spawn areas.

Larger revision-3 trees are integrated locally with three-microcell (0.1875 m) cells, exact-volume felling and legacy tombstone preservation. The moon visual currently exceeds the unchanged 600k-triangle scene budget; greedy geometry optimization is pending. Do not publish this candidate until that gate and full mobile/offline regression pass.
