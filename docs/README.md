# The Sleeping Empire — GitHub Pages Archive Terminal

Static, accessible and responsive source-backed explorer for the fictional Sleeping Empire universe. This site is published from **master/docs**, without a build step.

## Current verified snapshot

**Chapter CLIII / Turn 000149**, 8 Deepfall 13,627 ICE at Greenhaven, Bellwynn. The latest played scene is a festival robot competition **before** results have been decided. Never manufacture results, market statistics, personal disclosures, or unreconciled lore.

## Features

- Enhanced sci-fi operations-terminal visual design with restrained glass/HUD styling and responsive navigation.
- Current scene and source provenance on the homepage; explicit **archival, not live** disclosure.
- **Record Ledger** indexes the 142 recorded turns available in `saves/INDEX.md` with newest-first browsing, text search, filtering and a load-more control.
- Character dossiers reflect the new Celeste Somnion, Vesta and Niko Bell entries.
- Historical chronicle, business holdings with ownership exclusions, world atlas and linked primary Markdown sources.
- Full-text site search; keyboard shortcuts; accessible dialogs; dark and light themes; reduced-motion support.
- No analytics, account, external API keys or personal data collection.

## Files

- `index.html` – accessible views, site navigation, briefing, records UI.
- `data.js` – reconciled structured presentation layer.
- `records.js` – generated durable save index through Turn 149. This is an **archival snapshot**, not a real-time feed.
- `app.js` – route rendering, search, record filters, keyboard navigation and dialogs.
- `styles.css` – responsive design and HUD visual system.
- `images/characters/` – interpretive vector character artwork.
- `.nojekyll` – static GitHub Pages handling.

## Source update procedure

1. Commit authoritative lore and turn records under `saves/`, `characters/` and `chronicle/`.
2. Reconcile the `saves/CURRENT_STATE.md` endpoint and chronology.
3. Update `docs/data.js` and rebuild the turn index `docs/records.js` from **actual saved entries** in `saves/INDEX.md`. Never fill missing turn numbers by guessing.
4. Reconcile static homepage copy in `index.html` and the listed dossier sources.
5. Validate all images, links, navigation, search and state boundaries; commit to `master`.

## Deployment

In [GitHub Pages settings](https://github.com/BelialRunnerX/the-sleeping-empire/settings/pages), use **Deploy from a branch → master → /docs**. GitHub Pages may take time to refresh its cache after commit.

**Canon boundaries:** Public summaries must not invent NPC knowledge of private user-directed facts. Company reports are attributed to their period and source, not fabricated as current live telemetry. Historical documents are retained as historical snapshots.
