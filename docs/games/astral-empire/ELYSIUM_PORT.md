# Elysium source audit and browser adaptation

Source inspected: `BelialRunnerX/Elysium-mono` at `c0ebd4692c4e95964149a119bd5fff7a4f9d4ea4`. Target integration began at `BelialRunnerX/the-sleeping-empire` commit `4df7ea51c22793af0e25ebbb86c866f15f04d6f4`; unrelated later story changes were preserved before the game commit.

Elysium-mono is a **Java/NeoForge Minecraft module collection**. There was no native C++ engine in the inspected source. Aetherbound's C++ module is newly authored for the browser adaptation; it does not imply that Minecraft or NeoForge were compiled into this game.

## Direct rule ports

| Source | Browser implementation | Preserved behavior |
| --- | --- | --- |
| `elysium-lib/src/main/java/com/elysium/lib/tier/ElysiumWorldTier.java` | `native/simulation.cpp::world_tier`, JavaScript reference in `engine/native.mjs` | `max(0, floor(level / 10), deepestWorldFloor)` |
| `elysium-ores/src/main/java/com/elysium/ores/rules/OreRules.java` | `native/simulation.cpp::ore_yield`, JavaScript reference | One guaranteed unit; extra `floor(tier / 3)` with probability `tier / (tier + 6)` |
| `elysium-foundry/src/main/java/com/elysium/foundry/recipe/AlloyRecipe.java` | `engine/artisan.mjs::matchAlloy` | Two-input matching in either order and corresponding consumption counts; Ingredient predicates narrowed to exact browser material IDs |
| `ElysiumTreeRules.java` / `ElysiumTreeState.java::earned` | `engine/codex.mjs::earnedPassives` | 3 points for each level gained starting at level 2. Browser has a legacy allocation floor and free connected refunds. |
| `ElysiumCharacter.java::POINTS_PER_LEVEL`, `ElysiumRaces.java`, `ElysiumClasses.java` | `engine/codex.mjs` | 10 assignable attribute points per gained level, all six race base tables and race/class growth tables, and both free +3 starter attribute bonuses. |
| `ElysiumStats.java`, `ElysiumShares.java`, `ElysiumCombatHandler.java`, `ElysiumRaces.java::SanctionedAnswer` | `engine/codex.mjs`, `engine/combat.mjs` | Retribution uses `value / (value + 225)`. Imperial's level share combines independently. Reflection responds to the incoming blow before defender armor, and resolves once without crits, reactions, leech or recursive reflection. |
| `ElysiumStats.java::luckChance`, `ElysiumLootHandler.java` | `engine/codex.mjs`, `engine/progression.mjs` | Luck uses `value / (value + 175)` for an independent material roll. The browser uses one extra gathered unit and adds a quarter of that chance as a separate crit opportunity. Vanilla loot and multi-crit handling are separate systems. |
| `GeodeRules.java::CHAIN` | `engine/geodes.mjs` | Small, medium and large buds mature into a harvestable cluster. The browser uses wall time and four source materials instead of Minecraft random ticks and the full catalogue. |
| `FloraRules.java::harvest`, `FIBRE_PER_STRING`, `TUFT_PER_STRING` | `engine/ecology.mjs`, `engine/content.mjs` | One base unit, an extra `floor(tier / 6)` at probability `tier / (tier + 10)`, and exact 3 Loomflax fibre or 4 Downbloom tuft per cord. Browser mastery and Luck apply afterward. |
| `FloraRules.java::STAGES`, `MATURE`, `WILD_SEEDS` and the baseline seed return in `FibreCropBlock.java` | `engine/nursery.mjs`, `engine/progression.mjs` | Eight stages, harvest at age seven, two seeds from wild gathering and one seed returned by a mature cultivated crop. |
| `elysium-foundry/.../recipe/electrum_alloy.json` and `signal_alloy_alloy.json` | `engine/artisan.mjs` | Electrum uses one gold and one silver ingot (160 ticks / 8 s). Signal alloy uses one electrum and two redstone (220 ticks / 11 s). Browser tiers and queue speed are separate. |

