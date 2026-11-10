> Current game branding: **Elysium**. Historical generation prompts below retain the former Aetherbound title for provenance.

# Anime artwork provenance and prompts

Version 3.5 uses the title illustration and portraits in menus. The other atlases are retained for previous releases and no longer load in the 3D world.

Created for Astral Empire: Aetherbound on 2026-11-07 using the built-in `image_gen.imagegen` tool. These are AI-generated original project illustrations, not manually painted assets, imported game assets, or Elysium source ports. No specific artist or existing franchise was requested. Original PNG outputs remain in the session's generated-images folder; the game consumes the WebP copies in this directory. Sharp CLI 5.2.0 encoded WebP at quality 90 (portraits, title, ground) or 92 (transparent sprite/prop sheets), preserving alpha. No generation API key or fallback CLI was used.

Atlases use UV/CSS cells at runtime. Alpha-tested sprite materials remove low-alpha background residue. The two poses per hero support simple stepping, bobbing, flipping and attack tilt; they are not a full directional walk/combat animation library. Title art is promotional illustration, not an in-game screenshot. Current world layouts and gameplay remain authored in code.

| File | Use |
| --- | --- |
| [heroes-anime.webp](heroes-anime.webp) | Twelve hero portraits; 3 columns by 4 rows |
| [aetherbound-keyart.webp](aetherbound-keyart.webp) | Title illustration; decorative login background |
| [heroes-walk.webp](heroes-walk.webp) | Twenty-four character sprite poses; 6 columns by 4 rows, adjacent pairs per hero |
| [props-anime.webp](props-anime.webp) | Sixteen scenery/enemy cutouts; 4 columns by 4 rows |
| [ground-anime.webp](ground-anime.webp) | Four ground surfaces; 2 columns by 2 rows |

## Exact generation prompts

### heroes-anime.webp

```text
Use case: stylized-concept. Asset type: production portrait atlas for an original anime fantasy browser RPG, Astral Empire Aetherbound.
Create ONE polished, high-resolution contact sheet with EXACTLY THREE EQUAL COLUMNS and FOUR EQUAL ROWS, twelve separate head-and-shoulders character portraits, aligned in a perfect 3x4 rectangular grid. No gaps, borders, labels, lettering, symbols, watermarks or UI. Each cell contains exactly one original adult anime character, face near the upper center, entire hair silhouette inside the cell, upper chest visible at bottom. Same gorgeous theatrical 2D anime art direction throughout: fine confident ink lines, elegant angular faces and delicate noses, expressive detailed irises, flowing grouped hair, crisp cel-shadow shapes, luminous subtle reflected light, exquisitely drawn fantasy clothes, sophisticated color restraint. Not chibi, not 3D, not plastic, not photorealistic. Muted painterly teal/lavender atmospheric background in each cell. Every portrait must be distinct and stay within its equal-size cell.
Order left to right, then top to bottom:
Row 1: Kael, young adult man with tousled coral-red hair, teal eyes, burgundy longcoat, ivory collar, restrained gold trim and silver shoulder armor, confident quiet swordsman. Lumi, young adult woman with long ice-blue hair, blue eyes, elegant deep ocean-blue healer robes and moon-silver details. Mira, young adult woman with lavender hair tied to the side, violet eyes, refined dark-violet mage coat with gold star brooch.
Row 2: Tess, young adult woman with short peach-orange hair, amber eyes, slate-teal mechanic jacket and fine brass fasteners. Celeste, adult woman with long pearl-lilac hair, violet eyes, regal amethyst high-collar coat with elegant gold filigree. Clarissa, adult woman with pale golden hair in a controlled braid, navy military coat, gold trim and intelligent gaze.
Row 3: Aurelia, adult woman with long warm blonde hair, amber eyes, coral-red dawn knight attire, delicate gold armor. Nyx, adult woman with indigo silver hair, narrow violet eyes, layered dark-plum stealth clothes. Vexa, adult woman with pink-lilac hair in a lively ponytail, violet ranger outfit and playful expression.
Row 4: Orin, adult man with sage-green hair, calm green eyes, forest-green warden coat and subtle leaf embroidery. Sora, young adult woman with turquoise silver hair, teal eyes, dark-teal archer coat and light leather straps. Riven, adult man with windswept chestnut hair, grey eyes, dark mauve scout armor, serious expression.
This is one usable raster atlas; keep the three columns and four rows mathematically even.
```

### aetherbound-keyart.webp

