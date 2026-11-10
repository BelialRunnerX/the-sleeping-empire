import * as T from "../vendor/three.module.js";

// Lightweight procedural posing, not imported/authored animation clips.
// Source Lumi travels along +X and bends in the XY plane (glTF Y-up).
export function createLumiMotion(object) {
  object.updateMatrixWorld(true);
  const axis = new T.Vector3(0, 0, 1).applyQuaternion(object.getWorldQuaternion(new T.Quaternion()));
  const bones = new Map();
  object.traverse((bone) => {
    if (!bone.isBone) return;
    const parentRotation = bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
    bones.set(bone.name, { bone, rest: bone.quaternion.clone(), axis: axis.clone().applyQuaternion(parentRotation) });
  });
  return { bones, time: 0, blend: 0, rotation: new T.Quaternion() };
}

export function updateLumiMotion(state, clip, dt) {
  const step = Math.min(Math.max(dt || 0, 0), 0.1);
  const moving = clip !== "Idle";
  const fast = clip === "Gallop" || clip === "Run";
  state.time += step * (fast ? 9 : 5);
  state.blend += ((moving ? 1 : 0) - state.blend) * Math.min(1, step * 8);
  function pose(name, angle) {
    const entry = state.bones.get(name);
    if (!entry) return;
    entry.bone.quaternion.copy(entry.rest).premultiply(state.rotation.setFromAxisAngle(entry.axis, angle));
  }
  for (const side of [-1, 1]) {
    for (const limb of ["fore", "hind"]) {
      const phase = state.time + ((side === -1) !== (limb === "hind") ? Math.PI : 0);
      const swing = Math.sin(phase) * (fast ? 0.36 : 0.22) * state.blend;
      const bend = Math.max(0, Math.cos(phase)) * (fast ? 0.45 : 0.25) * state.blend;
      pose(`${limb}_${side}`, swing);
      pose(`${limb}_${side}_shin`, -bend);
      pose(`${limb}_${side}_foot`, -swing + bend * 0.6);
    }
  }
  pose("neck", Math.sin(state.time * 0.24) * 0.025);
  pose("tail", Math.sin(state.time * 0.6) * 0.07);
}
