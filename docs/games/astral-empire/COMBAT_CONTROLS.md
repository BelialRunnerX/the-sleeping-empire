# 3.14.4 controls hotfix

- Touch: left movement stick, right camera orbit/zoom stick, compact central hotkeys. An unambiguous empty-ground tap starts travel; tapping a visible live enemy within 30 m locks it.
- Desktop: Q toggles automatic nearby targeting (default on). T independently toggles automatic primary fire (default on). Settings exposes both switches; preferences persist on this browser.
- Manual touch/controller locks fire automatically when auto fire is enabled. Normal skill range, mana, cooldown and alive checks remain authoritative. Menus, unfocused/hidden page, gathering, lost target and player death prevent assisted fire. Controller Y and touch Target retain manual lock/unlock.
- Visual settings and existing camera defaults are unchanged. Physical Safari remains unverified; browser tests emulate touch/DPR/safe-area/viewport conditions.
- No terrain WIP is included in this release.

3.14.4: Controller automatic targeting now enabled; Y unlock suppresses reacquisition until Y resumes. Touch and normal desktop clicks on in-range picked objects use normal interaction; out-of-range objects do not activate. Empty-ground clicks/taps travel on both layouts. A shared touch registry suppresses travel when another canvas/UI/joystick contact participates. Drags, cancels and holds over500ms do not trigger contextual taps. Explicit desktop Attack mode remains manual attack.


## Controller revision (pending integration)
Authoritative Xbox standard layout: LS movement, RS horizontal orbit/vertical zoom, RT held basic attack, X interact, A jump, R3 toggles Q auto target, Start equipment/menu. D-pad clockwise Up/Right/Down/Left maps abilities 1/2/3/4 (lance/nova/dash/burst). B crouch, Y quick weapon switch and LB+RB F5 are reserved and inactive: the current game has no such gameplay functions. Neither bumper alone guards or casts an older ability. Menus use D-pad or either LS axis for focus navigation, A selects, B/Start closes, with no gameplay abilities dispatched. Q/R3 enabling selects a visible live enemy in the camera-forward 90-degree ground cone, prioritizing alignment, then distance within 30 units; reacquisition uses the same cone. RT still uses normal combat range and cooldown. Physical controller verification remains pending.

Hold B for 500ms emits a cancelable `aetherbound-build-toggle` event once per hold. The forthcoming actual placement menu should handle it and call preventDefault. Until then, it honestly reports build placement unavailable, not the unrelated Atelier. Short B taps remain inactive in gameplay. Release is required after interrupted hold, focus loss, menu transition or disconnect.
