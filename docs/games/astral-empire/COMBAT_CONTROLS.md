# 3.14.4 controls hotfix

- Touch: left movement stick, right camera orbit/zoom stick, compact central hotkeys. An unambiguous empty-ground tap starts travel; tapping a visible live enemy within 30 m locks it.
- Desktop: Q toggles automatic nearby targeting (default on). T independently toggles automatic primary fire (default on). Settings exposes both switches; preferences persist on this browser.
- Manual touch/controller locks fire automatically when auto fire is enabled. Normal skill range, mana, cooldown and alive checks remain authoritative. Menus, unfocused/hidden page, gathering, lost target and player death prevent assisted fire. Controller Y and touch Target retain manual lock/unlock.
- Visual settings and existing camera defaults are unchanged. Physical Safari remains unverified; browser tests emulate touch/DPR/safe-area/viewport conditions.
- No terrain WIP is included in this release.

3.14.4: Controller automatic targeting now enabled; Y unlock suppresses reacquisition until Y resumes. Touch and normal desktop clicks on in-range picked objects use normal interaction; out-of-range objects do not activate. Empty-ground clicks/taps travel on both layouts. A shared touch registry suppresses travel when another canvas/UI/joystick contact participates. Drags, cancels and holds over500ms do not trigger contextual taps. Explicit desktop Attack mode remains manual attack.
