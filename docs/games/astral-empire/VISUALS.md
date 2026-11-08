# Dawnlight visual implementation

Version 3.2 establishes a consistent stylized fantasy presentation using original geometry and shaders authored in `engine/art.mjs` and `engine/world.mjs`. It does not include downloaded character art, third-party models, AI-generated image assets, or Minecraft assets. Three.js is vendored under its recorded MIT license. Optional Google fonts continue to have system fallbacks.

## What actually renders

- Four-band nearest-filtered cel ramp, selective inverted-hull character outlines, ACES tone mapping and a warm directional light. Balanced/High use one camera-following orthographic shadow map with PCF filtering; Performance disables it.
- Gradient sky with a procedural cloud band, sun disc, multiple distant ridgelines, linear fog and coordinated realm colors. The sky is a fixed art direction, not a day/night or weather simulation.
- Layered procedural hero clothing, hair locks, eye details, armor trim, boots and distinct blade/bow/staff geometry. Twelve heroes use the shared body with their own colors and weapon treatment. Hip/knee/shoulder/elbow pivots provide simple locomotion and casting poses. A subdivided cape uses vertex displacement; there is no skeletal skinning, facial rig, cloth physics or production animation library.
- Tiled stone and subtle terrain grain are original deterministic CanvasTextures. Buildings have structural trim, layered roof geometry, chimneys, lit window materials, banners and planters. Portal runes surround an animated transparent shader. Lanterns use emissive materials; they do not add costly point-light shadows.
- Instanced trunks, four-layer tree canopies and up to 4,800 three-blade grass tufts. A shared time uniform drives grass sway, water ripples, portal motion and motes. The riverbed is visually lowered under the water, and the crossing uses its visible deck height. This is shallow decorative water; there is no swimming, fluid simulation or boat system.
- Additive slash crescents, short projectile trails and bounded elemental impact sparks. Enemy telegraphs remain visible during windups. Effects do not alter simulation hit timing or damage.

## Device controls

| Preset | Maximum pixel ratio | Shadow map | Grass tufts | Ambient motes |
| --- | ---: | ---: | ---: | ---: |
| Performance | 1 | Off | 600 | 36 |
| Balanced | 1.5 | 1024² | 2,400 | 90 |
| High fidelity | 2 | 2048² | 4,800 | 150 |

Settings apply immediately without reloading or replacing a save. `astral_empire_visuals_v1` stores device preferences outside the version 3 progression payload. Reduced motion stops ambient shader time, cape flutter and portal rotation, hides drifting motes, suppresses impact sparks, and minimizes CSS animations/transitions. Locomotion, attack poses, projectiles, telegraphs and camera movement remain functional. This is not a full accessibility audit.

F8 hides/restores the HUD and vignette. Combat continues; this is a scenic viewing toggle rather than a paused photo editor. Right drag orbits, and wheel zoom ranges from 3.8 to 20 units.

## Verification and budgets

`npm run test:visual` uses an isolated local renderer harness, deterministic sample seed, four realms, all twelve hero swaps and all presets. It captures `.artifacts/realm-*.png`, rejects shader compilation errors, checks that hero swaps do not accumulate geometry, and enforces conservative scene limits of 1,200 draw calls, 600,000 triangles and 15 resident textures in the sample view. Counts include the active shadow pass and depend on view/frustum. These limits detect structural regressions; they do not promise a particular frame rate.

The player browser suite also captures the title, sanctuary, close-up character, combat and mobile UI. It verifies F8 restoration, graphics changes and preference persistence through reload, alongside real movement, combat, gathering, saving and offline loading. Screenshots are review artifacts; there is no automated perceptual image-diff claim. GitHub Actions uploads them with the test run.

Removed hero geometry/materials, expired spark/slash effects and projectile trails are disposed. Scene teardown releases geometry, materials, procedural textures, shadow targets and the renderer. Shared instanced scenery reduces draw overhead, but buildings and avatars still use many separate meshes. Mesh merging, authored LODs, mobile GPU profiling and broader hardware tests remain priorities before significantly increasing scene density.

## Next fidelity milestones

1. Original skeletal anime models with authored topology, UVs, hair cards, faces and outfit variants, with provenance/license records for every asset.
2. Animation blending, grounded feet, weapon trails matched to authored swing timing, hit reactions, charge/cast poses and enemy locomotion.
3. Distinct authored realm landmarks, terrain materials, caves, environment collision and camera occlusion handling.
4. Profile-driven mesh batching/LODs, device testing, dynamic resolution, optional postprocessing and color/accessibility controls.
5. Authored music, environmental audio, weapon/impact sound layers and voice assets with recorded rights.

The game remains a solo browser RPG prototype with local profiles. This rendering pass adds no cloud identity or shared-world server. The existing Elysium formula ports and C++/WebAssembly ABI 2 are unchanged; see `ELYSIUM_PORT.md` for the source boundary.
