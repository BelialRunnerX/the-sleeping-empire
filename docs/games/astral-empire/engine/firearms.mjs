import { WEAPON_FORMS } from './arsenal.mjs';
export function firearm(state) {
 const item=state.items.find(i=>i.id===state.equipped.weapon), def=WEAPON_FORMS[item?.form];
 if(!def?.magazine)return null;
 item.rounds=Number.isFinite(item.rounds)?Math.max(0,Math.min(def.magazine,Math.floor(item.rounds))):def.magazine;
 item.reloadLeft=Number.isFinite(item.reloadLeft)?Math.max(0,Math.min(def.reload,item.reloadLeft)):0;
 return {item,...def};
}
export function startReload(state){const f=firearm(state);if(!f||f.item.reloadLeft>0||f.item.rounds>=f.magazine)return false;f.item.reloadLeft=f.reload;return true;}
export function tickReload(state,dt){const f=firearm(state);if(!f||f.item.reloadLeft<=0)return;f.item.reloadLeft=Math.max(0,f.item.reloadLeft-Math.max(0,dt));if(f.item.reloadLeft<=1e-9){f.item.reloadLeft=0;f.item.rounds=f.magazine;}}
export function consumeRound(state){const f=firearm(state);if(!f||f.item.reloadLeft>0)return false;if(!f.item.rounds){startReload(state);return false;}f.item.rounds--;if(!f.item.rounds)startReload(state);return true;}
// Nearest ray/sphere intersection, not an area attack. Direction must be normalized.
export function raySphere(origin,dir,center,radius,maxDistance){const delta=center.map((v,i)=>v-origin[i]),along=delta.reduce((n,v,i)=>n+v*dir[i],0),perp=delta.reduce((n,v)=>n+v*v,0)-along*along,rr=radius*radius;if(perp>rr)return null;const far=along+Math.sqrt(Math.max(0,rr-perp));if(far<0)return null;const near=Math.max(0,along-Math.sqrt(Math.max(0,rr-perp)));return near<=maxDistance?near:null;}
