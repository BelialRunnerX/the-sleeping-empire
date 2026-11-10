# Soft-glass HUD / panel pass

Reference: approved CONCEPT v0.7 soft glass (Library 6c79d6e6c9b8819196919943b63c80f0).
Sixth Edition pages 495 (interface vocabulary), 825 (one HUD dialect), 1030
(cyan safe/progress; magenta hazards),1250(search and explainability).

Scope: separate hud-theme.css and UI-only hud-panels.mjs. No combat, camera,
mobile pointer, save, or worldgen logic changed. Main-menu styles are separate.
Health/mana/stamina retain actual semantics, not fictitious oxygen data.
Equipment search matches names, slots and modifiers. Character statistics and
material stockpile use native expandable details so equipment is visible first.
Touch joysticks retain 88px geometry; compact action layout retained.

Integration: add hud-theme.css after mobile-controls.css, load hud-panels.mjs
alongside app/mobile-controls; add both new files to service worker FILES and
bump cache at combined release. Do not replace integrator service worker.

Validation: 19 smoke +66 unit tests passed. Focused browser checks exercise
search no-results/reset and viewport-bounded panels at desktop 1440x900,
phone393x852, landscape852x393 and cramped607x279. Screenshots .artifacts/hud-*.
Physical iPhone Safari/gamepad not certified. Full existing browser suite was
interrupted by environment network policy on browser telemetry, not a game
assertion. Must run in integrator before publish. Existing cards still have
text equipment rather than illustrated item icons: this is a real UI pass,
not a claim of pixel-identical concept fidelity.