```text
Use case: stylized-concept. Asset type: wide original anime game title illustration for Astral Empire Aetherbound, used behind the existing login interface.
Create a premium theatrical 2D anime fantasy illustration, widescreen 16:9 composition. Three original adult adventurers overlook an ancient ivory portal in a lush mountain sanctuary at dawn. Foreground right: Kael, a tall lean young man with tousled coral-red hair, teal eyes, angular handsome anime face, burgundy longcoat with ivory lining, elegant gold embroidery, one ornate silver pauldron, dark trousers and a refined silver sword. Slightly behind him on the far right is Mira, an adult woman with long tied lavender hair and a dark-violet gold-trimmed mage outfit; on the lower right Sora, an adult woman with pale turquoise hair and a dark-teal archer outfit, holding an elegant bow. Hero faces and upper bodies clearly readable, graceful natural anatomy, six-to-seven-head proportions. A sweeping cream-lined cape catches the wind. Midground: carved stonework, faint lavender portal rings, coral-blossom trees, glinting river, soft jade grass. Distant atmospheric blue mountain ridges and soaring clouds. Rich painterly background and fine clean anime character linework, beautiful cel shadow shapes, subtle rim lighting, exquisite fabric and metal details, warm amber against cool teal/lavender. High quality anime film key art, not chibi, not a 3D render. The LEFT 42 percent must be quiet dark blue-teal scenic negative space for the game's HTML title and login form, with no characters or busy details. Main figures grouped in the right 55 percent. No text, letters, logos, borders, UI or watermark.
```

### heroes-walk.webp

```text
Use case: stylized-concept. Asset type: usable transparent anime game character SPRITE ATLAS.
Make one mathematically regular SIX COLUMN by FOUR ROW atlas (24 equal square cells, 3:2 overall canvas aspect, request 2400x1600 or highest available resolution). Fully transparent background, no background paint, no shadows, no text, no dividers, no UI. Every cell contains ONE COMPLETE adult anime character from hair top to boots, centered, same scale, no clipping and generous transparent padding. Polished hand-painted 2D anime JRPG sprites with elegant fine linework, clear cel shadows, graceful 6.5-head anatomy, exquisite fantasy costume details, readable silhouettes. Three-quarter view facing down-right, slight view from above suitable for an isometric RPG. NOT chibi, NOT pixel art, NOT 3D renders, NOT portrait busts.
Each character occupies TWO adjacent cells: first pose left boot forward/right boot back, second pose right boot forward/left boot back, natural small walking stride. Keep character design and equipment identical between their two cells. Weapon carried naturally; all hands and both feet visible.
Row1 columns1-2: Kael, young adult man coral-red tousled hair, teal eyes, burgundy gold-trimmed longcoat with ivory lining, silver right pauldron, dark trousers, silver sword. Columns3-4: Lumi, adult woman long ice-blue hair, ocean-blue moon-silver healer robes, elegant staff. Columns5-6: Mira, adult woman lavender hair tied to side, dark-violet gold-trimmed mage coat, star brooch, crystal staff.
Row2 columns1-2: Tess, adult woman peach-orange bob, brass goggles, slate-teal mechanic jacket, sword. Columns3-4: Celeste, adult woman long pearl-lilac hair, regal amethyst high-collar gown, gold filigree, elegant staff. Columns5-6: Clarissa, adult woman pale golden braid, navy gold-trimmed military longcoat, silver sword.
Row3 columns1-2: Aurelia, adult woman long warm-blonde hair, coral-red dawn knight attire, gold and silver armor, sword. Columns3-4: Nyx, adult woman indigo-silver hair, layered dark-plum stealth coat, narrow silver blade. Columns5-6: Vexa, adult woman pink-lilac ponytail, violet ranger outfit, bow.
Row4 columns1-2: Orin, adult man sage-green hair, forest-green gold-embroidered warden coat, staff. Columns3-4: Sora, adult woman turquoise-silver hair, dark-teal archer coat, leather straps, bow. Columns5-6: Riven, adult man chestnut hair, dark-mauve scout armor, sword.
Crisp beautiful original anime designs, clean transparent cutouts, exactly SIX columns FOUR rows with TWO walking poses for each of TWELVE heroes.
```

### props-anime.webp

