## Placeable workstation update

Workstations are no longer unbuilt fixed spawn sites. Open **Build** (keyboard B, controller hold B, or the HUD Build button), choose a clear dry footprint within 2–6 world units, and craft/place a foundry, joinery or laboratory directly from raw resources. Adjust the local plan in half-unit steps. Construction is rejected on water, steep slopes, overlapping props/resources, occupied enemy sites or combat. Built machines block navigation and stand on sampled terrain height. Adding one does not recreate the world or reset enemies.

Any current playable realm supports construction; several stations of the same type can be built. Each instance retains its realm, X/Z position, tier, paid job queue, output and XP in the existing version-three save. Up to 256 built stations per save bounds storage and scene cost. Unbuilt legacy markers no longer appear, but built legacy sanctuary stations and their paid work remain intact. Unknown/malformed placements are rejected on import.

The Workshop starts with a compact personal-crafting section (cord, field bow, consumables); advanced equipment is in a collapsed section and requires the correct built workstation within four units. Light armor uses joinery; metal weapons, firearms and other equipment use foundry unless the recipe explicitly specifies another station/tier. Processing UI addresses each instance separately. Existing production timing, upgrading, cancellation and collection rules remain below.

This slice implements the three existing production stations, not storage crates, walls/floors/roofs, new specialist benches, or relocation/dismantling. Nursery and core drill migration remain follow-on machine work.

---

The pre-update implementation notes below describe the original sanctuary layout. The placement update above supersedes fixed-site restrictions; production mechanics still apply.

# Artisan Awakening: the implemented production loop

Version 3.4 connects gathering, fixed sanctuary construction, timed processing, profession XP and refined equipment. Open **Atelier [B]**, track a site, then walk within four world units. E opens the Atelier when the workstation is closer than a gatherable node. Construction, queue changes, collection and upgrades require proximity in Emerald Bastion; the interface blocks their use during combat.

These are three fixed build sites, not free-placement housing or a general building system.

| Station | X,Z | Construction cost | Production |
| --- | --- | --- | --- |
| Cobalt foundry | -10,5 | 2 cobalt, 2 stone, 2 timber | Billets; aether alloy at tier 2 |
| Lumenwood joinery | -8,-6 | 2 timber, 1 stone | Planks |
| Starleaf laboratory | 9,4 | 2 stone, 1 timber, 1 herb | Extract; draught batches |

## Recipes and gear

| Process | Inputs | Output | Base duration | Profession XP |
| --- | --- | --- | ---: | ---: |
| Cobalt billet | 2 cobalt + 1 stone | 1 billet | 12s | 18 smithing |
| Lumenwood planks | 2 timber + 1 stone | 2 planks | 8s | 12 forestry |
| Starleaf extract | 2 herbs + 1 fish | 2 extracts | 10s | 18 alchemy |
| Concentrated draught batch | 1 extract + 1 herb | 4 potions | 10s | 20 alchemy |
| Aether alloy | 1 billet + 1 extract | 1 alloy | 18s | 25 smithing |

Inputs are paid when queued. Choose one order or three, subject to stock and queue space. A station works sequentially; separate stations operate in parallel. Goods and profession XP wait in the output tray until collection. Processing awards profession XP; equipment crafting, gathering and combat retain their existing account-level XP rules.

Three new Workshop recipes produce four-affix epic equipment at their matching station:

- **Aetherbound oathblade:** 2 billets + 2 planks + 1 alloy; foundry tier 2; 15% stronger base power before existing smithing/artisan bonuses.
- **Artisan's starweave:** 1 billet + 2 planks + 2 extracts; joinery tier 1; 10% stronger base armor.
- **Distilled astral conduit:** 2 extracts + 1 alloy; laboratory tier 2; 10% stronger base mana.

Existing basic recipes, drops, tempering, reshaping and salvage remain available. Advanced gear uses the existing affix, equip and derived-stat pipeline. Two new journal contracts reward construction and collecting five orders.

## Upgrades

| Tier | Queue capacity | Speed | Upgrade from previous tier |
| --- | ---: | ---: | --- |
| 1 | 3 | 100% | Construction materials above |
| 2 | 5 | 125% | 250 gold + 2 planks + 1 billet |
| 3 | 8 | 160% | 600 gold + 2 planks + 1 alloy |

An upgrade requires an empty queue. Uncollected goods may remain. Durations are fixed at enqueue time; upgrades cannot retroactively accelerate existing orders. Tier 2 foundries unlock aether-alloy processing.

## Persistence and cancellation

Production is an optional field in the existing version 3 save. Older saves gain unbuilt sites, empty queues and zero refined materials. Station tiers, paid jobs, output, uncollected XP and statistics survive export/import/reload.

Jobs use wall-clock deadlines. Already-paid queues catch up after login, while panels are open, in another realm or after an offline interval. There is no auto-repeat: an unattended station can finish only its bounded queue, at most eight orders. This is local catch-up, not an always-running server. Browser-clock changes affect timing; local saves are not authoritative multiplayer inventory records.

Only waiting orders can be cancelled. Their exact inputs return, and later jobs close the gap. Active and completed work cannot be refunded. Collection transfers goods/XP and clears the tray in one local state change, preventing repeated collection from duplicating value. Imports are constrained to known stations/recipes, valid tiers, bounded quantities and tier-sized queues; unknown jobs are discarded.

## Presentation

Version 3.5 renders the foundry, joinery and laboratory as 3D machines. Unbuilt stations show holographic markers; running machines show progress rings and sparks, with ready indicators and nearby labels. Reduced motion suppresses particles. Map markers distinguish unbuilt/built/ready sites; tracking highlights a chosen site. The earlier workstation atlas is retained as release art.

Idle, undamaged targets no longer fill the target HUD until combat or explicit targeting. This clears sanctuary views. The artwork is static with procedural activity effects; no new character animation sheets are claimed. See [assets/ASSETS.md](assets/ASSETS.md) for exact prompts and provenance.

## Elysium source boundary

`artisan.mjs::matchAlloy` translates `AlloyRecipe.matches/oneWay` and left/right consumption counts from Elysium commit `c0ebd4692c4e95964149a119bd5fff7a4f9d4ea4`, blob `bc1bb7188df0642662863d22222314ae4204c7ec`. Minecraft Ingredient predicates are narrowed to exact browser material IDs. Either slot order and distinct ingredient counts are preserved and tested.

The recipes, station costs/upgrades, queue engine, offline catch-up, collection, art and gear are newly authored browser systems. Elysium block entities, power/share/tier networks, Ingredient tags, native inventories, Minecraft ticks and the original alloy catalogue are not running here. C++/WASM ABI 2 is unchanged.

## Validation

`npm test` includes nine production tests: matching, construction, reservations/capacity, timing, single collection, cancellation, upgrades, migration and refined gear. The existing browser scenario proves real harvesting. A separate production scenario uses a clearly seeded raw-stock save import, then walks between stations, constructs them, reserves/cancels work, waits for live timers, reloads, collects, upgrades, crafts/equips epic armor, checks mobile layout and logs back in.

The visual suite checks all realm palettes, the 3D fallback, shaders and scenery fading. Screenshots are review artifacts, not automatic image-diff proof or a broad device benchmark.
