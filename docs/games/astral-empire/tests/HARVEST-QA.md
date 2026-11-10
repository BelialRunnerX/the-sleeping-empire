# Harvest tool integration QA

The original axe and pickaxe GLBs are mounted to the right-hand socket in authored meters. Source integrity is checked by original SHA256 and GLB declared length; the files remain self-contained for offline loading. They are visual-only and do not change equipment, saves, reward amounts, or mining transactions.

Gathering layers chop, mine, or berry poses after base locomotion. Mining terrain/microvoxels starts a brief visual pulse only after a successful transaction. Movement, combat, guard, death, menus, hidden pages, and reduced-motion settings suppress the pose. Previously visible gear is restored. The right wrist is reset before every overlay, preventing cumulative rotation. Pistol aiming remains unchanged outside harvesting.

Run `npm run test:harvest` for desktop; set `HARVEST_TOUCH=1` for touch emulation. The disposable browser fixture creates a real profile, waits for the service worker, reloads fully offline, and invokes real gather actions at real nodes after repositioning the test player to actual ground height. It checks authored tools rather than fallback proxies, meter-scale bounds, all three action kinds, completion/gear restoration, and page errors. This is not a physical-phone performance measurement. Screenshots freeze the actual action phase for visual inspection.

The poses are procedural rather than adaptive target IK. Tool heads are not guaranteed to touch every irregular voxel/tree/ore surface exactly. No automatic approach or gameplay range changes are included.
