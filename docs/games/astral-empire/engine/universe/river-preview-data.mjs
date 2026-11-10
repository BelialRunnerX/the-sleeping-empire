import {createPlanetSurface} from './planet-surface.mjs';
import {createMacroCarving} from './planet-carving.mjs';
export const RIVER_PREVIEW_VERSION='bounded-river-mesh-v1';
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
// Bounded inspection only. Coordinates stay camera-relative before Float32 upload.
export function generateRiverPreview(parameters,{resolution=64,spanMetres=640}={}){
 if(!Number.isInteger(resolution)||resolution<8||resolution>64||!Number.isFinite(spanMetres)||spanMetres<160||spanMetres>1280)throw Error('Invalid bounded river mesh budget');
 const surface=createPlanetSurface(parameters),R=surface.projection.scale.radiusMetres;
 const channelWidthMetres=Math.min(40,R/(parameters.macroResolution||32)/16);
 const carving=createMacroCarving(surface,{channelWidthMetres,channelDepthMetres:Math.min(6,channelWidthMetres*.15)});
 // Select a genuine wet river midpoint, preferring a flowing reach over lake/ocean.
 const candidates=carving.edges.map((e,index)=>{const dir=norm(e.a.map((v,i)=>v+e.b[i]));return {e,index,dir,sample:carving.sample(dir)};});
 const reach=candidates.find(q=>q.sample.waterKind==='river'&&Math.abs(carving.flow.raw[q.e.from]-carving.flow.level[q.e.from])<1e-6&&Math.abs(carving.flow.raw[q.e.to]-carving.flow.level[q.e.to])<1e-6&&Math.abs(q.sample.waterHeightMetres-q.sample.baseHeightMetres)<1e-6);
 if(!reach)throw Error('No unflooded river reach in this bounded planetary study');
 const up=reach.dir,along=norm(reach.e.b.map((v,i)=>v-dot(reach.e.b,up)*up[i])),right=norm(cross(along,up));
 const originHeight=reach.sample.waterHeightMetres,positions=[],colors=[],indices=[],samples=[],waterPositions=[],waterIndices=[];
 for(let j=0;j<=resolution;j++)for(let i=0;i<=resolution;i++){
  const x=(i/resolution-.5)*spanMetres,z=(j/resolution-.5)*spanMetres;
  const dir=norm(up.map((v,k)=>v*R+right[k]*x+along[k]*z)),s=carving.sample(dir);
  // Physical local tangent geometry: includes curvature; no hidden height exaggeration.
  const point=dir.map(v=>v*(R+s.heightMetres));
  const p=[dot(point,right),dot(point,up)-(R+originHeight),dot(point,along)];
  positions.push(...p);const wet=s.waterHeightMetres!==null;
  colors.push(...(wet?[.32,.32,.23]:[.39,.49,.29]));
  samples.push({p,depth:wet?s.waterHeightMetres-s.heightMetres:0,waterY:0});
  samples.at(-1).waterY=wet?dot(dir.map(v=>v*(R+s.waterHeightMetres)),up)-(R+originHeight):p[1];
 }
 function waterTriangle(ids){
  let poly=ids.map(i=>samples[i]);const wet=poly.filter(v=>v.depth>1e-8);if(!wet.length)return;
  const stage=wet.reduce((sum,v)=>sum+v.waterY,0)/wet.length;
  poly=poly.map(v=>v.depth>1e-8?v:{...v,waterY:stage,depth:Math.min(0,stage-v.p[1])});const clipped=[];
  // Clip each triangle to positive sampled water depth. Dry vertices use an extrapolated local stage; shoreline is a bounded sampled approximation.
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ain=a.depth>1e-8,bin=b.depth>1e-8;
   if(ain)clipped.push(a);
   if(ain!==bin){const t=a.depth/(a.depth-b.depth);clipped.push({p:a.p.map((v,k)=>v+(b.p[k]-v)*t),waterY:a.waterY+(b.waterY-a.waterY)*t,depth:0});}
  }
  if(clipped.length<3)return;const start=waterPositions.length/3;
  for(const v of clipped)waterPositions.push(v.p[0],v.waterY+.015,v.p[2]);
  for(let i=1;i<clipped.length-1;i++)waterIndices.push(start,start+i,start+i+1);
 }
 for(let j=0;j<resolution;j++)for(let i=0;i<resolution;i++){
  const a=j*(resolution+1)+i,b=a+1,c=a+resolution+1,d=c+1;
  for(const tri of [[a,c,d],[a,d,b]]){indices.push(...tri);waterTriangle(tri);}
 }
 const triCount=(indices.length+waterIndices.length)/3;
 if(triCount>32768)throw Error('River mesh triangle budget exceeded');
 return {terrain:{positions:new Float32Array(positions),colors:new Float32Array(colors),indices:new Uint32Array(indices)},water:{positions:new Float32Array(waterPositions),indices:new Uint32Array(waterIndices)},spanMetres,resolution,triangleCount:triCount,reachIndex:reach.index,recipeId:JSON.stringify([RIVER_PREVIEW_VERSION,carving.recipeId,resolution,spanMetres]),description:`${spanMetres} m local river study; ${triCount.toLocaleString()} triangles. Unflooded coarse channel only; flooded basin transitions, playable terrain, fine catchments and fluid simulation remain pending.`};
}




