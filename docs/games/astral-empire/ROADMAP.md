# Aetherbound: toward a deep third-person anime MMO

## Current milestone

Version 3.3 makes illustrated isometric 2.5D the default art direction, retaining the third-person procedural 3D view as a sanctuary setting. Twelve heroes have AI-generated portrait art and paired full-body sprite poses; painted scenery, enemies, terrain and title art share a consistent direction. Gameplay and version 3 saves remain connected to the existing simulation. Full directional animation sheets, dedicated boss sprites and richer environmental art remain ahead.

Playable solo action-RPG region with an actual third-person WebGL view and a compiled C++ numeric module. Version 3.1 adds blade/bow/staff disciplines, travelling projectiles, delayed echoes, piercing/chaining, typed damage/resistance, mechanical reactions, four enemy archetypes and a two-phase Warden. Combat, character builds, equipment, lifeskills, crafting, heroes, and local persistence are connected. This remains a foundation rather than a completed MMO or a Path of Exile-sized content library.

## 1. Combat identity and build depth

- Extend the implemented blade/bow/staff mechanics with rigged animation timing, charge attacks, hero-specific active abilities, parries, and animation cancellation rules.
- Extend the implemented typed damage, resistance, penetration and ailment layers with guard, evasion, buildup thresholds, crowd-control immunity and inspectable defensive sources.
- Add forked, triggered and channeled skills to the implemented travelling, piercing, chained and delayed-repeat behaviors. Expand reactions beyond their current timed effects.
- Add more socket colors, support drop/crafting progression, skill levels, alternate skill forms, weapon requirements, and inspectable damage breakdowns.
- Expand the 30-node constellation with branching crosslinks, class starts, ascendancies, mastery choices, keystone constraints, and build import/export. Keep every new node mechanically tested.
- Add elite affixes, additional resistance profiles, richer boss phases, interrupt rules, scenery/projectile occlusion, and dungeon encounters to the existing stalker/sentinel/archer/oracle roster.

## 2. Lifeskills as an equipment economy

- Introduce item bases, implicit properties, prefix/suffix pools, affix tiers, crafting benches, deterministic and random crafting currencies, sockets, quality types, durability, and material provenance.
- Expand mining into veins/depth/ore grades; add forestry regrowth, plant seasons, fishing timing/locations/bait, farming, processing, cooking buffs, alchemy effects, and equipment specialization.
- Implement Elysium foundry/alloy rules with real input/output inventories and timed jobs. Add workstation placement and persistent camp/housing construction.
- Add production chains, profession quests, tools, mastery specializations, storage, worker assignments, logistics, and simulation while regions are unloaded.
- Profile the simulation and move stable high-cost loops into C++/WebAssembly with parity fixtures. Keep UI/content authoring in maintainable browser modules.

## 3. World and presentation

- Expand the illustrated direction with true multi-direction walking, attack, casting, hurt and death animation sheets. Add dedicated Warden/boss art, coherent biome-specific prop libraries and consistent world-object footprints. Extend the implemented scenery fading to richer dungeon interiors. Retain exact asset provenance and separate title illustrations from gameplay screenshots.

Version 3.2 delivers a procedural visual foundation: cel materials/outlines, soft directional shadows, atmosphere, detailed outfits/weapons, simple articulated limbs and capes, sanctuary architecture, layered instanced foliage, animated water, projectile trails/impacts, three graphics presets, reduced ambient motion and an F8 scenic view. Four-realm render checks and geometry-lifetime checks accompany it. Authored skeletal models, production animation and distinct realm maps are still future work.

- Replace placeholder procedural meshes with original rigged anime characters, authored outfits, weapon animations, facial expression, effects, and sound/music assets with recorded licenses.
- Build distinct maps for each realm; add streamable terrain chunks, caves, vertical traversal, weather, day/night, environment collision, navigation, safe spawn validation, world events, and discoverable dungeons.
- Translate Elysium air/hazard/suit behavior into readable browser survival mechanics. Apply actual per-world gravity instead of metadata alone.
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
