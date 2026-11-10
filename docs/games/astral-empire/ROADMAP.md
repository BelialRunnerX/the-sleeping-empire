# Elysium: toward a deep third-person anime MMO

## Current milestone

Version 3.12 starts native-resolution integration with a bounded editable outcrop,
first-load fine visibility and sparse persistence. Next: generalize terrain
sampling and chunked rendering, preserve coarse coverage during asynchronous
replacement, add whole-block/placement tools and full 3D player collision. The
surrounding heightfield has not been replaced by microvoxels.

Version 3.11 compounds cultivation, refining, crafted equipment, Prospector
ascension, mastery, constellation yield and Luck through a source-derived Fortune
multiplier. Preserve these interactions when expanding encounter difficulty.
Existing Elysium features remain unless they obstruct a genuine port.
Future dependencies include original world generation, ore distribution and base
Minecraft-material equivalents wherever the source expects engine-provided data;
these are not implemented by the Fortune milestone.

Version 3.10 adds renewable seed cultivation with persistent crop stages, construction and a tier-two upgrade tied to salvage and the Atelier. It adds a harvesting-focused light armor base. Further ecology work includes species-specific habitats and behaviors, creature products, and more hostile families and tiers.

Version 3.9 adds standard-mapped gamepad input, streamed field dressing, a fibre-to-bow recipe chain, two ambient wildlife species and a pouncing prowler.

Version 3.8 upgrades materials and introduces two retextured, rigged VRoid placeholders. Custom modeling is on hold while a Blender setup is prepared. Open gameplay work includes a portable field camp loop, atmosphere and suit behavior, deeper item bases and more encounter types.

Version 3.7 links source-derived geode growth and alloy recipes to four crystalline materials, fixed item effects, five weapon forms, light and heavy armor, directional shield guard and three item ascension paths. More weapon families, affix tiers and production character meshes remain in the roadmap.

Version 3.6 streams endless heightfield terrain, resource nodes and patrols around the player in all five regions. The camera toggle, grouped menus, reflection and luck effects, and mesh refinement build on 3.5.

Version 3.5 was a playable solo milestone: full 3D, five seeded regions, camera collision, direct navigation, harvestable scenery, discoveries, field fabrication, six races and nine classes, 330 constellation nodes, and cosmetic draws. Progress is local. The original C++ WebAssembly numeric core is unchanged; Elysium Codex numbers and point rules are translated in JavaScript.

Prioritize repeatable depth in the next releases: distinct item bases and tiers with visible effects, enemy behaviors and elites that counter different builds, biome-specific materials and encounters, and a new level with a reason to return. Ship each as a playable loop with a save and browser regression.

## 1. Combat identity and build depth

- Extend the implemented blade/bow/staff mechanics with rigged animation timing, charge attacks, class-specific active abilities, parries, and animation cancellation rules.
- Extend the implemented typed damage, resistance, penetration and ailment layers with guard, evasion, buildup thresholds, crowd-control immunity and inspectable defensive sources.
- Add forked, triggered and channeled skills to the implemented travelling, piercing, chained and delayed-repeat behaviors. Expand reactions beyond their current timed effects.
- Add more socket colors, support drop/crafting progression, skill levels, alternate skill forms, weapon requirements, and inspectable damage breakdowns.
- Build on the 330-node graph with class-specific entrances, ascendancies, mastery choices and build import/export. Give new nodes meaningful mechanical effects.
- Add elite affixes, additional resistance profiles, richer boss phases, interrupt rules, scenery/projectile occlusion, and dungeon encounters to the current stalker/sentinel/archer/oracle/drone roster.

## 2. Lifeskills as an equipment economy

- Extend the current equipment bases and implicit properties with prefix/suffix pools, affix tiers, crafting benches, deterministic and random crafting currencies, sockets, quality types, durability, and material provenance.
- Expand mining into veins/depth/ore grades; add forestry regrowth, plant seasons, fishing timing/locations/bait, farming, processing, cooking buffs, alchemy effects, and equipment specialization.
- Extend the implemented two-input matching, paid queues and output trays with the remaining Elysium recipe catalogue, power/share rules and inventory networks. Expand fixed sanctuary build sites into validated free-placement camps/housing with collision and permissions.
- Add production chains, profession quests, tools, mastery specializations, storage, worker assignments, logistics, and simulation while regions are unloaded.
- Profile the simulation and move stable high-cost loops into C++/WebAssembly with parity fixtures. Keep UI/content authoring in maintainable browser modules.

## 3. World and presentation

- Build production rigged anime characters from the portrait references, authored outfits, weapon animations, facial expression, effects, and sound/music assets with recorded licenses.
- Build distinct biome and resource tables atop seeded elevation and prop placement. Extend existing collision and navigation with terrain detail levels, caves, vertical traversal, weather, day/night, world events, and dungeons.
- Translate Elysium air/hazard/suit behavior into readable browser survival mechanics. Extend High Orbit’s lowered jump gravity into consistent per-world physics with hazard, suit and atmosphere systems.
- Add resource/build change sets that can migrate from local saves to authoritative world records.
- Establish performance budgets and visual/accessibility/device tests, including touch camera controls, key remapping, reduced motion, larger text, colorblind telegraphs, and controller support.

## 4. Accounts and shared persistence

- Deploy an authenticated backend with OAuth/passkeys or verified passwordless login, secure sessions, account recovery, export/deletion, rate limits, and a database with migrations/backups.
- Replace local PIN save-slot gates with real identity. Migrate local profiles explicitly and validate imported progression on the server.
- Add revisioned save synchronization and clear conflict handling for offline sessions. No silent last-writer-wins duplication of items or currency.
- Implement authoritative combat/world simulation, validated inputs, inventory transactions, deterministic reward IDs, and replayable event logs before accepting shared economies.

## 5. MMO services and endgame

- Sharded zones, presence, parties, guilds, chat/moderation, instanced dungeons, raids, matchmaking, shared claims/build permissions, social spaces, and region transfers.
- Trading and markets only after item ownership and transactions are server-validated. Add anti-duplication monitoring, economy telemetry, audit tools, and abuse controls.
- A repeatable endgame: generated expeditions, encounter modifiers, dungeon keys, escalating world tiers, boss progression, rare crafting materials, and seasonal content.
- Load tests, disaster recovery drills, observability, service limits, operating cost estimates, and a release process before public persistent-world operation.

## Release gates

Each milestone should ship as a working loop with migration tests and a browser integration check. The first networked milestone should prove two authenticated clients can share a zone and persist a validated inventory change through server restart. The first economy milestone should prove duplicate/replayed reward requests cannot create additional value. Content count alone is not a readiness gate.

### After 3.13 core-material adapter

- Continue direct subvoxel terrain visibility, streaming, 3D collision and
  underground access; retain the core drill as an alternative, not the world.
- Connect canonical ore IDs/depletion to actual mineable terrain cells, then
  expand material families only alongside complete tool/station/recipe loops.
- Implement missing base Minecraft materials explicitly; use obtainability
  closure checks with real roots and report unsupported dynamic recipes.
- Promote compounding cultivation, yield gear, Fortune, manufacturing and
  world-pressure interactions rather than neutralizing them with arbitrary caps.
