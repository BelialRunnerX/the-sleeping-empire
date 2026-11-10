import test from 'node:test';
import assert from 'node:assert/strict';
import { createContinentalTerrain } from '../engine/continental-terrain.mjs';
test('continental adapter preserves sanctuary and translated water datum',()=>{
 const legacy=(x,z)=>Math.sin(x/40)*.5;
 const a=createContinentalTerrain(1701,legacy);
 for(let z=-150;z<=150;z+=10)for(let x=-150;x<=150;x+=10){if(Math.hypot(x,z)>=32)continue;assert.equal(a.height(x,z),legacy(x,z));assert.equal(a.sample(x,z).waterHeight,null);}
 for(const [x,z] of [[500,500],[50000,50000],[-50000,-50000]]){const s=a.sample(x,z),m=a.atlas.sample(x+a.anchor.x,z+a.anchor.z);assert.equal(s.height,m.height-a.anchor.height);assert.equal(s.waterHeight,m.waterHeight===null?null:m.waterHeight-a.anchor.height);}
 const b=createContinentalTerrain(1701,legacy,a.anchor);assert.equal(a.height(700,200),b.height(700,200));assert.equal(a.sourceVersion,b.sourceVersion);
});
test('continental transition is continuous and invalid anchors reject',()=>{
 const a=createContinentalTerrain(1,()=>0);
 for(const r of [32,96])assert(Math.abs(a.height(r-1e-5,0)-a.height(r+1e-5,0))<1e-3);
 assert.throws(()=>createContinentalTerrain(1,()=>0,{x:NaN,z:0,height:0}),/anchor/);
});
