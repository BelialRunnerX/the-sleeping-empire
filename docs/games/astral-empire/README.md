# Astral Empire: Aetherbound

A third-person anime action RPG foundation for The Sleeping Empire. Version 3 replaces the menu-first landing page with a playable 3D frontier and connected build, combat, gathering, and crafting systems. It is an MMO-style **single-player prototype**, with local profiles and browser saves. Networked multiplayer and cloud accounts are not implemented.

## Version 3.1 · Weapon Disciplines

The first combat-depth expansion adds distinct weapon behavior and enemies that ask for different responses:

- **Blade:** a forward cleave can hit several foes; the third cut deals 55% more damage and slows enemy movement briefly through stagger.
- **Bow:** arrows travel through space; every third shot fans into three arrows at 65% damage each.
- **Staff:** travelling elemental bolts cost mana; every third bolt deals 50% more damage and chains once.
- **Spell Echo:** actually repeats the cast after 0.35 seconds at 60% power, using its original origin and offensive stats. It pays mana once; the echo can miss if enemies move.
- **Spectral Piercing / Arc Relay:** two new support choices change projectile collision behavior. Piercing resolves before chaining. Chains cannot revisit a target and lose 30% damage per bounce.
- **Typed damage:** separate attack, spell, elemental, armor-penetration, elemental-penetration, and elemental-resistance layers. Gear now has 13 affix families. Armor mitigates physical damage; resistance mitigates elemental damage, capped at 75%. Enemies gain another 20% resistance to their own element.
- **Reactions and ailments:** Tide chills movement and windups, Volt shocks for extra damage taken, Void exposes armor, and supported hits ignite. Steam Break weakens attacks; Wildfire burns; Superconduct/Eclipse expose; Starfall restores mana; Zenith heals. Astral Lance carries Astral and Halo Rupture carries Gale, allowing one hero to combine elements.
- **Enemy identities:** armored sentinels, travelling-arrow archers, oracles that mark a fixed eruption location, and stalkers. The Warden awakens below half life and alternates charged cleaves with radial projectile storms.
- **Combat breakdown:** the Skills panel shows first-hit physical/elemental previews against a stated reference target and the last actual impact. Critical hits, reaction bonuses and delayed/chain hits are distinguished from the first-hit preview.
- **Training:** an effigy beside the sanctuary's waygate gives no kill rewards. Heroes → Recruit Sora provides one free scout grant for existing or new profiles so all three disciplines can be tried immediately.

Native WebAssembly ABI 2 adds elemental mitigation and swept projectile/target collision to the C++ core. Existing version 3 saves remain compatible. Projectiles, active enemy ailments, delayed echoes and enemy health are transient combat state; builds and recruitment persist.

Play at `/games/astral-empire/`. The rest of the Living Codex remains unchanged. The original gacha RPG, including its turn-based battles, awakening, forge, dispatches, achievements, and the earlier 2D sandbox, is preserved at [classic.html](classic.html).

## Implemented gameplay

- Third-person WebGL world with a visible animated character, camera-relative movement, orbit/zoom camera, jump, evade, sanctuary, ruins, resource nodes, minimap, enemies, and a named boss.
- Five active abilities: three-hit melee chain, ranged Astral Lance, radial Halo Rupture, offensive Rift Step, and Seraphic Eclipse. Skills consume mana and use separate cooldowns. Evade consumes stamina and grants brief invulnerability.
- Enemies chase, telegraph attacks, strike, recover, leash to their home, and respawn. The Sleeping Warden has a wider, slower charged attack and epic loot. Hits no longer cancel attack telegraphs automatically.
- Eight support modifiers: delayed echo, larger area, life leech, ignite, faster cooldown recovery, execute, piercing, and chaining, plus an unlinked state. Two support slots per active skill; compatibility follows skill tags and duplicate supports are prevented.
- Thirty allocatable constellation passives across six branches. Six capstones create tradeoffs: attack/spell specialization, mana scaling, armor/life versus movement, critical hits versus normal hits, recovery versus mana, and crafting/yield.
- Three equipment slots, 13 affix families, magic/rare/epic items, equipment drops, level scaling, tempering up to +20, affix reshaping, and salvage. Equipped items cannot be salvaged.
- Seven lifeskills: Mining, Forestry, Herbalism, Fishing, Smithing, Alchemy, and Cooking. Gatherers gain resource yield through mastery. Smithing mastery improves crafted base power; alchemy/cooking mastery improves recipe output.
- Six recipes spanning weapons, armor, charms, restorative draughts, transmutation essence, and meals. Meals improve life and recovery for 15 minutes. Gathering is interruptible by movement or enemy damage.
- Twelve gacha heroes with different elements, visual weapon styles, and build traits. Summons retain the 40-pull legendary guarantee. Duplicates award crafting essence. Element changes on an enemy trigger extra reaction damage.
- Five journal contracts, level experience, gold/crystal rewards, and four selectable realm palettes. Later routes unlock at levels 10, 20, and 30.

This is a first region and a build system foundation. It does not contain Path of Exile's content volume, endgame atlas, multiplayer economy, raids, or production anime character assets. Current characters and environment are procedural stylized meshes. Realm palettes share a region layout and enemy roster; they are not distinct fully authored planets. Flight, caves, building placement, housing, and full planetary physics remain future work.

