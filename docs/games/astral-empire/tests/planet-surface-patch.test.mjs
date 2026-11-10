import assert from 'node:assert/strict';
import {createPlanetProjection,direction,project} from '../engine/universe/planet-projection.mjs';
import {buildPlanetSurfacePatch} from '../engine/universe/planet-surface-patch.mjs';
const projection=createPlanetProjection({radiusMetres:131000000,minAltitudeMetres:-512,maxAltitudeMetres:256});
const sample=d=>({heightMetres:100*d[0]*d[1]+80*d[2]});
const make=o=>buildPlanetSurfacePatch({projection,sample,face:4,resolution:16,...o});
const camera=projection.position(4,0,0,0);
const a=make({level:20,x:2**19,y:2**19,camera}),b=make({level:20,x:2**19+1,y:2**19,camera});
for(let j=0;j<=16;j++)for(let k=0;k<3;k++)assert.equal(a.positions[(j*17+16)*3+k],b.positions[j*17*3+k]);
assert.deepEqual(a,make({level:20,x:2**19,y:2**19,camera}));
assert.ok(Math.max(...a.positions)<500);assert.equal(a.triangles,512);
// Every cross-face boundary point resolves to the same global field sample.
for(let f=0;f<6;f++)for(let i=0;i<=16;i++)for(const [u,v] of [[-1,i/8-1],[1,i/8-1],[i/8-1,-1],[i/8-1,1]]){
 const d=direction(f,u,v),p=project(d),r=direction(p.face,p.u,p.v);
 assert.ok(Math.abs(sample(d).heightMetres-sample(r).heightMetres)<1e-10);
}
assert.throws(()=>make({resolution:128}));assert.throws(()=>make({sample:()=>({heightMetres:257})}));
assert.throws(()=>make({sample:()=>({heightMetres:NaN})}));
console.log('Planet surface patch camera-relative/shared-edge/budget checks PASS');