```text
Use case: stylized-concept. Asset type: transparent isometric game scenery and enemy sprite atlas.
One high-resolution perfectly regular FOUR COLUMN by FOUR ROW atlas, sixteen equal square cells, each cell one isolated complete object with generous transparent padding. Background must be actual alpha transparency throughout all empty space, no backdrop, floor, color swatches, vignette or contact sheet lines. No text, labels or borders. Beautiful original 2D anime fantasy JRPG art, fine ink contours, painterly surfaces, clear cel-shadow masses, sophisticated warm ivory/gold versus jade/teal/lavender colors, isometric three-quarter view from above. Detailed but readable at 150 pixels, not chibi, not pixel art, not 3D renders.
Exact cell order left to right then top to bottom:
Row1: (1) lush layered jade-green broadleaf tree with curved trunk, (2) elegant coral-pink cherry blossom tree, (3) small blue slate roof ivory fantasy cottage with timber detail and glowing windows, (4) ornate tall ivory stone portal arch, fine golden carvings, glowing faint lavender ring and clear empty opening.
Row2: (5) cobalt-blue crystal ore outcrop on grey stone, (6) leafy violet flowering medicinal herb clump, (7) compact blue-green gatherable fruit tree, (8) refined small stone-and-brass forge with warm coals.
Row3: (9) broken ivory ruin arch with ivy and fallen stones, (10) layered mossy boulder formation, (11) thin ornamental gold-bronze glowing lantern on dark pole, (12) rustic wooden practice dummy with straw torso, wood post and round shield.
Row4: (13) sinister lean armored shadow stalker with indigo cloak and narrow glowing violet eyes, (14) bulky blue-silver masked sentinel with long shield and polearm, (15) elegant dark forest archer with hood and bow, (16) floating dark-plum oracle with elaborate horned crown and orange magical orb.
For enemies, show entire body from top to feet, facing down-right, same adult fantasy anime style as the scenery. Every object is a clean cutout on genuine transparency; preserve the exact 4x4 equal cell layout.
```

### ground-anime.webp

```text
Use case: stylized-concept. Asset type: ground texture atlas for an original anime fantasy isometric RPG.
Create ONE square texture atlas divided into exactly FOUR EQUAL SQUARE QUADRANTS, a 2x2 grid, no gaps or lines. Every quadrant is a perfectly TOP-DOWN orthographic ground surface, filled edge to edge with its material, independently tileable with continuous edges. Beautiful detailed hand-painted anime JRPG environment art, refined painterly brushwork and clear readable small detail, gentle diffuse illumination, no directional shadows or perspective. TOP LEFT: lush jade-green meadow grass, organic soft leaf clusters, tiny subtle yellow-green blades, a very few tiny white clover flowers. TOP RIGHT: warm pale ochre dirt path, delicate natural gravel and worn patches, subtle variation. BOTTOM LEFT: refined ivory grey stone courtyard paving, weathered rounded rectangular slabs, understated golden flecks, small cracks and seams; elegant fantasy sanctuary material, not a brick wall. BOTTOM RIGHT: pale sandy riverbank soil with scattered moss and tiny river pebbles.
No trees, props, buildings, characters, water, letters, labels, grids, frames, large rocks or empty margins. Each quadrant must be a useful unobstructed repeating ground texture. Restrained contrast so sprites and combat effects remain readable.
```

## Workstation expansion · 2026-11-08

[workstations-anime.webp](workstations-anime.webp) is a new 3×1 atlas for the foundry, joinery and laboratory. It was generated using the built-in `image_gen.imagegen` tool and encoded locally as WebP quality 92 with Sharp CLI 5.2.0, preserving alpha. It is original AI-generated project art, not manually painted artwork or an Elysium/Minecraft asset. The game adds activity effects in code; the sheet is static.

Exact generation prompt:

```text
Use case: stylized-concept. Asset type: transparent isometric workstation atlas for the original anime RPG Aetherbound.
Create one horizontal 3:1 atlas with EXACTLY THREE EQUAL SQUARE CELLS, side by side, no gaps, dividers, lettering or labels. Each cell contains one complete small workstation, centered with generous transparent padding, actual transparent alpha background. View from above in an isometric three-quarter perspective. Refined illustrated anime JRPG scenery matching elegant ivory stone, dark blue wood, brass/gold fittings, jade accents and warm painterly detail, fine clean linework and readable silhouettes. No characters, no floor slab outside each object's natural base, no 3D render, no pixel art.
LEFT CELL: a compact cobalt alloy foundry, ornate dark slate and ivory masonry furnace with brass chimney, blue crucible, soft amber fire, a small anvil and ingot tray; no flying sparks outside the cell.
MIDDLE CELL: an artisan joinery bench, beautifully detailed dark teal wooden sawhorse/worktable, neat cut planks, fine hand saw, brass clamps and small mechanical wheel, restrained ivy-green cloth trim.
RIGHT CELL: an elegant starleaf alchemy bench, dark-violet wood and gold-trimmed desk, glass retort and curved tubes, glowing lavender and teal liquid flasks, a small herb drying rack and carefully arranged flowers.
The three workstations should be equally sized, visually distinct and fully contained in their exact thirds of the transparent atlas. Request 1536x512 or highest available 3:1 resolution.
```

## Version 3.8 surface and character placeholders

