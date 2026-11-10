import {globalField} from './galaxy-fields.mjs';
import {createPlanetProjection,direction,project} from './planet-projection.mjs';
import {cubeSphereGraph,solvePlanetDrainage} from './cube-sphere-graph.mjs';
export const SURFACE_VERSION='planetary-direction-relief-v1';
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const normalize=v=>{const l=Math.hypot(...v);if(v.length!==3||!v.every(Number.isFinite)||!l)throw Error('Finite direction required');return v.map(x=>x/l);};
export function createPlanetSurface({universalSeed,planetId,radiusMetres,sourcePreset=null,terrainEligible=true,reliefMetres=8000,seaLevelMetres=0,waterPolicy='ocean-drainage',macroResolution=32}={}){
 if(typeof universalSeed!=='string'||!universalSeed||universalSeed.length>128||typeof planetId!=='string'||!planetId||planetId.length>2048)throw Error('Explicit stable identity required');
 if(!terrainEligible)throw Error('Gas/orbit world is not surface eligible');
 if(!Number.isFinite(reliefMetres)||reliefMetres<=0||!Number.isFinite(seaLevelMetres)||!['ocean-drainage','endorheic','dry'].includes(waterPolicy))throw Error('Invalid relief/water policy');
 if(sourcePreset==='emerald_bastion'&&waterPolicy==='ocean-drainage')throw Error('Source Bastion forbids oceans; use endorheic prototype or explicit adapted preset');
 if(!Number.isInteger(macroResolution)||macroResolution<2||macroResolution>64)throw Error('Bounded macro resolution2..64');
 const projection=createPlanetProjection({radiusMetres,minAltitudeMetres:seaLevelMetres-reliefMetres,maxAltitudeMetres:seaLevelMetres+reliefMetres});
 const recipeId=JSON.stringify([SURFACE_VERSION,sourcePreset,radiusMetres,reliefMetres,seaLevelMetres,waterPolicy]);
 const drainageRecipeId=JSON.stringify([recipeId,'tangent-drainage-v1',macroResolution]);
 const scope=JSON.stringify([universalSeed,planetId,recipeId]);
 function noise(tag,d,frequency){
  const p=d.map(x=>x*frequency),cell=p.map(Math.floor),offset=p.map((x,i)=>x-cell[i]);
  return globalField(scope,tag,cell,offset);
 }
 const axis=normalize([0,1,2].map(i=>globalField(scope,'range-axis:'+i,[0,0,0],[.5,.5,.5])*2-1));
 function sample(dir){
  const d=normalize(dir),continentalness=.72*noise('continents',d,1.7)+.28*noise('coasts',d,4.1);
  const land=continentalness-.49;
  const warpedDistance=Math.abs(dot(axis,d)+.19*(noise('range-warp',d,3.8)*2-1));
  const chain=Math.exp(-warpedDistance*warpedDistance/.012);
  const ridges=(1-Math.abs(noise('ridge-folds',d,11)*2-1));
  const landMask=Math.max(0,Math.min(1,land/.10));
  const mountain=chain*ridges*landMask;
  const hills=(noise('hills',d,17)-.5)*.075*landMask;
  let normalized=land*1.35+mountain*.53+hills;
  if(waterPolicy!=='ocean-drainage')normalized=.04+Math.max(0,normalized)*.9;
  const height=seaLevelMetres+reliefMetres*Math.max(-1,Math.min(1,normalized));
  return {heightMetres:height,continentalness,mountainness:mountain,
    ocean:waterPolicy==='ocean-drainage'&&height<seaLevelMetres,
    waterHeightMetres:waterPolicy==='ocean-drainage'&&height<seaLevelMetres?seaLevelMetres:null};
 }
 let macro;
 function drainage(){
  if(macro)return macro;
  // Integer cube keys provide shared topology; tangent each component produces native geometry.
  const graph=cubeSphereGraph(macroResolution);
  for(const q of graph.nodes)q.dir=normalize(q.cube.map(x=>{const u=x/macroResolution;return Math.abs(u)===1?u:Math.tan(u*Math.PI/4);}));
  if(waterPolicy!=='ocean-drainage')return macro={status:waterPolicy==='dry'?'dry-world':'endorheic-not-yet-solved',graph,version:SURFACE_VERSION,recipeId,drainageRecipeId};
  const flow=solvePlanetDrainage(graph,d=>sample(d).heightMetres,seaLevelMetres);
  const riverEdges=[];
  if(flow.status==='solved')for(let i=0;i<graph.nodes.length;i++){
   const p=flow.parent[i];
   if(p>=0&&flow.raw[i]>=seaLevelMetres&&flow.catchmentNodes[i]>=8)riverEdges.push({from:i,to:p,waterFromMetres:flow.level[i],waterToMetres:flow.level[p],catchmentNodes:flow.catchmentNodes[i]});
  }
  return macro={...flow,graph,riverEdges,version:SURFACE_VERSION,recipeId,drainageRecipeId,
   statusNote:'Coarse connected drainage graph only. Catchment counts are not equal-area discharge; filled nodes are not rendered lakes. No fine channel carving or local fluid simulation.'};
 }
 return Object.freeze({version:SURFACE_VERSION,recipeId,drainageRecipeId,projection,sample,
  sampleFace:(face,u,v)=>sample(direction(face,u,v)),drainage,
  provenance:'Native tangent geometry; adapted seeded continents/ranges. Source water eligibility enforced only for explicitly identified Bastion; other per-world material/hazard/biome composition not implemented.'});
}