## Adapted data and concepts

### Native playable-build subvoxel reference

The separate native reference is `C:\ElysiumDev\exe\playable_build`, matched to
`C:\ElysiumDev\playable_baseline` by executable SHA-256
`29E1A8F53B3DE10E1DF4D3DB86B8804AB2567EB7CF1AADEDB40A36E97B2489EA`.
This is not the Java/NeoForge repository. Browser `microvoxels.mjs` adapts
`world/resolution.h`, `engine/voxelcell.h`, `engine/voxeltool.cpp` and the sparse
edit model: 1m blocks, 16 cells per edge, 4096 integer volume units, 32-block
persistence chunks, floor-based negative addressing and DDA cell selection.
The browser uses a rounded local outcrop generator, not the native cube-sphere
planet generator, face addressing or save format. Its greedy mesher samples a
one-cell halo and its planar movement checks the edited occupancy volume.

The reported native visibility failure is explicitly not reproduced: initial
fine mesh construction never depends on having edits, and coarse fallback stays
until replacement publication. Tests check unedited first load, sparse-save
reload, exact one-cell recovery and publication rejection after disposal or a
newer revision. The current renderer is synchronous; these guards are not a
claim of an asynchronous worker implementation.

### Browser adaptations

- `FloraRules.fortuned(amount, fortune, roll)` is ported as the pure `fortuned`
  helper in `ecology.mjs`, including identity at zero Fortune and the source
  multiplier boundaries. Cultivated seed returns use a separate roll, matching
  the source's separate fibre/seed Fortune applications. Browser adaptation:
  Fortune multiplies the complete fibre subtotal after mastery, equipment yield,
  Artisan and Luck; it also affects wild fibre (source wild plants are seed
  sources). Wild seed return remains two. Cultivator lattice and its Prospector
  Fortune levels are browser-designed equipment/recipe progression. Equipment is
  evaluated at harvest; deterministic independent salts keep reloads reproducible.

- The Elysium flora registry supplies Loomflax and Downbloom. Wild browser patches yield fibre and seeds and recover in three minutes. Source wild plants provide seeds for cultivation. The nursery converts growth to wall-clock time with two construction tiers. Minecraft block growth, farmland, bonemeal and Emberwood fuel remain separate; the Fortune adaptation is documented above. The field cord, Coilwood bow and Xenotwill jacket use browser materials and XP.
- `FaunaRules.java` supplies Fenstag and Brackhide identities, roles and target silhouette heights. Their wandering and avoidance are browser behavior. `BeastRules.java` supplies the Shearjaw prowler identity. Browser hit points, pounce timing, terrain checks, damage and rewards are original tuning. Creature art comes from CC0 packs.

- `elysium-space/.../world/SpaceWorld.java` provides the names and gravity metadata for Emerald Bastion, Pale Moon, Cinderveil, Frostfall, and High Orbit. Classic retains all five in its 2D sandbox. Aetherbound offers all five destinations. High Orbit uses lower jump gravity tuned for browser combat; listed source gravity values are metadata.
- World hazards and air classifications are visible in Classic, but no oxygen/thermal/radiological simulation has been ported.
- `elysium-space/.../world/SpaceTiers.java` was inspected. The original ranks High Orbit/Pale Moon as Ascent, Cinderveil as Summit, Frostfall as Pinnacle, and Emerald Bastion as Apotheosis. Aetherbound deliberately uses Emerald Bastion as the starter sanctuary (tier zero), then unlocks other realms at 10/20/30/40. These gates are a browser gameplay adaptation, not the original route table.
- `elysium-ores/.../rules/CordonMaterials.java` informs material identities such as cobalt, null amethyst, and ember slag. Classic uses several directly as resources; Aetherbound currently gathers cobalt plus browser-specific timber, starleaf, and moonfin.
- `elysium-foundry/.../recipe/AlloyRecipe.java` supplies the matching/count logic above. Version 3.4 uses it for two-input processing. Classic's Alloy Smelter remains cosmetic progression. The browser's material recipes, wall-clock queues, output trays, station costs/upgrades and profession rewards are newly authored; neither mode runs Elysium's block entity, power/share network or Minecraft-tick inventory processing. Equipment recipes may have more than two inputs.
- The six race and nine class IDs, numbers and starter bonuses above are direct data translations. Browser traits are gameplay adaptations; NeoForge event hooks, race-specific mechanics and original class passives are not executed. The 330-node constellation is a new graph using the Codex point budget, not a copy of the Ledger Web layout, doctrines or costs. Cosmetics are independent of stats.

