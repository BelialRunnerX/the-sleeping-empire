import {globalField} from './galaxy-fields.mjs';
export const RESOURCE_VERSION='hierarchical-resource-potentials-v1';
function exact(v){if(typeof v==='number'&&!Number.isSafeInteger(v))throw Error('Unsafe global cell');if(!/^-?\d+$/.test(String(v)))throw Error('Invalid cell');return BigInt(v);}
function floorDiv(a,b){return a>=0n?a/b:-((-a+b-1n)/b);}
const unit=x=>Number.isFinite(x)&&x>=0&&x<=1;
export function createResourceHierarchy(seed,{broadScaleCells=32,localWeight=.35}={}){
 if(typeof seed!=='string'||!seed||seed.length>128||!Number.isSafeInteger(broadScaleCells)||broadScaleCells<1||broadScaleCells>1048576||!unit(localWeight))throw Error('Explicit seed and bounded field recipe required');
 const recipeId=RESOURCE_VERSION+':'+broadScaleCells+':'+localWeight;
 const scope=JSON.stringify([seed,recipeId]);
 function broad(tag,cell,offset){
  if(!Array.isArray(cell)||cell.length!==3||!Array.isArray(offset)||offset.length!==3||!offset.every(unit))throw Error('Exact global cell and normalized offset required');
  const c=cell.map(exact),s=BigInt(broadScaleCells),q=c.map(n=>floorDiv(n,s));
  return globalField(scope,tag,q,c.map((n,i)=>(Number(n-q[i]*s)+offset[i])/broadScaleCells));
 }
 function sample(system,planet,resourceIds){
  if(!system?.id||!planet?.id||planet.systemId!==system.id||!Array.isArray(planet.localPosition)||planet.localPosition.length!==3||!planet.localPosition.every(Number.isFinite))throw Error('Resolved parent-child objects required');
  if(!Array.isArray(resourceIds)||resourceIds.length>16||new Set(resourceIds).size!==resourceIds.length||resourceIds.some(x=>typeof x!=='string'||!/^[-a-z0-9_:]{1,64}$/.test(x)))throw Error('Registry resource IDs required');
  const local=planet.localPosition.map(Math.floor),off=planet.localPosition.map((x,i)=>x-local[i]);
  const systemSeed=JSON.stringify([scope,system.id]),planetSeed=JSON.stringify([scope,planet.id]);
  const mix=(parent,variation)=>parent*(1-localWeight)+variation*localWeight;
  const general=broad('galactic-general-richness',system.cell,system.offset);
  const inherited=mix(general,globalField(systemSeed,'system-general-richness',[0,0,0],[.5,.5,.5]));
  const planetary=mix(inherited,globalField(planetSeed,'planet-general-richness',local,off));
  return {version:RESOURCE_VERSION,recipeId,systemId:system.id,planetId:planet.id,general:{galactic:general,system:inherited,planet:planetary},
   resources:Object.fromEntries(resourceIds.map(id=>{
    const galactic=general*broad('galactic-resource:'+id,system.cell,system.offset);
    const sys=inherited*mix(broad('galactic-resource:'+id,system.cell,system.offset),globalField(systemSeed,'system-resource:'+id,[0,0,0],[.5,.5,.5]));
    const potential=planetary*mix(sys/Math.max(inherited,Number.MIN_VALUE),globalField(planetSeed,'planet-resource:'+id,local,off));
    return [id,{galactic,system:sys,planet:potential}];
   })),units:'normalized occurrence potential, not ore quantity or physical spacing',
   provenance:'Adapted hierarchy. Resource IDs must be resolved against source registry; no invented source abundance values.'};
 }
 return Object.freeze({version:RESOURCE_VERSION,recipeId,broad,sample});
}
