# Aetherbound: toward a deep third-person anime MMO

## Current milestone

Playable solo action-RPG region with an actual third-person WebGL view and a compiled C++ numeric module. Combat, character builds, equipment, lifeskills, crafting, heroes, and local persistence are connected. This release establishes architecture and a testable play loop; it is not a completed MMO or a Path of Exile-sized game.

## 1. Combat identity and build depth

- Give blade, bow, and staff heroes distinct attack movesets, hitboxes, animation timings, and resource mechanics. Current visual weapons share the basic melee combo.
- Split attack/spell/physical/elemental scaling, critical damage, resistance, penetration, ailment buildup, armor, guard, evasion, stagger, and crowd-control immunity into explicit stat layers.
- Replace current reaction bonus with element-specific effects and damage-over-time interactions. Add real chained, forked, piercing, repeated, triggered, and channeled skill behaviors.
- Add more socket colors, support drop/crafting progression, skill levels, alternate skill forms, weapon requirements, and inspectable damage breakdowns.
- Expand the 30-node constellation with branching crosslinks, class starts, ascendancies, mastery choices, keystone constraints, and build import/export. Keep every new node mechanically tested.
- Add enemy archetypes, resistance profiles, elite affixes, bosses with distinct phases, readable telegraphs, interrupt rules, and dungeon encounters.

## 2. Lifeskills as an equipment economy

- Introduce item bases, implicit properties, prefix/suffix pools, affix tiers, crafting benches, deterministic and random crafting currencies, sockets, quality types, durability, and material provenance.
- Expand mining into veins/depth/ore grades; add forestry regrowth, plant seasons, fishing timing/locations/bait, farming, processing, cooking buffs, alchemy effects, and equipment specialization.
- Implement Elysium foundry/alloy rules with real input/output inventories and timed jobs. Add workstation placement and persistent camp/housing construction.
- Add production chains, profession quests, tools, mastery specializations, storage, worker assignments, logistics, and simulation while regions are unloaded.
- Profile the simulation and move stable high-cost loops into C++/WebAssembly with parity fixtures. Keep UI/content authoring in maintainable browser modules.

## 3. World and presentation

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
