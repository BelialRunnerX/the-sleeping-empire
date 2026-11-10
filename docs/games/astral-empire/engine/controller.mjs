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
      index: pad.index,
      id: pad.id || "Standard controller",
      move: stick(pad.axes[0], pad.axes[1]),
      look: stick(pad.axes[2], pad.axes[3]),
      held: current,
      pressed: justPressed,
    };
  }
}

// Standard Gamepad API indices. Unsupported features stay reserved, never aliased.
export const CONTROLLER_BINDINGS = Object.freeze({jump:0,crouch:1,interact:2,weaponSwitch:3,attack:7,menu:9,autoTarget:11});
export const CONTROLLER_SKILLS = Object.freeze([[12,'lance'],[15,'nova'],[13,'dash'],[14,'burst']]);
export function controllerActions(pad, menu=false) {
  if (!pad) return [];
  const p=pad.pressed, h=pad.held;
  if(menu) return p.has(9)||p.has(1)?['close']:p.has(0)?['select']:[];
  if(p.has(9)) return ['menu'];
  const actions=[];
  for(const name of ['jump','interact','autoTarget'])if(p.has(CONTROLLER_BINDINGS[name]))actions.push(name);
  for(const [button,skill] of CONTROLLER_SKILLS)if(p.has(button))actions.push(skill);
  // LB+RB is reserved for F5, which is not implemented yet. Neither bumper
  // fires an older individual ability or guard, whether pressed alone or together.
  return actions;
}
export function controllerMenuDirection(pad) {
  if(pad.held.has(12)||pad.held.has(14)||pad.move.y<-.54||pad.move.x<-.54)return -1;
  if(pad.held.has(13)||pad.held.has(15)||pad.move.y>.54||pad.move.x>.54)return 1;
  return 0;
}
// Camera-forward ground cone, then angular closeness before distance. Never select
// enemies behind the player camera or through terrain/solid obstacles.
export function targetInView(sim,yaw,halfAngle=Math.PI/4) {
  const p=sim.player, fx=-Math.sin(yaw), fz=-Math.cos(yaw);
  let best=null, alignment=Math.cos(halfAngle), distance=Infinity;
  for(const e of sim.enemies) {
    const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);
    if(e.hp<=0||d>30||!d||(sim.combatVisible&&!sim.combatVisible(p,e)))continue;
    const dot=(dx*fx+dz*fz)/d;
    if(dot>alignment+1e-6||(Math.abs(dot-alignment)<1e-6&&d<distance)){best=e;alignment=dot;distance=d;}
  }
  return best;
}

// An interrupted hold must be released before it can re-arm. This prevents
// menu closes, tab refocus and reconnect from inheriting a partial gesture.
export class ControllerBuildHold {
  start=null; fired=false; blocked=false; index=null;
  update(pad,now,enabled=true) {
    if(!pad){this.start=null;this.fired=false;this.blocked=true;this.index=null;return false;}
    const held=pad.held.has(1);
    if(this.index!==null&&this.index!==pad.index){this.start=null;this.blocked=true;}
    this.index=pad.index;
    if(!held){this.start=null;this.fired=false;this.blocked=false;return false;}
    if(!enabled){this.start=null;this.blocked=true;return false;}
    if(this.blocked||this.fired)return false;
    if(this.start===null)this.start=now;
    if(now-this.start<500)return false;
    this.fired=true;return true;
  }
}
