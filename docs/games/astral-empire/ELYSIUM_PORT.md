# Elysium source audit and browser adaptation

Source inspected: `BelialRunnerX/Elysium-mono` at `c0ebd4692c4e95964149a119bd5fff7a4f9d4ea4`. Target integration began at `BelialRunnerX/the-sleeping-empire` commit `4df7ea51c22793af0e25ebbb86c866f15f04d6f4`; unrelated later story changes were preserved before the game commit.

Elysium-mono is a **Java/NeoForge Minecraft module collection**. There was no native C++ engine in the inspected source. Aetherbound's C++ module is newly authored for the browser adaptation; it does not imply that Minecraft or NeoForge were compiled into this game.

## Direct rule ports

| Source | Browser implementation | Preserved behavior |
| --- | --- | --- |
| `elysium-lib/src/main/java/com/elysium/lib/tier/ElysiumWorldTier.java` | `native/simulation.cpp::world_tier`, JavaScript reference in `engine/native.mjs` | `max(0, floor(level / 10), deepestWorldFloor)` |
| `elysium-ores/src/main/java/com/elysium/ores/rules/OreRules.java` | `native/simulation.cpp::ore_yield`, JavaScript reference | One guaranteed unit; extra `floor(tier / 3)` with probability `tier / (tier + 6)` |
| `elysium-foundry/src/main/java/com/elysium/foundry/recipe/AlloyRecipe.java` | `engine/artisan.mjs::matchAlloy` | Two-input matching in either order and corresponding consumption counts; Ingredient predicates narrowed to exact browser material IDs |

Parity tests instantiate the compiled C++ WebAssembly module and check the reference implementation across tier boundaries and rolls. The game calls these native exports when WebAssembly is available. Browser-specific mastery and artisan bonuses are added after the Elysium yield rule.

## Adapted data and concepts

- `elysium-space/.../world/SpaceWorld.java` provides the names and gravity metadata for Emerald Bastion, Pale Moon, Cinderveil, Frostfall, and High Orbit. Classic retains all five in its 2D sandbox. Aetherbound currently offers four terrain palettes and omits High Orbit. Gravity is displayed as source metadata; it does not yet change jump or fall physics.
- World hazards and air classifications are visible in Classic, but no oxygen/thermal/radiological simulation has been ported.
- `elysium-space/.../world/SpaceTiers.java` was inspected. The original ranks High Orbit/Pale Moon as Ascent, Cinderveil as Summit, Frostfall as Pinnacle, and Emerald Bastion as Apotheosis. Aetherbound deliberately uses Emerald Bastion as the starter sanctuary (tier zero), then unlocks other realms at 10/20/30. These gates are a browser gameplay adaptation, not the original route table.
- `elysium-ores/.../rules/CordonMaterials.java` informs material identities such as cobalt, null amethyst, and ember slag. Classic uses several directly as resources; Aetherbound currently gathers cobalt plus browser-specific timber, starleaf, and moonfin.
- `elysium-foundry/.../recipe/AlloyRecipe.java` supplies the matching/count logic above. Version 3.4 uses it for two-input processing. Classic's Alloy Smelter remains cosmetic progression. The browser's material recipes, wall-clock queues, output trays, station costs/upgrades and profession rewards are newly authored; neither mode runs Elysium's block entity, power/share network or Minecraft-tick inventory processing. Equipment recipes may have more than two inputs.

## Newly implemented browser systems

Version 3.4 adds the original local production scheduler, sanctuary construction/upgrades, offline catch-up, input reservation/refunds, output collection, new epic equipment and illustrated workstation activity. The narrow matching/count port is independently identified above. It does not imply a complete foundry-system port or new native C++ exports. See [ARTISAN.md](ARTISAN.md) for the exact implemented loop.

The procedural 3D terrain, stylized character/environment meshes, animation, camera, combat state machine, enemy AI, damage/armor formula, skills/supports, constellation graph, affixed equipment, mastery progression, gathering channels, crafting recipes, minimap, UI, local profiles, versioned saves, and migration are Aetherbound implementations. Elysium inspired their sandbox role; they are not source ports.

The C++ world hash, damage, elemental mitigation and swept-collision exports are new code. Entity simulation and persistence still run in JavaScript. Native ABI 2 covers six numeric operations. The 3.1 weapon disciplines, projectile chains/echoes, timed reactions and enemy archetypes are browser-native additions, not Elysium source ports. Version 3.2's cel shading, shadows, code-authored character/environment art, procedural textures, foliage/water shaders and graphics controls are also original browser work. No Minecraft textures, models, lighting engine or native C++ rendering system was ported.

## Not ported

Version 3.3's isometric camera, sprite rendering, two-pose animation treatment and AI-generated portrait/scenery/ground/title assets are new Aetherbound work. None were extracted from Elysium or Minecraft. The numeric C++ ABI and source-formula port boundary are unchanged.

Minecraft chunk generation and saves, block states, terrain lighting, fluids, rooms, oxygen distributors, suits, hazard mitigation, station generation, native waygates, dimensions, network payloads, biome generation, mob/entity AI, contracts/archive logic, claims, vehicles, logistics, industry, automation, research, enchanting, flora, trinkets, and dungeon generation remain outside this implementation.

The corresponding Java/NeoForge files should be translated by behavior and tested against extracted pure rules as each feature is added. WebAssembly is an implementation option for expensive simulation; it does not remove Minecraft runtime dependencies automatically.

## Preservation boundary

The former game remains available as `classic.html`, and its 19 regression checks still run against that page. New Aetherbound saves use version 3 keys; earlier saves remain intact. Migration imports suitable hero/equipment/material data into the action RPG. Old tile edits are not claimed to become 3D terrain changes.

The project remains a static game subpage. No root-site lore/navigation changes, remote account service, multiplayer server, paid infrastructure, or real-money system were introduced.
