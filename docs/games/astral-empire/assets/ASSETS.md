# Anime artwork provenance and prompts

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
