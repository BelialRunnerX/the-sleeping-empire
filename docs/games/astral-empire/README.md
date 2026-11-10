# Astral Empire: Elysium

A solo third-person 3D sci-fi anime action RPG for The Sleeping Empire. [Play Elysium](https://belialrunnerx.github.io/the-sleeping-empire/games/astral-empire/) or open the original [Classic gacha RPG](classic.html). Elysium uses browser profiles and automatic local saves.

## Version 3.20 - Field tools and creatures

The pistol now rests lowered with a relaxed breathing pose, raises while firing, and uses articulated finger grip. Contact remains approximate rather than full-body IK.

Original axe/pickaxe models now accompany gathering and successful mining, with separate chop/mine/reach poses and interrupted-action gear restoration. The new Lumi deer and ORBI drone replace their placeholders. Deer uses conservative procedural joint walking/fleeing rather than authored animation clips or foot IK; ORBI uses root hover. Harvest poses are not adaptive surface-contact IK. Existing ranges, rewards, inventory and saves remain unchanged.

## Version 3.19.1 - Original pistol model

The Aethercoil now uses its original six-material GLB (9,052 triangles), mounted at the palm with corrected forward aiming pose. Cached offline; existing crafting, damage, magazines and saves unchanged. Finger articulation and target-height IK remain provisional.

## Version 3.19 - Craftable Aethercoil pistol

Craft and equip the pistol using four cobalt and one circuitry. It has a 12-round magazine, infinite reserve, automatic reload when empty, and manual reload with V or its ammo button. Hitscan respects range and cover; tempering, reforging and ascension remain available. The current weapon mesh is a provisional code-authored model, not the detailed asset. Existing saves and both custom bodies are retained.

## Version 3.18.1 - Custom male model

Male body selection now uses the completed project male v36 design via its losslessly batched v38 runtime export: 39,584 triangles, about4.17MB,23 material batches, no earrings. Female remains selectable, both normalize to3blocks, and appearance selections/old saves remain compatible. Authored material appearance is retained. Coat cloth simulation is not implemented; skin/animation checks are bounded, not exhaustive armor collision certification. The lore landing and codex also receive their separately tested cyan-glass/solarpunk restyle.

## Version 3.18 - Optional custom female appearance

Character declaration now offers Male (the existing model) or Female (the custom work-in-progress prototype). This is cosmetic only: no race/class/stat changes. Old profiles keep their old appearances until explicitly changed. The female asset loads on selection, is cached for offline reuse, and is normalized to the same three-block body height. It adds approximately 123k triangles and16 textures when loaded; its lower-poly armor/hair derivative is not identical to the authoring preview. Physical-device performance remains unverified. The new male prototype is not substituted yet.

## Version 3.17.1 - Elysium and mobile interaction

Visible game branding is Elysium. Touch layout retains the left movement stick and replaces the right stick with Interact and held-primary (LMB) buttons. Camera drag/pinch remains available. The local profile login uses the sci-fi solarpunk background and supports visible-viewport/keyboard scrolling on small screens. Keyboard/controller bindings remain unchanged.

## Branding and compatibility

The game is now **Elysium** (formerly Aetherbound). Existing URLs, saved profiles, internal event names and file paths remain stable; no save migration or reset is required. The Sleeping Empire canon and the named Aetherbound oathblade item are unchanged.

## Version 3.17 - Continental frontier and finer voxel trees

New adventures now start on an irregular continental Bastion with mountain chains, connected river/lake/ocean water, a two-kilometre horizon, and upright swimming/wading. Existing saved worlds retain their original terrain; create a separate New Adventure to explore the new baseline. This is a finite 32.768 km browser continental adaptation, not infinite planets or fluid simulation. Other realms retain their existing terrain.

Trees now stand 6–15 m tall with 0.1875 m cells. Their collision, exact wood-volume harvest and permanent felled state remain coherent. Players retain the 3 m body / 48 microcell scale and 3.16.1 controller mapping. Crouch, weapon switch, fifth ability and build placement are still reserved, not implemented.

Provisional performance: greedy batching reduces geometry, but Moon, Cinder and Orbit currently exceed the old 600k triangle optimization target (approximately813k/703k/628k in the fixed visual fixtures). This release proceeds with explicit owner approval; texture/draw-call/leak gates remain. Physical phone/controller performance is not certified. See `CONTINENTAL_WIP.md` for remaining limits.

## Version3.16 - Dawnwake introduction and world surfaces

The Journal now offers thirteen ordered introduction quests with visible material caches, gold, cosmetic crystals and XP. Existing claimed quests remain claimed without duplicate payouts; older counters count where supported and the new crop-harvest counter starts honestly at zero. Houses and arena ruins gain original shared albedo/normal/roughness surface maps, using three atlases rather than multiplying texture allocations per object. Controls, terrain edits and permanently felled trees remain compatible.

See `INTRO_QUEST.md` and `WORLD_SURFACES.md` for scope, provenance and verification.

## Version3.15.1 - Sanctuary access correction

The CI travel failure was a real generated acacia branch obstructing the Foundry-to-Alchemy route (seed92714), not a short timeout. Authored sanctuary trees now select a deterministic variant whose actual woody cells clear explicit access corridors and full player headroom. Rare exhausted variants retain only connected, safe voxel growth rather than turning collision off. Wild tree identities and previously felled-tree saves are preserved. Regression tests reproduce the original obstruction and verify real swept player movement across the corrected route.

## Version 3.15 - Living Voxel Frontier

- Deterministic streamed voxel ground now includes the settlement surface; foundations remain protected from editing. The Terrain menu provides a survey jump and tools for whole-block mining, 1/16-metre carving and stone placement beyond the protected foundation region.
- Exact native density/noise/cave scalar functions are adapted to the browser's existing planar landscape. This is not full native planet, climate, ore or Minecraft world-generation parity.
- Sparse terrain edits persist, exact fractional stone rewards cannot be mined twice, and edit geometry/collision/resources swap together. Fine terrain joins the distant surface with exterior edge strips; underground motion waits for visible depth bands rather than colliding with invisible floors.
- Nearby procedural voxel trees vary by seeded habitat, use real woody-cell body collision, and can be permanently felled for volume-derived timber plus separately reported harvesting bonuses. Distant old tree proxies and far edited-terrain approximation remain temporary LOD limitations. Trees do not yet fall physically or regrow.
- Every mobile menu scales to the visible viewport and offers a compact selector. Existing profiles remain compatible; no reset is required.

See `TERRAIN_WIP.md` for the honest implementation boundary, performance measurements and test evidence. Physical iOS/Safari performance is not claimed from desktop touch emulation.

## Version 3.14.2 - Mobile Touch Fix

Touch HUD controls suppress text selection and long-press callouts while forms
remain editable. Canvas and HUD track the visible viewport, including Safari
browser chrome and side safe areas. The controls sheet stays within those bounds.
Fullscreen-unavailable browsers now show explicit Home Screen installation guidance.
No camera zoom changes or save changes. Device-emulated tests pass; physical
Safari behavior still needs confirmation.

## Version 3.14.1 - Mobile Viewport Fix

The canvas now follows its actual CSS and visual viewport bounds when phone
browser chrome changes size. A single dismissible controls sheet replaces
stacked camera/menu bars; touch movement and wrapped abilities keep separate
screen zones. This addresses the reported clipped/scaled iPhone layout.

Validated with iPhone-UA/DPR3 touch emulation, simulated safe-area insets and
portrait/landscape viewport changes. Actual Safari device confirmation is still
pending. No game saves or world generation are changed in this hotfix.

## Version 3.14 - Mobile Field Controls

Phones and tablets now default to the on-screen movement/action layout. Use
**Controls** to override Auto with Touch or Keyboard/controller; the preference
persists. A connected controller hides touch controls only in Auto mode.

The **Fullscreen** button requests browser fullscreen after your tap. Browsers
that cannot do element fullscreen, including some iOS configurations, show
Home Screen installation guidance instead. Interact, Target and hold Guard
have dedicated touch buttons alongside the existing movement/skill controls.
Safe-area spacing and larger tap targets help on narrow displays.

No save changes. Tests cover emulated touch and mocked controller/fullscreen
states, not physical-device certification.

## Version 3.13 - Core Materials

Use **Industry > Core drilling** or approach the new Dawnwake rig at **x-1, z22**.
Build it with 3 stone, 2 legacy cobalt and 2 timber. Extract finite cobalt cells,
then survey adjacent borefields when one is depleted. Mining mastery, equipment,
Artisan and Luck compound with recovery. Each extraction has a 2.5-second cooldown.

At the built Foundry, refine **canonical raw cobalt + timber** into a canonical
cobalt ingot. Two ingots, two field cord and one circuitry craft a rank-4
**Cobalt assay lens** armor harness. Equipped assay optics add gathering yield
before fibre Fortune, so the harness combines with a Cultivator charm rather
than replacing it. Existing legacy cobalt/billet recipes stay distinct.

This is an explicitly temporary **remote surface-drill adapter**, not walkable
underground terrain. Source-derived ore identities, placement bands and finite
save-backed depletion are connected to a complete browser crafting loop. Only
cobalt is enabled for this first playable slice; the full catalogue is not a
claim that every material can currently be obtained. Existing saves migrate
without reset, and unknown valid canonical resource IDs are preserved.

## Version 3.12 · Microvoxel Field Trial

A rounded microvoxel outcrop sits south of Dawnwake at **x0, z14**. Approach
and press **E** (or the existing Interact control) to carve one **6.25 cm** cell
along the ray from your position toward the outcrop. Move around it to expose
different cells. Each cell recovers exactly **1/4096 stone**; 4096 recovered cells
produce one ordinary stone resource. Sparse changes survive saves and reloads.

The outcrop's fine surface is generated on first load, before any edit. A coarse
fallback is retired only after the fine mesh is published. The first integration
uses greedy exposed-face meshes with halo sampling, integer microcell traversal,
occupancy-based horizontal collision and stable 32-block persistence addressing.
It is a **bounded field trial**, not a claim that the whole world is microvoxel
terrain. The surrounding terrain remains the existing heightfield; whole-block
tools, placement, full 3D player collision, planet-scale streaming and asynchronous
mesh jobs are future integration work. Current mesh rebuilds are synchronous.

Existing saves migrate with an untouched outcrop. No save reset is required.

## Version 3.11 · Cultivator Fortune

Craft the rank-six **Cultivator lattice** charm from field cord, Downbloom,
electrum and circuitry. Equipping it grants **Fortune 1** for wild and cultivated
fibre. Each Prospector ascension on the lattice adds another Fortune level,
alongside the existing material Luck benefit. The character sheet shows Fortune;
harvest messages show the fibre subtotal and rolled multiplier.

The harvest order is world-tier yield, then profession mastery, equipment yield,
Artisan and the independent Luck unit, then Fortune multiplying that **entire
subtotal**. Cultivated seed return gets its own independent Fortune roll; wild
patches retain two seeds. Seeds and fibre can therefore expand cultivation and
feed crafting/refinement back into stronger equipment. Equipment is sampled when
harvesting, not when planting. There is no extra global Fortune cap or reduction
for combining these bonuses. Non-fibre gathering is unchanged.

The multiplier formula is ported from Elysium's `FloraRules.fortuned`; applying it
after browser-specific bonuses, the charm recipe and Prospector synergy are
Elysium adaptations, not claims of Minecraft enchantment compatibility.

## Version 3.10 · Dawnwake Hydroponics

Gather wild **Loomflax** and **Downbloom** for fibre and two seeds per patch. Open **Industry → Hydroponics** and travel to the Dawnwake blueprint to build two beds. Sow a seed, follow eight visible stages, then collect fibre and one seed to replant. A crop takes **3m 30s** in the basic rack and matures while the game is closed.

Craft billets and planks in the Atelier and salvage circuitry to install the nutrient array. It adds two beds and reduces growth time for new plantings to **2m 20s**. At rank 4, use field cord, Downbloom and circuitry to craft the light **Xenotwill field jacket**, with an independent 6% chance at an extra gathered material.

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

- Local PINs identify save slots on this browser. Settings supports JSON export and version 1–3 imports. Classic and Elysium maintain separate progress after migration.
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

For a focused hydroponics check, run `tests/browser.mjs` with `NURSERY_ONLY=1`.
This exercises desktop and mobile viewports, wild-seed gathering, construction,
panel close/reopen, the two planting speeds, a service-worker-cached offline reload,
and collection without duplicate harvest controls. Simulation tests cover every
growth-stage boundary, clock rollback, legacy saves without nursery data, and
failed actions without resource loss. Offline growth uses the device clock; this
local single-player save system is not a server-authoritative anti-cheat service.

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
## Main menu flow

The existing title screen remains the **local profile/load gateway**. Successful
Continue or New Adventure opens a separate main menu; the world starts only when
you choose Enter the frontier / Continue adventure. New adventure from this menu
returns to profile creation and cannot overwrite an existing named profile. Back
to main menu cancels that detour. Switch profile signs out without deleting saves.

Menu settings expose visual quality, reduced motion, auto-target/auto-fire and
sound before loading the world. In-game Settings offers Save & Main Menu.
Keyboard Tab/Enter and menu Up/Down work; controller D-pad/left stick and A select,
B returns from settings. Local PINs and saves are browser-local, not cloud accounts.

Verification: `node --test tests/main-menu.test.mjs` and
`node tests/main-menu-browser.mjs` (set BROWSER_EXECUTABLE to installed Chrome if
Playwright Chromium is unavailable). The focused browser test covers desktop,
portrait touch and landscape touch, safe new-profile cancellation/duplicate-name
rejection, pre-world settings, explicit entry and save preservation across logout.
Physical iOS Safari and a physical controller are not certified by emulation.

Male v38 also corrects opaque skin/mouth/eye-white export flags; geometry and texture content are unchanged. Transparent face sorting no longer exposes the inner mouth through the skin.