| Files | Source and treatment |
| --- | --- |
| `surfaces/ground-*.webp` | [Grass Path 2](https://polyhaven.com/a/grass_path_2), Rob Tuytel. Diffuse and OpenGL normal maps. |
| `surfaces/slate-*.webp` | [Large Grey Tiles](https://polyhaven.com/a/large_grey_tiles), Rob Tuytel. Diffuse and OpenGL normal maps. |
| `surfaces/rock-*.webp` | [Rock 01](https://polyhaven.com/a/rock_01), Rob Tuytel. Diffuse and OpenGL normal maps. |
| `surfaces/alloy-*.webp` | [Blue Metal Plate](https://polyhaven.com/a/blue_metal_plate), Rob Tuytel. Diffuse and OpenGL normal maps. |
| `surfaces/cloth-normal.webp` | [Fabric Pattern 05](https://polyhaven.com/a/fabric_pattern_05). Only the OpenGL normal map is used. |
| `characters/kael.glb`, `characters/mira.glb` | pixiv VRoid Studio AvatarSample_C and AvatarSample_A. [Source copies](https://github.com/madjin/vrm-samples/tree/e16eb187100149a315ad92c3c9968f1d5baa6c7d/vroid/stable) and [pixiv sample terms](https://vroid.pixiv.help/hc/en-us/articles/4402394424089-VRoidPreset-A-Z). |

Poly Haven maps use the [CC0 asset license](https://polyhaven.com/license). The 1K source JPG maps were encoded to 768-pixel WebP for color and 512-pixel WebP for normals. The game tints the photographed surfaces and adjusts their repetition and lighting.

The VRoid placeholders follow pixiv's sample terms. They are not CC0. The browser assets preserve skinning and the bind pose, remove unused morph data and maps, and use meshopt geometry compression and WebP color maps up to 512 pixels. The renderer batches compatible skinned sections, reconstructs missing normals, and retextures the hair and tops with palettes based on the original Kael and Mira portraits. Clothing uses a shared cloth normal. Hand joints carry the existing game equipment, and the game drives movement, attacks and guard. The other ten appearances continue using their existing procedural models. The sample avatars are bundled as game assets, not sold or exported by an avatar creator.

Three.js r187's GLTFLoader, SkeletonUtils and BufferGeometryUtils use the included Three.js MIT license. The Meshopt decoder license is in `vendor/MESHOPT-LICENSE.txt`.

## Version 3.9 field placeholders

| File | CC0 source and browser treatment |
| --- | --- |
| `field/grass.glb` | Poly Haven [Grass Medium 01](https://polyhaven.com/a/grass_medium_01). One 290-triangle tuft with a 256-pixel diffuse map, instanced around the player. |
| `field/boulder.glb` | Poly Haven [Boulder 01](https://polyhaven.com/a/boulder_01). A 2,412-triangle proxy of the scan with a 512-pixel diffuse map. Ore and geode silhouettes retain the game's mineral tips. |
| `field/fibre-plant.glb` | Kenney [Nature Kit](https://kenney.nl/assets/nature-kit), `flower_purpleB.glb`, tinted for the two fibre species. |
| `field/fenstag.glb`, `field/shearjaw.glb` | Quaternius [Ultimate Animated Animal Pack](https://quaternius.com/packs/ultimateanimatedanimals.html), deer and wolf respectively. Three animations retained per asset. |
| `field/brackhide.glb` | Quaternius [Farm Animal Pack](https://quaternius.com/packs/farmanimal.html), pig. Three animations retained. |

The Kenney and Quaternius imports were sourced from the credited [Ishtaria asset mirror](https://github.com/Vitexus/ishtaria-client/tree/main/assets). Field GLBs use Meshopt compression and are served with the local game. The game recolors and resizes the imported placeholders.

## Optional custom female prototype

`characters/custom-female.glb` is the runtime v17 derivative of the project's female correction v14: original project armor/hair work over the licensed pixiv VRoid AvatarSample_A base under the sample terms linked above. It is not wholly original body geometry or CC0. Source authoring files remain outside the game bundle; this is a playable asset, not an avatar export service.

Technical derivative: 122,886 triangles, approximately 6.8 MB; rigid armor is single-bone skinned and batched, with lower-poly hair/armor. Body/Face are not decimated. This is a work-in-progress visual option, not pixel-identical to the high-detail authoring preview. Runtime preserves its authored materials and loads it only when selected. Selection is cosmetic and saves independently of race/class; legacy saves retain their previous appearance. Neutral body is normalized to exactly three blocks excluding held equipment. Existing male model remains unchanged.

## Custom male runtime

`characters/custom-male.glb` is male v38: lossless rigid-bone skinning/material batching of the project's completed v36 design over licensed VRoid AvatarSample_C. It retains39,584 triangles and authored materials,23 texture/image inputs, approximately4.17MB. Not CC0; the same VRoidPreset A-Z sample terms linked above apply. No earrings. Neutral assembled height1.747045 author units is normalized at runtime to3blocks. Existing source models remain for legacy appearance compatibility; selecting Male now loads this new model. There is no cloth simulation or blanket collision-certification claim.

Male v38 also corrects opaque skin/mouth/eye-white export flags; geometry and texture content are unchanged. Transparent face sorting no longer exposes the inner mouth through the skin.
