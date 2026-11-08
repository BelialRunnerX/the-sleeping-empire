# Illustrated Frontier: visual implementation

Version 3.3 makes illustrated isometric 2.5D the default presentation. The earlier Dawnlight procedural third-person renderer remains available under Settings → Art style, changeable at the sanctuary. Both views operate on the same simulation state and world coordinates.

## What the current game renders

- An orthographic camera, alpha-tested anime character sprites, painted scenery/enemy sprites and painterly ground surfaces. The WebGL depth buffer provides world occlusion; these are camera-facing cutouts rather than skeletal 3D models.
- Twelve portraits in a 3×4 atlas and twenty-four full-body poses in a 6×4 atlas. Each hero uses an adjacent pair. Movement steps between the two poses, adds a small bob and mirrors facing; attack feedback adds tilt/recoil and existing slash/projectile/impact effects. There are no eight-direction sheets, fully authored attack/death clips or lip sync.
- Sixteen painted prop cells: trees, cottage, portal, ore, herbs, gatherable tree, forge, ruins, boulder, lantern, dummy and four enemy archetypes. The Warden currently uses an enlarged sentinel illustration.
- A 2×2 ground atlas blends grass, paths, courtyard stone and riverbanks in a world-coordinate shader. Mirrored tiling and mipmaps limit visible seams and aliasing. River height, the wooden crossing, wind-driven grass, motes and travelling combat effects continue to use scene geometry/shaders.
- A separate title illustration and matching portrait HUD/roster. Title artwork is promotional imagery, not a screenshot or a promise that the game has an illustrated cinematic engine.
- Tall scenery fades when its projected bounds cover the hero, preserving character visibility behind trees, houses and arches.

All five raster assets were generated for this project with the built-in image tool, then encoded locally as WebP. They total approximately 2.9 MB and are served/pre-cached with the game. See [assets/ASSETS.md](assets/ASSETS.md) for ownership/provenance boundaries and exact prompts. No Minecraft or Elysium art was imported. Three.js remains vendored with its MIT license.

## Existing gameplay and controls

The camera/view change does not replace movement, world positions, enemy AI, hit resolution, projectiles, support links, gear, gathering, crafting or saves. WASD remains relative to the camera. Right drag changes camera angle, wheel zooms and F8 hides/restores the HUD. Combat continues in scenic view. Q targets, E gathers and 1–4 cast as before.

The art preference lives in `astral_empire_visuals_v1`, outside the version 3 progression payload. Legacy visual preferences default to the illustrated style. Switching art style is limited to the sanctuary and rebuilds the solo encounter view. If atlas loading fails, startup falls back to the procedural model view.

## Device controls

| Preset | Maximum pixel ratio | Shadow map in model view | Grass tufts | Ambient motes |
| --- | ---: | ---: | ---: | ---: |
| Performance | 1 | Off | 600 | 36 |
| Balanced | 1.5 | 1024² | 2,400 | 90 |
| High fidelity | 2 | 2048² | 4,800 | 150 |

Painted sprites use simple contact shadows and baked illustration lighting; they do not cast physically accurate animated character shadows. The procedural model view retains cel materials, selective outlines, a directional light and camera-following PCF shadow map. It also retains simple articulated mesh limbs and a vertex-displaced cape.

Reduced motion stops ambient shader time and portal rotation, hides motes, suppresses impact sparks and minimizes CSS animation/transitions. Player-driven movement, stepping, attacks, projectiles, telegraphs and camera controls remain functional. This is not a full accessibility audit.

## Verification and structural budgets

`npm run test:visual` renders all four illustrated realms and the model fallback, cycles all twelve hero appearances and all three presets, rejects shader errors and checks geometry lifetime. It enforces sample-view limits of 1,200 draw calls, 600,000 triangles and 15 resident textures.

For the same sample riverbank view at High fidelity, the illustrated implementation measured about 89 draw calls and 70,000 triangles, compared with roughly 730 calls and 219,000 triangles for the previous model scene. Counts depend on view and active shadow passes. These are structural measurements, not a hardware frame-rate claim.

The player browser suite checks art-style selection, portrait/roster rendering, graphics presets, preference persistence, orbit/zoom and F8 restoration alongside actual combat, gathering, profile saves, mobile layout and offline reload. It captures `.artifacts/` screenshots. The visual harness paces frames and flushes GPU work to support software rendering on CI. Screenshot review is manual; there is no automated perceptual image-diff claim. GitHub Actions uploads the artifacts.

Removed hero textures/materials and expired effects are disposed; shared prop materials/atlas sources are reused. Scene teardown releases view-owned geometry, materials, textures, shadow targets and the renderer. Base image sources are intentionally shared across view rebuilds.

## Next anime fidelity milestones

1. Consistent multi-direction walk, run, dodge, attack, cast, hurt and death sheets, aligned to actual simulation timing.
2. Dedicated Warden art and animation, biome-specific enemies and scenery, richer outfit variants and weapon silhouettes.
3. Tighter sprite foot anchors/footprints, painted water/bridge details and distinct authored realm landmarks. Extend the implemented scenery fading to richer buildings and dungeon interiors.
4. A coherent illustrated icon library, matching spell-effect sheets, better mobile composition, color/accessibility controls and broader device profiling.
5. Authored music, environmental audio, layered combat sound and recorded provenance for all assets.

The game remains a solo browser RPG with local profiles. This rendering milestone adds no cloud identity or shared-world server. Native C++/WebAssembly ABI 2 and the Elysium formula ports are unchanged.
