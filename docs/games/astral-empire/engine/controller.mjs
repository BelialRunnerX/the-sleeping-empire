const DEAD_ZONE = 0.19;
export function stick(x = 0, y = 0) {
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length <= DEAD_ZONE) return { x: 0, y: 0 };
  const strength = Math.min(1, (length - DEAD_ZONE) / (1 - DEAD_ZONE));
  return { x: (x / length) * strength, y: (y / length) * strength };
}
export class ControllerInput {
  index = null;
  previous = new Set();
  read(gamepads) {
    const pads = Array.from(gamepads || []).filter(
      (p) => p?.connected && p.mapping === "standard",
    );
    const pad = pads.find((p) => p.index === this.index) || pads[0];
    if (!pad) {
      this.index = null;
      this.previous.clear();
      return null;
    }
    const current = new Set(
      Array.from(pad.buttons).flatMap((b, i) =>
        b.pressed || b.value > 0.63 ? [i] : [],
      ),
    );
    if (this.index !== pad.index) this.previous.clear();
    const justPressed = new Set(
      [...current].filter((i) => !this.previous.has(i)),
    );
    this.index = pad.index;
    this.previous = current;
    return {
      id: pad.id || "Standard controller",
      move: stick(pad.axes[0], pad.axes[1]),
      look: stick(pad.axes[2], pad.axes[3]),
      held: current,
      pressed: justPressed,
    };
  }
}
