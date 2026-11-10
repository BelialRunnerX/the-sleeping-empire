/**
 * Experimental coarse, piecewise-linear planetary hydrology.
 * Uses a SINGLE solved macro graph for terrain, flat lakes and connected carved channels.
 * It intentionally replaces fine scalar relief with macro interpolation; not a gameplay migration.
 */
import {solvePlanetDrainage} from './cube-sphere-graph.mjs';
export const CARVING_VERSION='planetary-macro-carving-v1';
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),mix=(a,b,t)=>a+(b-a)*t;
const norm=a=>{const l=Math.hypot(...a);if(!l||a.length!==3||!a.every(Number.isFinite))throw Error('Finite direction required');return a.map(x=>x/l);};
export function createMacroCarving(surface,{channelWidthMetres=40,channelDepthMetres=6,seaLevelMetres=0}={}){
 const original=surface.drainage();
 if(original.status!=='solved')throw Error('Solved ocean-connected drainage required');
 const g={...original.graph,neighbors:original.graph.neighbors.map(a=>[...a])},n=g.n,R=surface.projection.scale.radiusMetres;
 // The flood solver MUST see the exact triangle connectivity used by interpolation.
 for(const face of g.faces)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const a=face[y*(n+1)+x],b=face[(y+1)*(n+1)+x+1];
  if(!g.neighbors[a].includes(b))g.neighbors[a].push(b);
  if(!g.neighbors[b].includes(a))g.neighbors[b].push(a);
 }
 g.neighbors.forEach(a=>a.sort((x,y)=>x-y));
 let rawIndex=0;const flow=solvePlanetDrainage(g,()=>original.raw[rawIndex++],seaLevelMetres);flow.graph=g;
 flow.riverEdges=[];
 for(let i=0;i<g.nodes.length;i++)if(flow.parent[i]>=0&&flow.raw[i]>=seaLevelMetres&&flow.catchmentNodes[i]>=8)
  flow.riverEdges.push({from:i,to:flow.parent[i],waterFromMetres:flow.level[i],waterToMetres:flow.level[flow.parent[i]],catchmentNodes:flow.catchmentNodes[i]});
 if(![channelWidthMetres,channelDepthMetres,seaLevelMetres].every(Number.isFinite)||channelWidthMetres<=0||channelDepthMetres<=0||channelWidthMetres>R/(n*8))throw Error('Invalid bounded channel dimensions');
 const incident=Array.from(g.nodes,()=>[]),edges=flow.riverEdges.map(e=>{
  const a=g.nodes[e.from].dir,b=g.nodes[e.to].dir,ab=b.map((x,i)=>x-a[i]);return {...e,a,b,ab,ab2:dot(ab,ab)};
 });
 edges.forEach((e,i)=>{incident[e.from].push(i);incident[e.to].push(i);});
 const recipeId=JSON.stringify([CARVING_VERSION,surface.recipeId,n,channelWidthMetres,channelDepthMetres,seaLevelMetres]);
 function triangle(dir){
  const d=norm(dir),abs=d.map(Math.abs);let axis=abs[0]>=abs[1]&&abs[0]>=abs[2]?0:abs[1]>=abs[2]?1:2;
  const sign=d[axis]>=0?1:-1,face=axis*2+(sign>0?1:0),a=(axis+1)%3,b=(axis+2)%3;
  const uv=[a,b].map(k=>Math.atan(d[k]/abs[axis])*4/Math.PI);
  const p=uv.map(t=>Math.max(0,Math.min(n,(t+1)*n/2))),i=Math.min(n-1,Math.floor(p[0])),j=Math.min(n-1,Math.floor(p[1])),x=p[0]-i,y=p[1]-j;
  const f=g.faces[face],v00=f[j*(n+1)+i],v10=f[j*(n+1)+i+1],v01=f[(j+1)*(n+1)+i],v11=f[(j+1)*(n+1)+i+1];
  return {d,ids:y<=x?[v00,v10,v11]:[v00,v11,v01],weights:y<=x?[1-x,x-y,y]:[1-y,x,y-x],quad:[v00,v10,v01,v11]};
 }
 function sample(dir){
  const t=triangle(dir),base=t.ids.reduce((s,id,i)=>s+flow.raw[id]*t.weights[i],0);
  let height=base,water=base<seaLevelMetres?seaLevelMetres:null,kind=water===null?null:'ocean';
  // Standing water takes a flooded vertex's EXACT basin spill level, never interpolated with dry heights.
  const levels=[...new Set(t.ids.filter(id=>flow.raw[id]<flow.level[id]-1e-9).map(id=>flow.level[id]))].sort((a,b)=>a-b);
  for(const level of levels)if(base<level&&level>seaLevelMetres){water=level;kind='lake';break;}
  const candidates=new Set(t.quad.flatMap(id=>incident[id]));let selected=null;
  for(const index of candidates){
   const e=edges[index],normal=norm(cross(e.a,e.b));
   let closest=norm(t.d.map((x,i)=>x-dot(t.d,normal)*normal[i]));
   const total=Math.atan2(Math.hypot(...cross(e.a,e.b)),dot(e.a,e.b)),angle=Math.atan2(dot(cross(e.a,closest),normal),dot(e.a,closest));
   if(angle<0||angle>total)closest=dot(t.d,e.a)>dot(t.d,e.b)?e.a:e.b;
   const distance=Math.hypot(...t.d.map((x,i)=>x-closest[i]))*R;
   if(distance>=channelWidthMetres)continue;
   // Reconstruct the edge's face-grid parameter, so stage agrees with linear terrain at dry endpoints/edges.
   const ca=g.nodes[e.from].cube,cb=g.nodes[e.to].cube,vary=ca.findIndex((x,i)=>x!==cb[i]),fixed=ca.findIndex((x,i)=>i!==vary&&Math.abs(x)===n);
   const edgeUv=Math.atan(closest[vary]/Math.abs(closest[fixed]))*4/Math.PI;
   const u=Math.max(0,Math.min(1,(edgeUv*n-ca[vary])/(cb[vary]-ca[vary])));
   const stage=mix(e.waterFromMetres,e.waterToMetres,u),shape=(1-(distance/channelWidthMetres)**2)**2;
   // Fade the terrain edit itself to zero at the bank, not merely the depth below stage.
   const bed=mix(base,Math.min(base,stage-channelDepthMetres),shape);
   height=Math.min(height,bed);
   if(height<stage&&(water===null||stage>water)){water=stage;kind='river';selected=index;}
  }
  return {heightMetres:height,waterHeightMetres:water,waterKind:kind,baseHeightMetres:base,channelEdge:selected};
 }
 return Object.freeze({version:CARVING_VERSION,recipeId,sample,edges,flow,nodeCount:g.nodes.length,
  scope:'Coarse macro terrain plus carved channels/flat lakes; no fine relief, editable voxel collision or travel',
  maxCandidatesPerSample:Math.max(...incident.map(x=>x.length))*4});
}
