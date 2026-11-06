# The Sleeping Empire — GitHub Pages Living Codex

A framework-free, responsive single-page interface for the public Sleeping Empire lore archive.

## Publish with GitHub Pages (one-time)

1. Open repository [**Settings → Pages**](https://github.com/BelialRunnerX/the-sleeping-empire/settings/pages).
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch **master**, folder **/docs**, then **Save**.
4. Once GitHub Pages finishes deploying, visit **https://belialrunnerx.github.io/the-sleeping-empire/**.

GitHub Pages needs this repository setting enabled once by a repository administrator. The connected GitHub file integration used to publish these files cannot change that repository setting.

The `.nojekyll` file prevents Jekyll transformations. No build step, third-party JavaScript, token, account, database or server is necessary. Future changes committed to `master/docs` will republish after Pages is enabled.

## Features

- Desktop sidebar / compact mobile menu
- Full-text search of indexed characters, events, holdings, locations and source files (**/** keyboard shortcut)
- Interactive chronology with era filtering
- Character dossiers and side-panel details
- Somnus group structure, subsidiaries, pending transactions and explicit ownership exclusions
- World and asset directory
- Dark/light theme toggle with locally remembered preference
- Accessible labels, keyboard escape, modal focus behavior and reduced-motion support
- Direct links back to original Markdown in the repository

## Files

- `index.html` — layout, accessible navigation and page sections
- `styles.css` — responsive, dark/light styles
- `data.js` — curated editorial site index reflecting the archive
- `app.js` — client-side rendering, navigation, search and interactions
- `.nojekyll` — GitHub Pages static publishing option

## Updating the codex

Update canonical Markdown first. Then edit `data.js` to reflect new story events and any changes in the status of corporate entities. **Do not automatically mark plans as complete**. Maintain distinction between Imperial/public property and Hazael's private commercial assets; respect Clarissa's separate ownership. The site has no dynamic authentication or write access—it is a read-only public interface into the Git repository.

The complete written sources remain in `chronicle/` and the root lore files. The site is a curated explorer, not an exhaustive or independently authoritative transcript.
