import test from 'node:test';import assert from 'node:assert/strict';
import { createTerrainField } from '../engine/terrain-field.mjs';
test('continental field water and surface share datum and conservative voxel certificates',()=>{
 const f=createTerrainField(1701,'bastion',{version:2});
 assert.equal(f.generation.version,2);assert.equal(f.baseHeight(0,0),0);
 for(const [x,z] of [[0,0],[200,0],[700,200],[50000,50000]]){const h=f.baseHeight(x,z);assert(f(x,h+.01,z)<0);assert(f(x,h-.01,z)>0);assert(Math.abs(f.surfaceHeight(x,z)-h)<=1/16);}
 for(const bx of [0,170,700])for(const bz of [0,200]){const by=Math.floor(f.baseHeight(bx,bz));for(const y of [by-1,by,by+1]){const c=f.uniformBlock([bx,y,bz]);if(c===null)continue;for(let z=0;z<16;z++)for(let x=0;x<16;x++)for(const dy of [1/32,31/32])assert.equal(Number(f(bx+(x+.5)/16,y+dy,bz+(z+.5)/16)>0),c);}}
 const ocean=f.landform(50000,50000);assert(ocean.waterHeight>ocean.height);assert.equal(f.waterHeight(50000,50000),ocean.waterHeight);
});
test('legacy and non-water realm generation stays unchanged',()=>{const a=createTerrainField(42,'moon'),b=createTerrainField(42,'moon',{version:2});assert.equal(b.generation.version,1);for(const x of [0,170,500])for(const y of [-20,0,20])assert.equal(a(x,y,17),b(x,y,17));});
