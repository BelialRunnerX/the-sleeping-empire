# Authored creature runtime handoff

Source: user-authorized originals transferred via assets/tool-creature-handoff commit 6dd11e69af50bdf9cd0c492f943e79c5ffe17234. Independent original SHA256 checks passed:
- Lumi deer LOD0: 37e6f04db543ad2abebd4edc3af3e784398cd637390825c9568e5775ca3b54c4
- ORBI scout: 28c22ba427520be87eca9c78d89d7a23eabf15a60fc6381c5859e05b9cbb3ed1

These are user's authored Blender prototypes, not the old fenstag/decorative drone placeholders. Runtime derivatives were prepared from originals without introducing external art.

Lumi runtime LOD1: 30,530 triangles, 1 mesh / 7 primitives, 7 materials, 17-bone skin, 1,072,916 bytes. Antler-inclusive height 3.8 world units, torso lower than the 3-unit avatar. Authored +X forward rotated to engine +Z. Source has no animation clips. creature-motion.mjs adds conservative procedural diagonal walk/faster flee and idle neck/tail poses. This is NOT a polished authored gallop, foot IK, terrain-aware hoof contact or collision solver. SkeletonUtils cloning makes each skinned animal independent even without clips. Authored materials kept without previous green tint.

ORBI runtime: 29,897 triangles, 1 mesh / 7 primitives, 7 materials, 1,037,364 bytes. 125 original static mesh parts batched by material. No skin/animation or articulated hierarchy existed. Source originals retain future editable part names. Runtime retains existing enemy root hover/combat handling, visual height 0.95 and ground offset 1.45; front +Z. Fallback procedural enemy remains for load failures.

Verified: actual Blender source and derivative renders inspected; raw Three browser walk/run screenshots inspected; exact height/floor, 17 joints, nonzero joint motion, independent clone, 14 total draw calls / 60,427 triangles for deer+drone; no page errors. All 176 Node tests pass. Test: node tests/creature-runtime.mjs (uses installed Edge headless). Screenshots/JSON in .artifacts.

Service worker preload includes the new module and two assets; integrator must bump final release cache version and run full actual-game desktop/touch/offline tests. No publication from this worktree. No terrain, trees, avatars, or combat logic changes.
