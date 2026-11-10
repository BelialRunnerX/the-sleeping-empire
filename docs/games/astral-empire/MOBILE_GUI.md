# Mobile GUI audit and fix

Based on combined published 346f670. Separate mobile-gui.css and mobile-gui.mjs,
loaded after existing themes. No input, joystick, combat, profile storage or
terrain changes. Preserve integrator's existing touch skillbar spacing fix.

All panels get mobile navigation in the header (native accessible select with
category groups) rather than a clipped horizontal menu strip. Short landscape
content area grew from145px to214px at607x279. Responsive content grids make use
of landscape width instead of forcing every recipe/appearance into one column.
Profile/main menu get compact, touch-sized portrait/landscape layouts. All menu
surfaces track visibleViewport CSS variables and safe-area padding, including
browser chrome changes. Controls retain >=44px targets; input font16px avoids
Safari focus zoom. Constellation keeps zoom/fit controls and a visible graph.

Validation: mobile-gui-browser exercises all14 in-game panels at393x852,
852x393,607x279,320x568 (56 panel renders) with horizontal-overflow and viewport
assertions; profile, main menu and declaration screenshots; simulated visible
viewport offsets/shrink+24px side safe areas; joystick visibility after close.
Main-menu regression passed1440x900,390x844,844x390 including profile persistence,
settings, signout/reentry and duplicate-profile preservation. Seven focused
main-menu/combat-assist unit tests pass. Physical Safari not certified.

Screenshots in.artifacts/gui-*; audit metrics in.artifacts/mobile-audit.log.
Integration: add mobile-gui.css and engine/mobile-gui.mjs to SW FILES and bump
release cache. Keep scoped stylesheet after hud-theme/main-menu/mobile-controls.
