import assert from 'node:assert/strict';
import {createPlanetProjection,direction,project} from '../engine/universe/planet-projection.mjs';
import {createResourceHierarchy} from '../engine/universe/resource-hierarchy.mjs';
let checks=0;
const near=(a,b)=>{assert.ok(Math.abs(a-b)<1e-9);checks++;};
for(let f=0;f<6;f++)for(let i=0;i<=32;i++)for(let j=0;j<=32;j++){
 const d=direction(f,i/16-1,j/16-1),p=project(d),r=direction(p.face,p.u,p.v);
 d.forEach((x,k)=>near(x,r[k]));
}
for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])assert.equal(project([x,y,z]).face,x>0?0:1);
for(const radius of [1200,6400,6371000,131000000,134000000]){
 const p=createPlanetProjection({radiusMetres:radius,minAltitudeMetres:-512,maxAltitudeMetres:256});
 for(let face=0;face<6;face++){
  const a=p.address(direction(face,.2,-.3));assert.ok(a.iu< p.microResolution);assert.equal(a.chunkU*512+a.localU,a.iu);
  assert.ok(Math.abs(a.centeredU)<2147483648);
  const root=p.patch(face,0,0,0),left=p.patch(face,1,0,0),right=p.patch(face,1,1,0);
  left.corners[1].forEach((v,i)=>near(v,right.corners[0][i]));
  assert.equal(root.corners.length,4);
 }
}
assert.throws(()=>createPlanetProjection({radiusMetres:134217728,minAltitudeMetres:0,maxAltitudeMetres:0}));
const r=createResourceHierarchy('1701'),cell=[-999999999999999999999n,-1n,42n];
near(r.broad('x',cell,[1,.4,.6]),r.broad('x',[cell[0]+1n,cell[1],cell[2]],[0,.4,.6]));
const s={id:'s',cell,offset:[.4,.5,.6]},p={id:'p',systemId:'s',localPosition:[-1.2,2.3,.4]},ids=['minecraft:raw_iron','minecraft:raw_copper'];
const a=r.sample(s,p,ids),b=r.sample(s,p,[...ids,'elysiumores:raw_cobalt']);
assert.deepEqual(a.resources[ids[0]],b.resources[ids[0]]);
assert.deepEqual(a,r.sample(s,p,ids));
assert.notDeepEqual(a.resources,r.sample(s,{...p,id:'p2'},ids).resources);
const zero=createResourceHierarchy('1701',{localWeight:0}).sample(s,p,ids);
for(const v of Object.values(zero.resources)){near(v.galactic,v.system);near(v.system,v.planet);}
for(const v of Object.values(a.resources))for(const x of Object.values(v))assert.ok(x>=0&&x<=1);
assert.throws(()=>r.sample(s,{...p,systemId:'other'},ids));
assert.throws(()=>r.broad('x',[Number.MAX_SAFE_INTEGER+1,0,0],[0,0,0]));
console.log('PASS native projection roundtrips, edge/corner owner, patch adjacency, huge radii, wide indices, resource inheritance/seams/identity; numeric checks='+checks);

import {sphereGeometry,previewResolution} from '../engine/universe/planet-preview.mjs';
for(const n of [8,16,32,64]){const g=sphereGeometry(n),p=g.attributes.position.array,idx=g.index.array;assert.equal(idx.length/3,12*n*n);for(let i=0;i<idx.length;i+=3){const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;const u=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],v=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert(cross.reduce((sum,x,k)=>sum+x*p[a+k],0)>0);}g.dispose();}assert.throws(()=>sphereGeometry(128));assert(previewResolution(1.15,280)>=previewResolution(12,280));console.log('Bounded sphere mesh outward faces and LOD PASS');
