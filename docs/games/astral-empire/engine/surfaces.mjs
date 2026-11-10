import * as T from "../vendor/three.module.js";

const sets = { ground: 76, slate: 6, rock: 1, alloy: 1, cloth: 2 };
const kits = new Map();
let pending;
export function loadSurfaces() {
  return (pending ??= Promise.allSettled(
    Object.entries(sets).map(async ([name, repeat]) => {
      const loader = new T.TextureLoader();
      const get = async (role) => {
        const texture = await loader.loadAsync(
          new URL(
            "../assets/surfaces/" + name + "-" + role + ".webp",
            import.meta.url,
          ).href,
        );
        texture.wrapS = texture.wrapT = T.RepeatWrapping;
        texture.repeat.setScalar(repeat);
        texture.anisotropy = 4;
        if (role === "color") texture.colorSpace = T.SRGBColorSpace;
        return texture;
      };
      const [map, normalMap] = await Promise.all([
        name === "cloth" ? null : get("color"),
        get("normal"),
      ]);
      kits.set(name, { map, normalMap });
    }),
  ));
}
export const surface = (name) => kits.get(name) || {};