## Controls

| Action | Control |
| --- | --- |
| Move | WASD / arrows |
| Camera | Right mouse drag; wheel to zoom |
| Basic combo | Left mouse / hold |
| Active skills | 1–4 |
| Evade / jump | Shift / Space |
| Target lock | Q |
| Gather nearby node | E; remain still until complete |
| Healing draught | F |
| Equipment / skills / constellation | I / K / P |
| Lifeskills / crafting / heroes / journal | L / C / H / J |
| Settings / close panel | O / Escape |

Phones have movement, evade, jump, interaction, and action buttons. Desktop is the primary play target. Opening the chronicle pauses the solo simulation.

## C++ and browser architecture

The shipped `native/simulation.wasm` is compiled from [native/simulation.cpp](native/simulation.cpp), a freestanding C++17 module. It runs world hashing, Elysium's derived tier and ore-yield formulas, armor/critical calculations, elemental mitigation, and swept projectile collision. The WebAssembly module has no host imports.

JavaScript still owns the entity state machine, movement, input, skills, saves, and rendering integration. This is a C++/WebAssembly + WebGL hybrid, not a claim that the entire game has been rewritten in C++. A JavaScript numeric reference path keeps the game usable if WebAssembly loading fails. Tests compare both paths, including signed/unsigned boundary cases.

| File | Responsibility |
| --- | --- |
| `engine/content.mjs` | Skills, support modifiers, heroes, affixes, passive graph, professions, recipes, contracts |
| `engine/simulation.mjs` | Stable public API re-exporting combat and progression |
| `engine/combat.mjs` | Weapon movesets, cast snapshots, projectiles, typed damage, reactions, ailments, enemy AI, boss phases |
| `engine/progression.mjs` | Inventory, crafting, derived stats, migration, skills, quests, and recruitment |
| `engine/native.mjs` | C++ WebAssembly loading and numeric reference fallback |
| `engine/world.mjs` | Three.js scene, procedural meshes, terrain, camera, animation, effects, and resource visuals |
| `engine/profiles.mjs` | Local profiles, isolated saves, migration, and recovery copies |
| `engine/app.mjs` | HUD, panels, controls, browser loop, and save/export integration |

Three.js 0.187.0 is vendored under `vendor/` with its MIT license. Runtime modules and WebAssembly are served locally; no runtime package CDN is required. Optional Google fonts have system-font fallbacks.

## Persistence and compatibility

- Create a named local profile and PIN, then use Continue to restore it. A local PIN gates save slots on that browser; it is not secure account authentication.
- Saves use `astral_empire_profile_<id>_v3`; the previous payload is retained under the same key with `_backup` appended.
- Existing profile names/PINs are recognized. On first entry, version 2 profile saves or the legacy `astral_empire_v1` save are copied into the new schema. Heroes, hero levels, gold, summon currency, tickets, pity, suitable equipment, and frontier material stock are migrated.
- Legacy payloads are left intact for Classic mode. Classic and Aetherbound then progress independently; there is no bidirectional live sync. Classic terrain coordinates and edits are retained in the Classic save, not translated into 3D geometry.
- Current realm, player position, life/mana, equipment, passives, skill links, professions, depleted-node recovery timestamps, defeated-enemy timestamps, quests, and consumables persist.
- Health and mana restore at login. In-progress attacks, enemy health, cooldowns, and gathering channels restart; they are transient encounter state.
- Save automatically every five seconds, after progression actions, on logout, and when the page hides. Use Settings → Export for a portable JSON backup. Import accepts version 1, 2, or 3.
- Clearing browser data removes local profiles. Cloud recovery and cross-device sync need an authenticated backend.

The service worker caches the complete local game shell, modules, Three.js, Classic page, and WebAssembly. Game documents use network-first updates. Cache handling is limited to this game directory. First load must be online or locally served.

## Development and verification

Serve this directory with an HTTP server; ES modules and WebAssembly should not be opened with `file://`. For example, from the repository root:

```sh
python -m http.server 8765 --directory docs
```

Open `http://localhost:8765/games/astral-empire/`.

From this game directory:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
```

`npm test` runs 19 Classic smoke checks and 23 action-RPG/WASM/save checks. The browser suite uses an isolated test profile and local server, checking WebGL/WASM startup, free scout recruitment, switching disciplines and landing a projectile hit, the damage inspector, movement, actual world harvesting, support changes, passive allocation, workshop access, targeting/skills, logout/login, reload persistence, a 390px mobile layout, and an offline reload. It captures screenshots in ignored `.artifacts/`. It does not establish broad device performance, full balance, accessibility compliance, or multiplayer readiness.

For an installed Chrome instead of downloaded Chromium, set `BROWSER_EXECUTABLE` to the browser executable path. The GitHub Actions workflow compiles the C++ module, runs rule/compatibility tests, then runs the browser suite.

Rebuild the native module using Zig 0.14.1+ (set `ZIG` to its executable if it is not on PATH):

```sh
npm run build:native
```

Alternatively set `CXX=clang++` with a Clang WebAssembly target and `wasm-ld` available. The generated binary is committed so GitHub Pages needs no build process.

See [ELYSIUM_PORT.md](ELYSIUM_PORT.md) for the precise source-port boundary and [ROADMAP.md](ROADMAP.md) for the MMO and build-depth work remaining.
