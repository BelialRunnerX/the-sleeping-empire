// Input-independent targeting policy; normal Simulation.attack owns costs/timing.
export function updateCombatAssist(sim, { autoTarget=false, autoFire=true, range=0, enabled=true, selectTarget=null }={}) {
  if (!enabled) return false;
  const p=sim.player, valid=e=>e && e.hp>0 && sim.enemies.includes(e) && Math.hypot(e.x-p.x,e.z-p.z)<=30 && (!sim.combatVisible || sim.combatVisible(p,e));
  if(p.hp<=0){sim.locked=null;return false;}
  if(!valid(sim.locked))sim.locked=null;
  if(autoTarget && !sim.locked && selectTarget){const candidate=selectTarget();if(valid(candidate))sim.locked=candidate;}
  if(autoTarget && !sim.locked && !selectTarget){let best=30;for(const e of sim.enemies)if(valid(e)){const d=Math.hypot(e.x-p.x,e.z-p.z);if(d<best){best=d;sim.locked=e;}}}
  return !!(autoFire && sim.locked && Math.hypot(sim.locked.x-p.x,sim.locked.z-p.z)<=range && sim.attack('strike'));
}
