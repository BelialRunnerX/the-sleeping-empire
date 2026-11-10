# Dawnwake introduction: implementation and evidence

Thirteen ordered, playable quests replace the nine disconnected bounties. Tasks cover gathering, workstation construction, actual collected processing orders, crafting, distinct exploration, salvage, relay synchronization, hydroponics, mature crop harvests, combat, constellation allocation, all three workstations, and the Warden. No unavailable terrain/ore/building systems gate this introduction.

Rewards are visible supply caches: 9,850 gold, 3,030 cosmetic crystals, 2,130 character XP, plus useful materials, potions, seeds and advanced crafting stock. Currency sums should be derived from QUESTS if tuning changes. These generous explicit grants accelerate the next loop without being the only source of required materials. No random reward roll or new equipment power bypass. Final Warden cache: 2,000 gold, 800 cosmetic crystals, 350 XP, 3 aether, 6 essence, 10 potions.

## Source and adaptation
- Elysium-mono `docs/handoff/2026-09-28-questbook-handoff.md`, sections 1 and 3: questbook teaches mechanics, counts action progress before unlock, claims XP/items once from the book, dependency graph remains reachable. Read locally. This is a browser adaptation of those principles, not the complete 350-quest mod port.
- Sixth Edition references supplied by documentation owner: p276 resource/tool tiers; pp285,294–295 no circular/hidden obtainability; p919 first-shelter/tier/scanner onboarding measurements; p912 resource-led repair progression. Full Sixth extraction was not locally available to this worker. Those later tier systems are not claimed implemented here.
- User expressly requested an expanded introduction with hefty rewards; preserve compounding systems and meaningful progression.

## Persistence and integration
Existing nine quest IDs retained. Existing claimed saves do not receive duplicate/top-up payouts. New cropHarvests counter initializes to zero on legacy saves (no invented historical harvests). Other existing counters count retroactively. Claimed IDs are written before granting and normal Journal UI saves immediately. Reloading or repeated clicks cannot pay a claimed step twice. Local save rollback/editing remains possible in this entirely client-side game; no server-side anti-cheat is claimed.

Integration touches content.mjs, progression.mjs (one counter, harvest hook, status/claim), app.mjs (shared questStatus, journal/HUD), package test script, artisan prerequisite regression test. Keep worldgen edits when cherry-picking. No service-worker release/version changes: integration owner should add the tests and bump cache/release when shipping. No new runtime module to precache.

Browser tests use Chromium desktop and touch viewport emulation, not physical iOS. New per-quest hints and disabled/ready/claimed status use existing responsive card styles; comprehensive mobile panel fix is a separate pending change.


## Verification (2026-11-10)
- 19 existing smoke checks pass.
- 74 unit tests pass, including 5 new quest graph/reward/legacy-save/real-gathering/real-harvest tests. Existing artisan quest claim test now explicitly verifies its gather prerequisite.
- Dedicated quest UI regression passes 1440x900 desktop, 390x844 touch portrait, 844x390 touch landscape in installed Chrome: locked final quest, actual claim, immediate persisted reward, claimed disabled status, zero page errors. Portrait screenshot inspected: readable single-column cards, reward/hint text wraps within panel.
- Screenshots: `.artifacts/intro-quest-1440.png`, `intro-quest-390.png`, `intro-quest-844.png`.
- Tests were run via direct Node commands; npm test stalled under environment proxy/telemetry constraints. Initial browser attempt was interrupted by blocked telemetry; approved local Chrome run succeeded.

- Full existing tests/browser.mjs completed successfully (exit 0), including artisan, desktop/mobile hydroponics, microvoxel and finite geology processing/crafting flows.
