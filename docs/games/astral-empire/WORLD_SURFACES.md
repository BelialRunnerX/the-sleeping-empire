# Shared world surface materials

Original deterministic procedural ceramic cladding, limestone masonry, blue-slate roofing, graphite structure and wood surfaces follow the approved modular-world art direction. No reference image is copied into the textures. Existing house and arena-ruin geometry, positions and silhouettes are unchanged; unresolved waystone identities are not guessed.

All five families share three padded DataTexture atlases: albedo in sRGB, tangent-space normals and roughness in linear space. At the default256px tile size, each atlas is1440x288 with16px periodic gutters. Fragment derivatives are computed before tile wrapping, with mip selection capped at level3 to avoid neighboring-material bleed. Five materials share these three textures; explicit semantic bindings affect only known authored parts.

UV-only geometry clones normalize box face density and cylinder caps without changing original shared positions or UVs. The kit owns and disposes its shared textures/materials once. World lifetime cleanup owns the per-object UV clones.

The isolated warmed renderer measured43existing textures to46total, within the unchanged limit of fewer than48. Eight deterministic texture/UV/atlas/disposal tests passed. Final integrated visual budgets and shader compilation are checked across all five realms before release. Physical-phone performance is not inferred from desktop emulation.

Textures do not resolve the original simple roof silhouette, flat doors or un-beveled architectural geometry. Those are separate modeling improvements.
