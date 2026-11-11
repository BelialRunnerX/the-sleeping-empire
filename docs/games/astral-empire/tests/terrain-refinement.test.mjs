import test from 'node:test';import assert from 'node:assert/strict';
import {TerrainVolume} from '../engine/terrain-volume.mjs';
import {surfaceRefinements,meshAdaptiveTerrain} from '../engine/terrain-adaptive.mjs';
const bounds={min:[-1,-1,-1],max:[1,1,1]};
function volume(field){return new TerrainVolume({realms:{}},'bastion',field);}
function compare(v){const optimized=surfaceRefinements(v,bounds),reference=surfaceRefinements({blockData:p=>v.blockData(p)},bounds);assert.deepEqual(optimized,reference);assert.deepEqual(meshAdaptiveTerrain(v,bounds,optimized),meshAdaptiveTerrain(v,bounds,reference));}
test('uniform shortcut preserves empty, full and mixed fields and mesh bytes',()=>{
 for(const field of [()=>-1,()=>1,(x,y,z)=>.13-y,(x,y,z)=>Math.sin(x*5)+Math.sin(y*3)+Math.cos(z*2)])compare(volume(field));
});
test('uniform classification updates after edits, removed edits and transaction commits',()=>{
 const v=volume(()=>1);assert.equal(v.blockIsUniform([0,0,0]),true);v.set([0,0,0],0);assert.equal(v.blockIsUniform([0,0,0]),false);compare(v);
 v.set([0,0,0],1);assert.equal(v.blockIsUniform([0,0,0]),true);compare(v);
 const c=v.fork();c.fillBlock([-1,0,0],0);v.commitFrom(c);assert.equal(v.blockIsUniform([-1,0,0]),true);compare(v);
});
