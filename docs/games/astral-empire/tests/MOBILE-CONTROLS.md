# Mobile control integration

`engine/mobile-controls.mjs` is a self-installing companion to app.mjs, loaded after it. It uses the existing movement, ability and camera input paths rather than maintaining a second simulation controller.

- Auto detects phones, tablets including desktop-UA iPads, and coarse touch input. A connected gamepad suppresses touch layout in Auto only.
- Controls menu offers persistent Auto, Touch, Keyboard/controller overrides. Keyboard remains available in all modes.
- Touch layout uses 44px movement/action targets, safe-area offsets and horizontally scrollable camera/ability strips on narrow screens.
- Fullscreen is requested only from a button gesture; fullscreen errors are visible. iOS browsers without element fullscreen show Home Screen installation guidance. No claim that Safari browser chrome can be forcibly removed.
- Existing drag/pinch camera and movement pad remain unchanged. Added Interact, Target and hold Guard forward ordinary keyboard events to existing handlers. Blur, hidden document and panel opening release held inputs.

Integration: apply patch at repository root. No app.mjs edits. The two index includes and service worker resource additions are intentionally minimal. Bump your release service worker cache version as usual. No save schema changes.

Run: `node docs/games/astral-empire/tests/mobile-controls-browser.mjs` from repo root with Playwright installed in game directory. Test currently uses installed Windows Chrome. Browser tests exercise emulated touch and mocked gamepads/fullscreen; physical iPhone, Android and gamepad verification remains necessary before claiming device certification.
