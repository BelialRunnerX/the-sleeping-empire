# Mobile control integration

`engine/mobile-controls.mjs` is a self-installing companion to app.mjs, loaded after it. It uses the existing movement, ability and camera input paths rather than maintaining a second simulation controller.

- Auto detects phones, tablets including desktop-UA iPads, and coarse touch input. A connected gamepad suppresses touch layout in Auto only.
- Controls menu offers persistent Auto, Touch, Keyboard/controller overrides. Keyboard remains available in all modes.
- Touch layout uses 44px movement/action targets, safe-area offsets and horizontally scrollable camera/ability strips on narrow screens.
- Fullscreen is requested only from a button gesture; fullscreen errors are visible. iOS browsers without element fullscreen show Home Screen installation guidance. No claim that Safari browser chrome can be forcibly removed.
- Existing drag/pinch camera and movement pad remain unchanged. Added Interact, Target and hold Guard forward ordinary keyboard events to existing handlers. Blur, hidden document and panel opening release held inputs.

Integration: apply patch at repository root. No app.mjs edits. The two index includes and service worker resource additions are intentionally minimal. Bump your release service worker cache version as usual. No save schema changes.

Run: `node docs/games/astral-empire/tests/mobile-controls-browser.mjs` from repo root with Playwright installed in game directory. Test currently uses installed Windows Chrome. Browser tests exercise emulated touch and mocked gamepads/fullscreen; physical iPhone, Android and gamepad verification remains necessary before claiming device certification.

## 3.14 mobile hotfix
- Canvas display sizing is CSS-owned, renderer/frustum follow canvas bounds using ResizeObserver and visualViewport resize. This removes stale inline pixel dimensions after browser chrome/orientation changes.
- Single dismissible Controls sheet contains fullscreen, layout, camera, inventory/skills/build/life and Atelier. Field HUD has compact heading, status, map and journal. Bottom movement/action/ability zones are explicitly separated; abilities wrap rather than overflow horizontally.
- Select is 16px to prevent iOS form-focus autozoom. Physical Safari remains unverified. Regression checks use iPhone UA, DPR 3 and 393x720 viewport, landscape, drawing-buffer/CSS bounds, document overflow, pairwise control rectangles, and a simulated 34px bottom inset.
- PLAYWRIGHT_MODULE can override the package import when running from an isolated worktree.
