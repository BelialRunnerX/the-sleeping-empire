import * as T from "../vendor/three.module.js";
import { OUTCROP, meshMicro, mineMicro, raycastMicro, MeshPublication, MICRO_VOLUME } from "./microvoxels.mjs";

export function createMicrovoxelView(scene, state, height, canvas) {
  const group = new T.Group(), publication = new MeshPublication();
  const offset = height(OUTCROP.x, OUTCROP.z);
  group.position.y = offset;
  scene.add(group);
  const material = new T.MeshStandardMaterial({ color: 0x64868b, roughness: .85 });
  const fallback = new T.Mesh(new T.BoxGeometry(2, 1, 2), material);
  fallback.position.set(OUTCROP.x, .5, OUTCROP.z);
  group.add(fallback);
  let fine = null;
  function rebuild() {
    const ticket = publication.begin();
    const data = meshMicro(state.microvoxels);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute("normal", new T.Float32BufferAttribute(data.normals, 3));
    geometry.computeBoundingSphere();
    if (!publication.accepts(ticket)) { geometry.dispose(); return; }
    const replacement = new T.Mesh(geometry, material);
    replacement.castShadow = replacement.receiveShadow = true;
    group.add(replacement); // Publish replacement before retiring fallback/old mesh.
    if (fine) { group.remove(fine); fine.geometry.dispose(); }
    fine = replacement;
    fallback.visible = false;
    canvas.dataset.microFineReady = "true";
    canvas.dataset.microCoarseVisible = "false";
    canvas.dataset.microQuads = String(data.quads);
  }
  canvas.dataset.microFineReady = "false";
  canvas.dataset.microCoarseVisible = "true";
  rebuild(); // Crucially not gated on edits, input, or a later dirty-terrain event.
  return {
    target: { ...OUTCROP, mesh: group },
    mine(player) {
      const origin = [player.x, 1.1, player.z];
      const hit = raycastMicro(state.microvoxels, origin, [OUTCROP.x - player.x, -.25, OUTCROP.z - player.z]);
      if (!hit || !mineMicro(state.microvoxels, hit.cell)) return { ok: false, message: "Move around the outcrop to expose another microcell." };
      if (state.microvoxels.recoveredUnits % MICRO_VOLUME === 0) state.resources.stone++;
      rebuild();
      return { ok: true, message: `Recovered 1/4096 stone · ${state.microvoxels.recoveredUnits % MICRO_VOLUME}/4096 toward the next block.` };
    },
    dispose() { publication.dispose(); },
  };
}
