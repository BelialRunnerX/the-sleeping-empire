# Astral Empire · The Sleeping Empire mini-game
## Version 1.2 · Celestial Combat (November 2026)

### Tactical combat
- **Elemental reactions:** Swap the elemental aura on enemies by attacking with different-element heroes. Reactions include Steam Break (Flame + Tide), Wildfire (Flame + Gale), Superconduct (Tide + Volt), Eclipse (Solar + Void), Starfall (Astral + Void), and Zenith (Astral + Solar). Other differing pairs create basic Resonance.
- **Element advantages:** Favored matchups deal 20% more damage and unfavorable matchups deal 14% less.
- **Combo chain:** Consecutive attacks by different elements build a chain up to 10, increasing damage by 4.5% per stack. Repeating the same element reduces the chain.
- **Enemy intents:** Normal single-target attack, every-third-turn charged strike, and fourth-turn area Cataclysm from bosses. Intent labels are visible before each turn. Guarding heals and reduces damage.
- **Elemental statuses:** Wildfire burns, Superconduct and Eclipse expose enemy defense, Steam Break weakens damage, Zenith heals the team, and Starfall restores energy.
- **Animated combat:** Procedural monster variants, animated ambient runes, color-coded impact, and combat damage numbers.

### Progression
- **Hero awakening:** Spend duplicate hero echoes and gold to awaken a hero up to rank 5. Echo cost rises 1, 2, 3, 4, 5; each rank adds 8% base-stat scaling and boosts Burst damage. Existing duplicate bonuses remain.
- **Party resonance:** Two heroes of the same element get +4% base-stat scaling; a trio gets +8%.
- **Daily Astral Trial:** A harder boss fight, available again each new local day after victory. Winning grants 480 crystals, 650 gold, 7 ore, 2 gems and a 4★ or 5★ equipment drop (if inventory has space); normal stage progress is unchanged.
- **Achievements:** Added Trial Champion and Awakening milestone rewards.

### Compatibility
Uses the existing `astral_empire_v1` browser save key and `version: 1` JSON schema. Version 1 / 1.1 saves are migrated in place with new optional fields initialized. Local browser storage is device-specific; export JSON to transfer.

### Offline update behavior
The service worker uses network-first caching for game documents so online visitors receive updates, while offline visitors can still load the latest locally cached page. The cache is scoped to the game subdirectory.


## Version 1.1 · Frontier Dispatch Update

- Three timed expeditions (5, 15, and 30 minutes) with persistent mission state
- Five one-time achievements awarding summon crystals
- Responsive dispatch UI, updated mobile navigation and visual polish
- Existing version 1 saves migrate automatically; exports include the new fields



Playable web gacha RPG embedded as a **subpage of the Living Codex**, rather than replacing the archive.

## Play

Go to `/games/astral-empire/` on the GitHub Pages site, or open `index.html` directly.

- 12 collectible anime-style heroes, rarity system, 10-pulls and pity guarantees
- Turn-based battles, character leveling, party selection and equipment forging
- Responsive desktop and mobile UI, with local browser saves and JSON export/import
- No backend, real-money purchases, third-party JS dependencies or account required

## Deployment

Site source: `docs/` on branch `master`. This folder contains standalone files and requires no build step.

## Notes

This mini-game is a **non-canon spin-off** from the Living Codex. Game progress is saved to `localStorage` per browser and can be moved with the built-in export/import controls. The PWA cache and service worker are scoped to this subdirectory and do not affect the main site.
