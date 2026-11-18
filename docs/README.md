# Elysium mechanics wiki

Static, responsive encyclopedia published from `master/docs` using the repository's existing GitHub Pages configuration. No framework build is required. This isolated change is not deployed until reviewed and explicitly coordinated.

- `index.html` and `codex/index.html`: mechanics main page.
- `wiki/articles/`: independently readable static articles, including without JavaScript.
- `wiki/assets/`: accessible responsive style and mechanics-only search/theme controls.
- `wiki/search-index.json`: explicit mechanics corpus only; never scans story/game payload.
- `wiki/sources.html`: curated article provenance/status and already-public references only. No raw internal development records are published.
- `sitemap.xml`: current mechanics pages only.

## Preservation

Original story/game data, code, assets and source documents remain in place. Exact prior replaced entrypoints are copied outside the Pages root under `archive/site-before-mechanics/`. Story dashboard and codex remain recoverable by direct URLs `story-archive.html` and `codex/story-archive.html`; game routes retain their old location and localStorage origin/path. Archived entrypoints receive noindex metadata. This is a crawler request, not access control/privacy. New navigation and search do not enumerate story/game routes.

Native implementation notes are a reviewed snapshot, not a live release feed. Browser adaptation formulas are not presented as native formulas. Planned functionality and provisional native adaptations must remain clearly labeled. Reconcile article scope whenever the native source changes.
