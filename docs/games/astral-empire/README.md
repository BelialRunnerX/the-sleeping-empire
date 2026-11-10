# Astral Empire: Aetherbound

A solo third-person 3D sci-fi anime action RPG for The Sleeping Empire. [Play Aetherbound](https://belialrunnerx.github.io/the-sleeping-empire/games/astral-empire/) or open the original [Classic gacha RPG](classic.html). Aetherbound uses browser profiles and automatic local saves.

## Version 3.9 · Living Biomes

Scanned grass clumps stream around the player. Mineable boulders, cobalt outcrops and geode beds use a simplified scanned mesh. Harvest **Loomflax** and **Downbloom** near Dawnwake or in outer chunks, twist either into **field cord**, then craft the **Coilwood field bow**. Plant depletion and harvested materials save with the profile. Fenstag and Brackhide wander and flee approaching players. Shearjaw prowlers occupy occasional outer sectors and mark a pounce landing before committing.

Connect a browser-recognized controller and press a button to activate it. **PAD** appears next to the realm. Use the left stick to move, the right stick to orbit, **A** to interact, **B** to evade, **X** to attack, **Y** to lock a target, and **LB** to guard. **RB**, **LT**, **RT** and **D-pad Right** cast Lance, Nova, Burst and Dash. **D-pad Up**, **Left** and **Down** open the survey, open skills and use an injector. **Menu** opens gear. In panels, use the D-pad or left stick to move focus, **A** to activate and **B** to close. Left stick click resets the camera and right stick click jumps. Labels use the standard Xbox-style layout.

## Version 3.8 · Dawnwake Materials

Kael and Mira now use retextured VRoid placeholder rigs. Clothing and hair use portrait-derived colors, and equipped weapons and shields follow the hand joints. The world uses photographed ground, slate, stone and alloy color and normal maps alongside a fabric normal. The asset bundle loads locally and remains available offline. Source and license details are in [assets/ASSETS.md](assets/ASSETS.md).

## Version 3.7 · Foundry Ascension

Crystallography adds gold, silver, redstone and rime geodes. After harvesting, a visible small bud grows through medium and large stages into a mature cluster. Growth continues offline. The Lifeskills material guide lists where to find each material and what to make with it.

Refine shards at the Foundry, combine gold and silver into electrum, then combine electrum and redstone into signal alloy. These feed survey optics, the reflective signal alloy carapace and a frost-resistant Rime Shunt, each with a fixed inherent effect in addition to random affixes.

Forge a longsword, twin daggers, spear, railbow or psi projector. The equipped weapon form changes the basic attack's reach, cadence and behavior. Choose light or heavy armor, and equip a shield independently in the offhand. Hold **G** to block a frontal hit for 12 stamina.

Temper gear, reshape its random affixes, and ascend it along **Force**, **Aegis**, or **Prospector**. Each of the three ascension tiers boosts base power and affix strength. Tiers require temper +4, +8, and +12, plus gold and alloy. Ascension keeps the original rolls and specializes the item. Reshaping keeps its form, inherent effect, temper, and ascension.

## Version 3.6 · Beyond the Rim

Each of the five realms streams deterministic 40-meter terrain chunks as you move. A 7×7 window keeps geometry, patrols and harvestable props bounded. Beyond the original outpost region you can find new terrain, mineral belts, trees, salvage and occasional expedition caches or relays. Returning regenerates the same sites, while local saves retain the seed, distant position, depletion, opened caches and synced relays.

Press **Left Ctrl** to toggle continuous orbit, just like holding the right mouse button. **Esc**, opening a menu or leaving the window releases it. The menus group Character, Fieldwork, Industry and Game pages. The mesh pass uses the original anime portraits as reference for layered hair, face proportions, collars and alloy details. Procedural foliage, rocks, panels and terrain shading also gained detail.

Retribution reflects a separate hit based on incoming damage before the defender's armor. Luck adds a material roll and contributes to critical chance. The [source audit](ELYSIUM_PORT.md) distinguishes the Elysium formulas from the browser-specific crit rule.

## Version 3.5 · The Living Frontier

- **Full 3D world.** Perspective camera, cel-shaded characters, 3D equipment, vegetation, resource props, drones and workstations. The title and portraits keep their illustrated art. The camera orbits, pans, zooms and shortens around terrain and nearby scenery, then eases back out.
- **Procedural exploration.** The saved seed determines terrain beyond the outpost, terrain bands, harvestable scenery, wrecks, caches, relays, rubble and patrols. The outpost, bridge, existing gathering IDs and Warden encounter are retained. Five bounded regions include High Orbit at rank 40, with its own presentation, generated layout and lower jump gravity.
- **Direct interaction.** Click or tap ground, a resource, a workstation or a discovery to approach it. Routes go around solid objects. Manual movement, attacks and damage interrupt travel. Use **E** nearby to interact. Trees, boulders, ore, plants, fishing spots and drone wrecks are harvestable. Gathered nodes recover after three minutes; opened caches and cleared rubble stay changed.
- **Field survey.** Discover landmarks by approaching them, revisit them via **M**, collect caches and clear rubble. Synchronize a relay for telemetry and survey mastery; use a synchronized relay again to return to your current region's outpost. Rogue survey drones telegraph three-shot electrical volleys.
- **Imperial Codex.** All six Elysium races and nine classes are selectable at base. Their canonical starting attributes and growth are used with browser-specific traits and weapon disciplines. After level 1, each rank grants **3 constellation points and 10 assignable attribute points**. Race and class each grant a free starter attribute bonus.
- **Build depth.** A 330-node constellation has 24 circuits, cross-links, notables and exclusive doctrines with stat tradeoffs. Scroll to zoom under the pointer, drag to pan, click to spend or refund, and use Fit to return to the full tree. Refunds must leave your build connected. Old allocations and equipment stay usable.
- **Cosmetic draws.** Your collected appearances, tickets and pity remain. Class, Codex, passives and equipment govern combat; draws and appearance switches have no gameplay stat or weapon effects. Duplicates grant cosmetic shards only.
- **Sci-fi lifeskills.** Mineral extraction, xenoforestry, xenobotany, aquaculture, metallurgy, biochemistry and field nutrition retain their existing progression. Systems salvage supplies circuitry; planetary survey supplies telemetry; fabrication combines those with refined materials to produce shield capacitors and Signal Driver Mk I/II conduits. Mk II needs rank 12 and a tier-two laboratory. New contracts track drone salvage and relay synchronization.

## Controls

| Action | Control |
| --- | --- |
| Travel or interact | Click/tap the ground or object; E uses the nearest interaction |
| Manual movement | WASD / arrows; on-screen pad on touchscreens |
| Camera | Right drag to orbit; Left Ctrl toggles continuous orbit; middle drag or Shift + right drag to pan; wheel to zoom |
| Camera shortcuts | R resets; Z/X rotate 45°; on-screen zoom, rotation and reset buttons |
| Touch camera | Drag to orbit; pinch to zoom; twist to rotate |
| Basic combo | Skill bar, Alt-click, or toggle Attack to hold the left button |
| Active skills / target / evade / jump | 1–4 / Q / Shift / Space |
| Trauma injector | F |
| Gear / skills / constellation / Codex | I / K / P / U |
| Lifeskills / workshop / Atelier / appearances | L / C / B / H |
| Journal / survey / settings | J / M / O |
| Close panel or stop travel / scenic mode | Esc / F8 |

## Saves and architecture

- Local PINs identify save slots on this browser. Settings supports JSON export and version 1–3 imports. Classic and Aetherbound maintain separate progress after migration.
- Current saves keep version 3 keys. The seed, original depleted-node IDs, position, gear, appearance collection, atelier orders, Codex choices, attribute assignments, explored sites and permanent world changes persist. An older build that spent more than the new level budget keeps those allocations until its Codex budget catches up.
- The browser caches its local shell for offline play after a successful online load. Graphics and camera preferences are stored separately from character progress. Profiles and progress are local to the browser. Chunk terrain uses heightfields, with harvestable props and persistent discoveries.
- The freestanding [C++17 module](native/simulation.cpp) still handles numeric hashing, tier/yield, mitigation and swept projectile checks, with JavaScript fallback. JavaScript owns the game state, new navigation/camera/world rules and WebGL integration. See [ELYSIUM_PORT.md](ELYSIUM_PORT.md), [ARTISAN.md](ARTISAN.md), [VISUALS.md](VISUALS.md) and [ROADMAP.md](ROADMAP.md).

## Development and verification

Serve the game over HTTP (for example, `python -m http.server 8765 --directory docs` from the repository root), then open `http://localhost:8765/games/astral-empire/`.

From this directory:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:visual
```

The test suite covers Classic, combat/WASM, save migration, production, procedural exploration, navigation, camera collision, Codex math and constellation connectivity. Browser tests exercise local login, class/appearance separation, cache collection, gathering, crafting, constellation wheel/pan, save restore, mobile layout and offline loading. Visual checks render five realms, test mesh ray picking and check geometry lifetime and structural budgets. Screenshots are written to ignored `.artifacts/`.

Set `BROWSER_EXECUTABLE` to use an installed Chrome. To rebuild the bundled module, use `npm run build:native` with Zig 0.14.1+ or Clang and a WebAssembly linker. GitHub Actions rebuilds and tests the module before running browser and visual checks.

## Earlier releases

### Version 3.4 · Artisan Awakening

Open **Atelier [B]** to construct a foundry, joinery and alchemy laboratory at fixed sanctuary sites. New workstation art, construction previews, progress rings/particles, output badges, map tracking and proximity interaction make production visible in the world. Idle, undamaged targets stay out of the target HUD until combat or explicit targeting.

Reserve inputs for sequential processing queues, collect goods and profession XP, cancel waiting work for exact refunds, and upgrade through three tiers for faster processing and larger queues. Already-paid work catches up through reloads/offline intervals; there is no unattended auto-repeat. Five processes create refined materials/draughts and feed three epic equipment recipes. Two new journal contracts reward construction and processing.

Existing version 3 saves gain the production fields without replacing old progress. See [ARTISAN.md](ARTISAN.md) for recipes, costs, controls, persistence and limitations. Elysium's order-independent two-input matching/count logic is translated to exact browser IDs; recipes, queue scheduling and workstation systems are original adaptations. [ELYSIUM_PORT.md](ELYSIUM_PORT.md) records that boundary.

### Version 3.3 · Illustrated Frontier

Version 3.3 used original AI-generated anime sprite art with an orthographic isometric camera. All twelve heroes have portraits and two full-body sprite poses. Scene depth, terrain, particles and hit detection remain in the existing WebGL/simulation coordinate system, while painted character/scenery cutouts face the camera. Trees, cottages, the portal, forge, resources, ruins and four enemy archetypes use an illustrated prop atlas. A four-surface atlas supplies painterly grass, paths, stone and riverbanks. The HUD and roster show the matching portrait art, and the title has an original illustration.

Movement switches between two poses and adds a small bob; facing mirrors the sprite, and attacks add tilt/recoil with the existing travelling projectiles and impact effects. This is a limited sprite animation treatment, not a full directional animation set. The boss currently enlarges the sentinel illustration. At that release the procedural 3D prototype was still a sanctuary setting. Device preferences and existing version 3 progress remain compatible. Version 3.5 retains the title and portraits and uses the 3D world throughout.

See [assets/ASSETS.md](assets/ASSETS.md) for every generated asset's role, provenance and exact prompt. The title illustration is not a gameplay screenshot. The files remain in the repository as release art.

### Version 3.2 · Dawnlight

A visual pass adds a banded cel-shading ramp, selective character outlines, a warm directional light with camera-following soft shadows, a gradient sky, distant ridgelines, atmospheric fog, and four coordinated realm palettes. Original procedural characters now have layered outfits, shoulder armor, boots, face/eye details, more detailed weapons, articulated knees/elbows and a moving cape. Enemies have masked armor silhouettes; the training effigy is a wooden practice dummy.

The sanctuary gains tiled stone, gold inlays, portal runes and an animated veil, blossom trees, lanterns, layered roofs, windows and planters. Instanced canopy layers and wind-driven grass, subtle terrain surface grain, drifting motes, a shallow riverbed, animated water and a wooden crossing add environment detail. Slashes, travelling projectile trails and elemental impact sparks strengthen combat feedback. These visuals are original code-authored art, not imported anime character models or additional Elysium ports.

Settings now offers **Performance**, **Balanced**, and **High fidelity** presets plus **Reduce ambient motion & effects**. These device preferences persist separately from progression. Desktop defaults to Balanced; a first visit below 700px defaults to Performance. The browser's reduced-motion preference supplies the initial setting. **F8** hides/restores the HUD for scenic viewing; the camera and combat stay active. See [VISUALS.md](VISUALS.md) for art ownership, rendering budgets and remaining limitations.

### Version 3.1 · Weapon Disciplines

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
- **Training:** an effigy beside the sanctuary's waygate gives no kill rewards. The original scout grant now unlocks a cosmetic; classes provide the weapon disciplines in 3.5.

Native WebAssembly ABI 2 adds elemental mitigation and swept projectile/target collision to the C++ core. Existing version 3 saves remain compatible. Projectiles, active enemy ailments, delayed echoes and enemy health are transient combat state; builds and recruitment persist.

Play at `/games/astral-empire/`. The rest of the Living Codex remains unchanged. The original gacha RPG, including its turn-based battles, awakening, forge, dispatches, achievements, and the earlier 2D sandbox, is preserved at [classic.html](classic.html).
