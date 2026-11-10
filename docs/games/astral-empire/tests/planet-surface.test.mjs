import assert from 'node:assert/strict';
import {createPlanetSurface} from '../engine/universe/planet-surface.mjs';
import {direction,project} from '../engine/universe/planet-projection.mjs';
const config={universalSeed:'1701',planetId:'test-planet',radiusMetres:6371000};
const a=createPlanetSurface(config),b=createPlanetSurface({...config,macroResolution:16});
let seamChecks=0;
for(let face=0;face<6;face++)for(let i=0;i<=64;i++)for(const [u,v] of [[-1,i/32-1],[1,i/32-1],[i/32-1,-1],[i/32-1,1]]){
 const d=direction(face,u,v),p=project(d),s=a.sampleFace(face,u,v),t=a.sampleFace(p.face,p.u,p.v);
 assert.ok(Math.abs(s.heightMetres-t.heightMetres)<1e-7);assert.equal(s.ocean,t.ocean);
 assert.deepEqual(a.sample(d),b.sample(d));seamChecks++;
}
let count=0;
const t=performance.now(),m=a.drainage();
assert.equal(m.graph.nodes.length,6*32*32+2);assert.equal(m.status,'solved');assert.strictEqual(a.drainage(),m);
for(let i=0;i<m.graph.nodes.length;i++){
 const p=m.parent[i];if(p>=0){assert.ok(m.rank[p]<m.rank[i]);assert.ok(m.level[p]<=m.level[i]);}
 assert.ok(m.raw[m.outlet[i]]<0);
 if(m.raw[i]<0)assert.equal(m.level[i],0);
 count++;
}
assert.ok(m.riverEdges.length>0);
const c=createPlanetSurface({...config,planetId:'different'});
assert.notEqual(a.sample([1,2,3]).heightMetres,c.sample([1,2,3]).heightMetres);
assert.throws(()=>createPlanetSurface({...config,sourcePreset:'emerald_bastion'}));
assert.equal(createPlanetSurface({...config,sourcePreset:'emerald_bastion',waterPolicy:'endorheic'}).drainage().status,'endorheic-not-yet-solved');
assert.throws(()=>createPlanetSurface({...config,terrainEligible:false}));
assert.throws(()=>createPlanetSurface({...config,radiusMetres:134217727}));
assert.throws(()=>createPlanetSurface({...config,macroResolution:1024}));
console.log(JSON.stringify({result:'PASS',seamChecks,nodes:count,rivers:m.riverEdges.length,oceanNodes:[...m.raw].filter(x=>x<0).length,macroMilliseconds:Math.round(performance.now()-t)}));

const {generateSurfacePreview}=await import('../engine/universe/surface-preview-data.mjs');
const renderConfig={...config,macroResolution:8};
const mesh=generateSurfacePreview(renderConfig,16);
assert.equal(mesh.indices.length,6*16*16*6);
assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.normals.every(Number.isFinite));
assert.ok(mesh.colors.every(x=>x>=0&&x<=1));
assert.deepEqual(mesh,generateSurfacePreview(renderConfig,16));
assert.throws(()=>generateSurfacePreview(renderConfig,128));
assert.throws(()=>generateSurfacePreview({...renderConfig,terrainEligible:false},8));
assert.throws(()=>generateSurfacePreview({...renderConfig,sourcePreset:'emerald_bastion'},8));
console.log('Surface preview buffers, determinism, source eligibility and budget PASS');

assert.equal(a.recipeId,b.recipeId);assert.notEqual(a.drainageRecipeId,b.drainageRecipeId);assert.equal(a.drainage().drainageRecipeId,a.drainageRecipeId);
