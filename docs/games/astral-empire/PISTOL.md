# Aethercoil pistol prototype

User direction: finite magazine, infinite reserve, hitscan, good damage and normal weapon progression. This is a browser adaptation, not an EnTT implementation.

- Craft Aethercoil pistol in field Crafting (4 cobalt + 1 circuitry), equip through Gear. Does not replace existing saves or grant gear silently.
- 12 rounds; 1.35-second reload begins automatically after the last round. Early reload with V or the ammo HUD button. RT/LMB and mobile held primary work through the existing attack path. No controller mapping overwritten: controller users auto-reload.
- Instant first ray/sphere hit within 30 m; cover and voxel terrain block hits. No area cleave, traveling projectile or pierce. Uses existing target assistance. No ballistic trajectory.
- Base power multiplier 1.15, 0.25-second shot interval before haste, 80% physical. Tuning is original and provisional, not source-mod numbers. Existing criticals, affixes and Force/Aegis/Prospector ascension apply.
- Temper, reroll/reforge and ascend use the real existing equipment system. Magazine/reload state belongs to the item and survives save/load. Unequipped weapons do not reload; menus pause reload with simulation.
- Sidearm is a newly code-authored provisional mesh with cyan inset, not the missing detailed pistol asset. Rig has an initial aim/recoil pose. Detailed asset replacement and refined hand/muzzle alignment remain work.

## Verification
175 Node unit tests passed including four new firearm tests: magazine/reload/save state, temper/reforge/ascension, immediate nearest hit and cover, ray boundaries/clamping. Syntax checks passed.

Focused browser verification now passes desktop and touch-emulated landscape: real primary input consumes a round, a normal skill does not, ammo-button reload returns twelve rounds, and a service-worker offline reload preserves the equipped pistol and magazine. Actual screenshots inspected. The initial focused run exposed an ammo overlay intercepting the camera-mode control; ammo is now in the character HUD. Full legacy browser/visual verification is run separately at integration. Physical devices are not certified.

Merge notes: small hunks in app/world/avatar-rig may overlap male/harvest integration; keep newer male loader and harvest pose logic. Add firearms.mjs to offline shell and bump cache/version centrally when releasing.

## 3.19.1 original model
The game now mounts the original authored GLB: 9,052 triangles, six shared PBR material batches, no external textures, grip and muzzle sockets. Its natural 0.298m length is scaled 1.2x at the three-block avatar scale. Aiming pose now receives the pistol form and keeps its barrel aligned with character forward. Finger articulation and precise target-height IK remain unfinished. The code model remains only a loading/error fallback. Model asset is cached in the offline shell; no save schema changes.

## Grip and relaxed idle follow-up
Pistol now uses a palm-relative grip frame with articulated fingers rather than an open hand under a world-fixed gun. At rest the right arm lowers and muzzle points down; firing immediately raises it, holds ready for 0.8 seconds, then eases down. Idle has subtle breathing, asymmetric arms and spinal weight shift; reduced-motion disables idle oscillation. Wrist/finger rest transforms restore when changing weapons. No ballistic, inventory, damage or save format changes.

Verified actual desktop/touch primary, magazine reload and offline save restoration; focused pose tests cover breathing/reduced motion, lowered/aimed barrel, grip and reset. Side-on local gameplay screenshots confirm the lower-ready silhouette. This remains procedural animation, not authored motion capture or full-body target-height IK; exact finger/trigger contact and wrist transitions need further art polish.
