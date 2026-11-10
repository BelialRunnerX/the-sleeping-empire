import { blocked } from "./navigation.mjs";

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const angle = (n) => Math.atan2(Math.sin(n), Math.cos(n));
const mix = (a, b, t) => a + (b - a) * t;
export const CAMERA_KEY = "astral_empire_camera_v1";
export const CAMERA_HOME = { yaw: Math.PI / 4, pitch: 0.34, distance: 10.5 };
export function cameraPreferences(raw) {
  const get = (key) =>
    Number.isFinite(raw?.[key]) ? raw[key] : CAMERA_HOME[key];
  return {
    yaw: angle(get("yaw")),
    pitch: clamp(get("pitch"), 0.02, 1.3),
    distance: clamp(get("distance"), 3.6, 22),
  };
}

export function clearBoom(focus, offset, height, blockers) {
  const length = Math.hypot(offset.x, offset.y, offset.z);
  const steps = Math.max(1, Math.ceil(length / 0.24));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = focus.x + offset.x * t,
      y = focus.y + offset.y * t,
      z = focus.z + offset.z * t;
    if (
      y < height(x, z) + 0.28 ||
      blockers.some(
        (o) =>
          Math.abs(x - o.x) < (o.half || o.radius) + 0.15 &&
          Math.abs(z - o.z) < (o.half || o.radius) + 0.15 &&
          y < height(o.x, o.z) + o.height + 0.18 &&
          blocked(x, z, [o], 0.15),
      )
    )
      return Math.max(0.07, (i - 1) / steps);
  }
  return 1;
}

export class CameraRig {
  constructor(preferences) {
    this.goal = cameraPreferences(preferences);
    Object.assign(this, this.goal);
    this.pan = { x: 0, z: 0 };
    this.focus = null;
    this.boom = 1;
  }
  orbit(dx, dy) {
    this.goal.yaw = angle(this.goal.yaw + dx);
    this.goal.pitch = clamp(this.goal.pitch + dy, 0.02, 1.3);
  }
  zoom(factor) {
    this.goal.distance = clamp(this.goal.distance * factor, 3.6, 22);
  }
  translate(right, forward) {
    this.pan.x = clamp(
      this.pan.x + right * Math.cos(this.yaw) - forward * Math.sin(this.yaw),
      -12,
      12,
    );
    this.pan.z = clamp(
      this.pan.z - right * Math.sin(this.yaw) - forward * Math.cos(this.yaw),
      -12,
      12,
    );
  }
  recenter(reset = false) {
    this.pan.x = this.pan.z = 0;
    if (reset) this.goal = { ...CAMERA_HOME };
  }
  update(dt, player, input, height, blockers, reduced = false, meshClearance) {
    const t = reduced ? 1 : 1 - Math.exp(-12 * dt);
    this.yaw = angle(this.yaw + angle(this.goal.yaw - this.yaw) * t);
    this.pitch = mix(this.pitch, this.goal.pitch, t);
    this.distance = mix(this.distance, this.goal.distance, t);
    const x = player.x + this.pan.x + (reduced ? 0 : (input.x || 0) * 0.65);
    const z = player.z + this.pan.z + (reduced ? 0 : (input.z || 0) * 0.65);
    const y = height(x, z) + 1.48 + Math.max(0, player.y || 0) * 0.42;
    if (
      !this.focus ||
      Math.hypot(player.x - this.lastX, player.z - this.lastZ) > 9
    )
      this.focus = { x, y, z };
    else {
      this.focus.x = mix(this.focus.x, x, t);
      this.focus.y = mix(this.focus.y, y, t);
      this.focus.z = mix(this.focus.z, z, t);
    }
    this.lastX = player.x;
    this.lastZ = player.z;
    // Keep the pivot above terrain as it eases across ridges and riverbanks.
    this.focus.y = Math.max(
      this.focus.y,
      height(this.focus.x, this.focus.z) + 1.1,
    );
    const horizontal = Math.cos(this.pitch) * this.distance;
    const offset = {
      x: Math.sin(this.yaw) * horizontal,
      y: Math.sin(this.pitch) * this.distance,
      z: Math.cos(this.yaw) * horizontal,
    };
    const safe = Math.min(
      clearBoom(this.focus, offset, height, blockers),
      meshClearance ? meshClearance(this.focus, offset) : 1,
    );
    this.boom =
      safe < this.boom
        ? safe
        : mix(this.boom, safe, reduced ? 1 : 1 - Math.exp(-5 * dt));
    return {
      focus: this.focus,
      eye: {
        x: this.focus.x + offset.x * this.boom,
        y: this.focus.y + offset.y * this.boom,
        z: this.focus.z + offset.z * this.boom,
      },
    };
  }
}
