import assert from 'node:assert/strict';
import {createPlanetSurface} from '../engine/universe/planet-surface.mjs';
import {createMacroCarving} from '../engine/universe/planet-carving.mjs';
import {direction,project} from '../engine/universe/planet-projection.mjs';
const s=createPlanetSurface({universalSeed:'1701',planetId:'carving-fixture',radiusMetres:6371000,macroResolution:16});
const c=createMacroCarving(s),f=c.flow;let checks=0,wet=0;
for(let face=0;face<6;face++)for(let i=0;i<=32;i++)for(const [u,v] of [[-1,i/16-1],[1,i/16-1],[i/16-1,-1],[i/16-1,1]]){
 const d=direction(face,u,v),p=project(d),a=c.sample(d),b=c.sample(direction(p.face,p.u,p.v));
 assert.ok(Math.abs(a.heightMetres-b.heightMetres)<1e-6);
 if(a.waterHeightMetres!==null&&b.waterHeightMetres!==null)assert.ok(Math.abs(a.waterHeightMetres-b.waterHeightMetres)<1e-6);
 checks++;
}
let slopes=0,maxRise=0;
for(const e of c.edges){
 let prev=Infinity;
 for(let j=0;j<=16;j++){
 const t=j/16,d=e.a.map((x,i)=>x+(e.b[i]-x)*t),a=c.sample(d);
 assert.ok(a.waterHeightMetres!==null);assert.ok(a.heightMetres<a.waterHeightMetres);
 maxRise=Math.max(maxRise,a.waterHeightMetres-prev);prev=a.waterHeightMetres;wet++;
 }
}
for(let i=0;i<f.graph.nodes.length;i++){const a=c.sample(f.graph.nodes[i].dir);if(a.waterKind==='lake'){assert.equal(a.waterHeightMetres,f.level[i]);slopes++;}}
console.log({checks,wet,lakeNodes:slopes,riverEdges:c.edges.length,maxRise,maxCandidates:c.maxCandidatesPerSample});
assert.ok(maxRise<1e-6,'Centerline stage must not rise downstream');

