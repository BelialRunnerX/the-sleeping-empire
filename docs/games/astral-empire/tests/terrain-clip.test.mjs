import assert from 'node:assert/strict';import {subtractAABB,subtractAABBUnion,dirtyBlockBoxes} from '../engine/terrain-clip.mjs';
const normal=([a,b,c])=>{const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
const area=t=>Math.hypot(...normal(t))/2;const sum=ts=>ts.reduce((s,t)=>s+area(t),0);
const box={min:[0,0,0],max:[1,1,1]};const attr=([x,y,z])=>[x,y,z,2*x+3*y-z,x-4*z];
const inside=[[.1,.1,.5],[.9,.1,.5],[.1,.9,.5]].map(attr);assert.equal(subtractAABB(inside,box).length,0);
const crossing=[[-2,-2,.5],[4,-2,.5],[-2,4,.5]].map(attr);assert.equal(sum(subtractAABB(crossing,box)),17);
for(const z of [0,1])assert.equal(subtractAABB([[0,0,z],[1,0,z],[0,1,z]],box).length,0);
const touch=[[-1,0,0],[0,0,0],[0,-1,0]];assert.equal(sum(subtractAABB(touch,box)),.5);
assert.equal(subtractAABB([[0,0,0],[0,0,0],[1,1,1]],box).length,0);
const clone=JSON.stringify(crossing);subtractAABB(crossing,box);assert.equal(JSON.stringify(crossing),clone);
let seed=1;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
for(let i=0;i<10000;i++){
 const tri=Array.from({length:3},()=>attr([rand()*4-1.5,rand()*4-1.5,rand()*4-1.5])),base=normal(tri),out=subtractAABB(tri,box);
 assert.ok(sum(out)<=area(tri)+1e-10);
 for(const t of out){assert.ok(area(t)>0);assert.ok(normal(t).reduce((s,n,j)=>s+n*base[j],0)>0);
 const c=[0,1,2].map(j=>(t[0][j]+t[1][j]+t[2][j])/3);assert.ok(!c.every(v=>v>1e-10&&v<1-1e-10));
 for(const p of t){assert.ok(Math.abs(p[3]-(2*p[0]+3*p[1]-p[2]))<1e-10);assert.ok(Math.abs(p[4]-(p[0]-4*p[2]))<1e-10);}
 }
 const duplicate=subtractAABBUnion([tri],[box,box]);assert.ok(Math.abs(sum(out)-sum(duplicate))<1e-9);
}
const floor=[];for(let z=-100;z<100;z++)for(let x=-100;x<100;x++){const a=attr([x,.5,z]),b=attr([x+1,.5,z]),c=attr([x+1,.5,z+1]),d=attr([x,.5,z+1]);floor.push([a,b,c],[a,c,d]);}
const start=performance.now(),result=subtractAABBUnion(floor,dirtyBlockBoxes([0,0,0]));console.log({tests:'10000 randomized + edge/coplanar/attributes/union',input:floor.length,output:result.length,ms:performance.now()-start});
assert.equal(sum(floor)-sum(result),5);