## Newly implemented browser systems

Version 3.7 adds shard refining, the material guide, original weapon and armor profiles, directional shield guard, item effects, and three ascension branches. These browser rules are separate from Elysium item stats and durability.

Version 3.6 adds an original deterministic 40-meter heightfield chunk generator and streams terrain, resources and patrols. Minecraft chunk and block formats are still separate.

Version 3.5 adds seeded heights, resource placement, caches, rubble, relays and patrols; obstacle-aware travel; perspective camera collision; harvestable 3D scenery; and the salvage, survey and fabrication loops. These systems and the added High Orbit scene are original browser work, with no Minecraft chunk, block or fluid simulation.

Version 3.4 adds the original local production scheduler, sanctuary construction/upgrades, offline catch-up, input reservation/refunds, output collection, new epic equipment and illustrated workstation activity. The narrow matching/count port is independently identified above. It does not imply a complete foundry-system port or new native C++ exports. See [ARTISAN.md](ARTISAN.md) for the exact implemented loop.

The procedural 3D terrain, stylized character/environment meshes, animation, camera, combat state machine, enemy AI, damage/armor formula, skills/supports, constellation graph, affixed equipment, mastery progression, gathering channels, crafting recipes, minimap, UI, local profiles, versioned saves, and migration are Aetherbound implementations. Elysium inspired their sandbox role; they are not source ports.

The C++ world hash, damage, elemental mitigation and swept-collision exports are new code. Entity simulation and persistence still run in JavaScript. Native ABI 2 covers six numeric operations. The 3.1 weapon disciplines, projectile chains/echoes, timed reactions and enemy archetypes are browser-native additions, not Elysium source ports. Version 3.2's cel shading, shadows, code-authored character/environment art, procedural textures, foliage/water shaders and graphics controls are also original browser work. No Minecraft textures, models, lighting engine or native C++ rendering system was ported.

## Not ported

Version 3.3's isometric camera, sprite rendering, two-pose animation treatment and AI-generated portrait/scenery/ground/title assets are new Aetherbound work. None were extracted from Elysium or Minecraft. The numeric C++ ABI and source-formula port boundary are unchanged.

Remaining Minecraft systems include chunk formats and saves, block states, terrain lighting, fluids, rooms, oxygen distributors, suits, hazard mitigation, station generation, native waygates, dimensions, network payloads, biome generation, entity AI, contracts/archive logic, claims, vehicles, logistics, industry, automation, research, enchanting, emberwood fuel, trinkets, and dungeon generation.

The corresponding Java/NeoForge files should be translated by behavior and tested against extracted pure rules as each feature is added. WebAssembly is an implementation option for expensive simulation; it does not remove Minecraft runtime dependencies automatically.

## Preservation boundary

The former game remains available as `classic.html`, and its 19 regression checks still run against that page. New Aetherbound saves use version 3 keys; earlier saves remain intact. Migration imports suitable hero/equipment/material data into the action RPG. Old tile edits are not claimed to become 3D terrain changes.

The project remains a static game subpage. No root-site lore/navigation changes, remote account service, multiplayer server, paid infrastructure, or real-money system were introduced.
