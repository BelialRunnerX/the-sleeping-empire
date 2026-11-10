# 3.16.1: controller mapping and canonical avatar scale

This release contains no continental terrain or larger-tree prototype.

## Scale
World blocks remain 1 unit, subdivided 16 per edge. Player collision remains
3 units high. Neutral rendered player bodies now match: 3 blocks = 48 microcells.
The old rig target was 2.64, then the avatar factory stretched Y by 1.06, giving
2.7984. Removed that extra stretch, normalized rig/fallback bodies and aligned
soles with ground. Equipment is excluded when measuring body height.
All 12 heroes with both spear/staff and shield pass actual-browser measurements
at 3 units and floor 0 (floating-point tolerance 1e-6). Natural animation poses
may change the instantaneous silhouette; weapon height does not define body size.
No world-grid, save-position, physics, interaction range or inventory migration.

## Controller
RT attack; LS move; RS horizontal orbit and vertical zoom; X interact; A jump;
D-pad four abilities; R3 Q-style forward-view automatic targeting; Start menus.
Menu navigation uses D-pad/LS and A selection, B/Start close. Build B-hold gesture
is ready, but reports unavailable until a real placement menu is integrated.
Crouch, quick weapon switching and LB+RB fifth ability remain unimplemented and
reserved, not silently mapped to unrelated actions. Physical gamepad testing is
not claimed. Automated simulated input and existing browser regressions apply.
