// Rendering/streaming presets are data, independent of density and save identity.
export const TERRAIN_PROFILES = {
  bastion: { surface:0x829b76, stone:0x7c818b, detailRadius:1, depth:36, radius:6400, squash:1.1 },
  moon: { surface:0x9eacbc, stone:0x656f85, detailRadius:1, depth:36, radius:6400, squash:1.1 },
  cinder: { surface:0x81564b, stone:0x463d48, detailRadius:1, depth:36, radius:6400, squash:1.1 },
  frost: { surface:0xc0d8df, stone:0x718c9c, detailRadius:1, depth:36, radius:6400, squash:1.1 },
  orbit: { surface:0x8097a0, stone:0x4b5266, detailRadius:1, depth:36, radius:6400, squash:1.1 },
};
export const terrainProfile=realm=>TERRAIN_PROFILES[realm]||TERRAIN_PROFILES.bastion;
