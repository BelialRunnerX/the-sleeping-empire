# Astral Empire · The Sleeping Empire mini-game

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
