/** Standalone browser adaptation. Placement data/rules source-pinned; random-walk
 * vein geometry and RNG are NOT Minecraft's ore-feature algorithm. No renderer. */
export const GEOLOGY_VERSION = 'elysium-ore-adapter-1';
export const COLUMN_METRES = 16;
const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const int=(v,name)=>{if(!Number.isSafeInteger(v)||Math.abs(v)>100000000)throw new RangeError(name);return v;};
export function geologyColumn(x,z){return {x:Math.floor(x/COLUMN_METRES),z:Math.floor(z/COLUMN_METRES)};}
export function bandRules(band){band=Math.max(0,Math.min(3,Math.trunc(band)));if(!Number.isFinite(band))throw new TypeError('band');return {size:9-2*band,attempts:Math.max(1,12>>band)};}
// FNV-1a over UTF-16 followed by avalanche; per-decision salts avoid stream coupling.
export function decisionRoll(...parts){let h=2166136261;for(const c of JSON.stringify(parts)){h=Math.imul(h^c.charCodeAt(0),16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
export function validateManifest(manifest){
 if(manifest.schema!==1||!Array.isArray(manifest.entries))throw new TypeError('manifest schema');
 const ids=new Set();for(const f of manifest.entries){
  if(typeof f.id!=='string'||ids.has(f.id))throw new Error('duplicate/invalid feature');ids.add(f.id);
  const r=bandRules(f.band);if(f.size!==r.size||f.attempts!==r.attempts)throw new Error('band mismatch '+f.id);
  if(!Number.isInteger(f.minY)||!Number.isInteger(f.maxY)||f.minY>f.maxY||f.discardOnAir!==0.5)throw new Error('placement mismatch');
  if(!f.targets?.length||!f.biomeSelectors?.length||!f.family)throw new Error('incomplete placement');
 }return true;
}
function tagMatch(selector,value,tags){return selector.startsWith('#')?tags?.includes(selector.slice(1)):selector===value;}
function hostMatch(target,sample){const p=target.target;return p.predicate_type==='minecraft:block_match'?sample.block===p.block:p.predicate_type==='minecraft:tag_match'?sample.tags?.includes(p.tag):false;}
function config(options){
 const {seed,realm,version=GEOLOGY_VERSION,availableFamilies,sample}=options;
 if(typeof seed!=='string'&&!(typeof seed==='number'&&Number.isSafeInteger(seed)))throw new TypeError('stable seed required');
 if(typeof realm!=='string'||!realm||typeof version!=='string'||!version)throw new TypeError('realm/version');
 if(!(availableFamilies instanceof Set)||typeof sample!=='function')throw new TypeError('availableFamilies Set and base-world sample callback required');
 return {seed,realm,version,availableFamilies,sample};
}
/** Generate proposals owned by a 16x16 horizontal source column over source Y range.
 * Sample must read immutable base geology (not already-generated ores or edit deltas).
 * Sample: {block,tags,biome,biomeTags,airExposed}. Air/biome resolution is caller-owned. */
export function generateOwnedVeins(manifest,column,options){
 validateManifest(manifest);const c=config(options);int(column.x,'column.x');int(column.z,'column.z');const out=[];
 for(const f of [...manifest.entries].sort((a,b)=>a.id<b.id?-1:1)){
  if(!c.availableFamilies.has(f.family))continue;
  for(let attempt=0;attempt<f.attempts;attempt++){
   const key=[c.version,c.seed,c.realm,column.x,column.z,f.id,attempt];
   let x=column.x*16+Math.floor(decisionRoll(...key,'x')*16),z=column.z*16+Math.floor(decisionRoll(...key,'z')*16),y=f.minY+Math.floor(decisionRoll(...key,'y')*(f.maxY-f.minY+1));
   const origin=c.sample(x,y,z);if(!origin||!f.biomeSelectors.some(s=>tagMatch(s,origin.biome,origin.biomeTags)))continue;
   const seen=new Set();
   for(let step=0;step<f.size;step++){
    if(step){const d=directions[Math.floor(decisionRoll(...key,'walk',step)*6)];x+=d[0];y+=d[1];z+=d[2];}
    const position=`${x},${y},${z}`;if(seen.has(position))continue;seen.add(position);
    // Adaptation confines every candidate, not only vein origin, to manifest Y bounds.
    if(y<f.minY||y>f.maxY)continue;
    const s=c.sample(x,y,z);if(!s)continue;const target=f.targets.find(t=>hostMatch(t,s));if(!target)continue;
    if(s.airExposed&&decisionRoll(...key,'air',position)<f.discardOnAir)continue;
    const id=JSON.stringify([...key,position]);
    out.push({id,x,y,z,featureId:f.id,family:f.family,block:target.state.Name,owner:{...column},attempt});
   }
  }
 }
 return out.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}
/** Destination-column ownership, including cross-border veins from neighboring origins.
 * First canonical proposal wins overlaps. No generation-order dependence. */
export function generateColumn(manifest,column,options){
 const candidates=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)candidates.push(...generateOwnedVeins(manifest,{x:column.x+dx,z:column.z+dz},options));
 candidates.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const chosen=new Map();for(const p of candidates){const cell=geologyColumn(p.x,p.z);if(cell.x!==column.x||cell.z!==column.z)continue;const key=`${p.x},${p.y},${p.z}`;if(!chosen.has(key))chosen.set(key,p);}
 // Resolve overlaps BEFORE depletion: mined winners must never reveal respawned losers.
 const depleted=options.depleted||new Set();return [...chosen.values()].filter(p=>!depleted.has(p.id));
}
export function createDepletionState({version=GEOLOGY_VERSION,seed,realm}){config({version,seed,realm,availableFamilies:new Set(),sample:()=>null});return {schema:1,version,seed,realm,mined:[]};}
export function mineDeposit(state,deposit){
 const key=JSON.parse(deposit.id);if(key[0]!==state.version||key[1]!==state.seed||key[2]!==state.realm)throw new Error('deposit world/version mismatch');
 if(state.mined.includes(deposit.id))return false;state.mined.push(deposit.id);state.mined.sort();return true;
}
export function restoreDepletion(value,world){
 const state=createDepletionState(world);if(!value||value.schema!==1||value.version!==state.version||value.seed!==state.seed||value.realm!==state.realm)return state;
 for(const id of Array.isArray(value.mined)?value.mined:[]){try{const k=JSON.parse(id);if(k.length!==8||k[0]!==state.version||k[1]!==state.seed||k[2]!==state.realm||!Number.isSafeInteger(k[3])||!Number.isSafeInteger(k[4])||typeof k[5]!=='string'||!Number.isInteger(k[6])||k[6]<0||k[6]>11||!/^[-]?\d+,[-]?\d+,[-]?\d+$/.test(k[7])||JSON.stringify(k)!==id)continue;state.mined.push(id);}catch{}}
 state.mined=[...new Set(state.mined)].sort();return state;
}
