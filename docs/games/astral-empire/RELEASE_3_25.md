# Elysium 3.25.0: final legacy web update

## Release boundary

The browser version is preserved as the legacy edition. Further game development
moves to Unreal Engine. This release does not replace the native/Unreal work or
claim a completed Unreal game, multiplayer transport or save importer.

The release starts from published master 89c0d9d. It retains the previous stable
playable content, field tools, placeable workstations, skill training, professions
and Settings responsiveness fixes. New production changes are limited to:

- Reusing exact uniform terrain pages for refinement classification.
- Scalar density/noise paths that remove coordinate-array allocations while
  retaining typed-array rounding and custom-method dispatch fallbacks.
- Exact batched terrain sampling and reuse of uniform operation results.
- Versioned offline cache and the visible legacy edition label.

Generated samples, material IDs, terrain edits, profile schema and gameplay rules
are unchanged. Keep exported save backups; no browser-to-Unreal import is claimed.

## Deliberately not shipped

- Storage crates: the code-geometry prototype is stable in its separate branch,
  but the requested original crate model is not integrated and verified.
- Contextual build mode/object lifecycle and wide global-coordinate prototypes:
  preserved as separate Unreal references, not part of this browser release.
- GPU vertex pulling: an isolated benchmark only, not the production renderer.
- Remaining planetary prototypes retain their existing inspector-only limits.

All original branches and worktrees are preserved. No unfinished branch is reset,
removed or published by this update. Physical mobile/controller performance is
not certified by desktop browser emulation.

## Reproducible verification

Run npm test, npm run test:browser, npm run test:visual and
node tests/terrain-browser.mjs and npm run test:cache from this directory. The differential density,
terrain sampling and refinement suites require exact output equality.
Browser checks may use BROWSER_EXECUTABLE to select an installed Chrome.
Hosted CI, deployment and local test outcomes must be verified separately.

## Local verification on 2026-11-11

- npm test: 216 checks passed, with zero failures, plus all standalone planetary,
  smoke, native-density and harvest suites.
- Browser aggregate: desktop/mobile gameplay, production/crafting, geology,
  saved edits, profile restoration and offline reload passed.
- Visual: five realms, presets, appearance swaps, shaders and resource lifetime
  passed. Moon, Cinder and Orbit retain the previously documented provisional
  geometry-budget overruns; no new device-performance certification is claimed.
- Terrain UI: desktop and touch passed when run in isolation, including offline
  reload and placement. A concurrent run timed out at placement after reload;
  the isolated repeat passed, so this automation remains load-sensitive.
- Offline cache upgrade: old cache removed, 145 resources retained, local save
  marker preserved, and offline navigation plus a second reload passed. The five
  changed production modules matched the current files byte-for-byte in cache.
- The legacy footer was asserted and visually inspected. Independent code review
  found no release-blocking defect. Native WASM source and blob are unchanged;
  the hosted workflow rebuilds and checks the native module separately.
