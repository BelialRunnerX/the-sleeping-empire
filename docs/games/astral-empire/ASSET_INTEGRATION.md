# Asset replacement and integration register

This is an explicit staged register, not a claim that placeholders are final.
The current public 3.16.1 contains the tested controller and three-block player
scale correction. Continental terrain and detailed-tree revisions remain local.

| In-game category | Current representation | Replacement / next integration | State |
|---|---|---|---|
| Player bodies | Existing rigged Kael/Mira and procedural alternatives, normalized to 3 blocks | Original male/female assets from art pipeline | Asset work in progress; no unapproved WIP model swap |
| Terrain | Original procedural voxel volume and distant surface LOD | Continental range/drainage field and matched water/horizon | Local prototype; regression/performance gates pending |
| Trees | Original seeded voxel generator and distant proxies | Larger, finer revision 3 continuous procedural trees | Local collision/save tests pass; geometry optimization pending |
| Ore/rocks | Existing generic ore/rock stand-ins | Material-valued voxel ore chunks/deposits/piles with host-specific stone | Isolated prototype; not playable integration |
| Berry bushes | No completed dedicated berry loop | Original voxel shrub, sparse fruit, persistent harvest | Isolated generator/harvest plan; inventory/animation integration pending |
| Houses/ruins | Original primitive geometry, new original shared surface atlases | Refined authored models and material bindings | Textures live; geometry remains placeholder-quality |
| Waystone/relic objects | Existing original scene props | Identify actual named scene bindings, then replace with tested own assets | Mapping must be verified; do not guess identity |
| Hydroponics | Original procedural station | Original Blender nursery model and LOD | Export validated; still awaiting model integration |
| Other machines/workstations | Original procedural station views | Source-grounded original machine models and data-driven station definitions | Staged work pending |
| Storage crate | No complete place/open/store gameplay loop | User-requested crate model, lid animation, transactional contents UI | Model binding and gameplay integration pending |
| Harvest tools/actions | Existing equipment/gathering placeholders | Own axe/pickaxe and berry reach/grasp/chop/mine poses | Isolated animation prototype; not visually accepted/integrated |
| Wildlife/enemies | Existing mixed game assets/proxies | Own tested replacements with matching collision/animation/LOD | Inventory and per-asset replacement pass pending |
| Player structures | No arbitrary placement release yet | Floors/walls/roofs and connections after storage/equipment/workstation tranche | Pure placement prototype exists; not live |

Each replacement needs provenance, dimensions in the canonical 1-block/16-micro
scale, attachment conventions, bounding boxes/collision, LOD/material budgets,
actual game screenshots, repeated-load/disposal tests and save compatibility.
Asset generation alone is not an integrated game feature.

Requested next gameplay tranche also includes the expanded equipment slots,
armorer/blacksmith/jeweler benches and specific-affix enchanting. These are
backlog requirements, not completed functionality or authorized shortcuts around
source recipes, costs, transaction safety or tests.
