import * as T from "../vendor/three.module.js";
import { FIBRE_PLANTS } from "./ecology.mjs";
import { fieldProp } from "./field-art.mjs";
import { cropStage, CROP_STAGES, NURSERY } from "./nursery.mjs";

export function createNurseryView(scene, art, height) {
  const mesh = new T.Group();
  mesh.position.set(NURSERY.x, height(NURSERY.x, NURSERY.z), NURSERY.z);
  scene.add(mesh);
  art.shape(mesh, "panel", 0x586777, 0, 0.09, 0, 2.85, 0.18, 1.87);
  const blueprint = art.shape(
    mesh,
    "gem",
    0x8ddfda,
    0,
    0.78,
    0,
    0.38,
    0.68,
    0.38,
  );
  blueprint.material = art.material(0x8ddfda, 0.55);
  const rack = new T.Group();
  mesh.add(rack);
  const frame = (kind, tint, ...args) => art.shape(rack, kind, tint, ...args);
  for (const x of [-1.28, 1.28]) {
    frame("panel", 0x354c61, x, 0.54, 0, 0.16, 1.08, 1.52);
    frame("box", 0x8acabb, x, 0.76, 0.77, 0.09, 0.34, 0.02).material =
      art.material(0x8acabb, 0.52);
  }
  frame("panel", 0x42596a, 0, 1.43, -0.64, 2.72, 0.18, 0.23);
  frame("box", 0xa8ffde, 0, 1.32, -0.53, 2.45, 0.05, 0.12).material =
    art.material(0xa8ffde, 0.66);
  frame("tube", 0x81bcba, 0, 0.62, -0.78, 0.055, 2.48, 0.055).rotation.z =
    Math.PI / 2;
  const beds = Array.from({ length: 4 }, (_, index) => {
    const bed = new T.Group();
    bed.position.set(index % 2 ? 0.61 : -0.61, 0, index < 2 ? 0.39 : -0.41);
    rack.add(bed);
    art.shape(bed, "panel", 0x40586b, 0, 0.36, 0, 1.17, 0.26, 0.73);
    art.shape(bed, "box", 0x303638, 0, 0.497, 0, 0.96, 0.02, 0.55);
    const light = art.shape(
      bed,
      "box",
      0x7996a4,
      0,
      0.39,
      0.378,
      0.42,
      0.064,
      0.03,
    );
    const plants = Object.fromEntries(
      Object.entries(FIBRE_PLANTS).map(([id, spec]) => {
        const plant =
          fieldProp("fibre-plant", 0.68, spec.color) || new T.Group();
        if (!plant.children.length)
          art.shape(plant, "crown", spec.color, 0, 0.28, 0, 0.4, 0.56, 0.45);
        plant.position.y = 0.51;
        bed.add(plant);
        return [id, plant];
      }),
    );
    return { bed, light, plants };
  });
  return {
    target: { ...NURSERY, type: "nursery", mesh },
    update({ tier, plots }, now) {
      blueprint.visible = !tier;
      rack.visible = !!tier;
      for (const [index, { bed, light, plants }] of beds.entries()) {
        bed.visible = index < plots.length;
        const crop = plots[index];
        for (const [id, plant] of Object.entries(plants)) {
          plant.visible = crop?.species === id;
          if (!plant.visible) continue;
          const stage = cropStage(crop, now);
          plant.scale.setScalar(0.22 + (0.78 * stage) / (CROP_STAGES - 1));
        }
        light.material = !crop
          ? art.material(0x7996a4)
          : cropStage(crop, now) === CROP_STAGES - 1
            ? art.material(0xffce87, 0.76)
            : art.material(0x81dbd0, 0.43);
      }
    },
  };
}
