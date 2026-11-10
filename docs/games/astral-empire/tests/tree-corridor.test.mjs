import test from 'node:test';import assert from 'node:assert/strict';
import {freshState,Simulation} from '../engine/simulation.mjs';
import {treeEcology} from '../engine/voxel-trees/tree-ecology.mjs';
import {generateTree} from '../engine/voxel-trees/voxel-trees.mjs';
import {generateTree as generateLegacyTree} from '../engine/voxel-trees/voxel-trees-v2.mjs';
import {generatePlacedTree,intersectsProtectedWood,sanctuaryTreeClearance} from '../engine/voxel-trees/tree-placement.mjs';
import {treeBoxCollision} from '../engine/voxel-trees/tree-gameplay.mjs';
function fixture(seed){const s=freshState(seed),sim=new Simulation(s),n=sim.layout.nodes.find(n=>n.kind==='tree'),y=sim.terrainVolume.field.surfaceHeight(n.x,n.z),ecology=treeEcology(seed,s.realm,n.x,n.z);return {s,sim,n,y,input:{seed:`${seed}:${s.realm}:${n.id}`,anchorMicro:[Math.round(n.x*4)*4,Math.round(y*4)*4,Math.round(n.z*4)*4],...ecology,biomeId:`browser:${s.realm}`,sourceFeature:'browser-adaptation:existing-node-placement',origin:[n.x,y,n.z],protectedBoxes:sanctuaryTreeClearance(sim.terrainVolume.field)}};}
test('CI92714 original acacia blocks authored corridor; admitted deterministic variant clears full body',()=>{const f=fixture(92714),original=generateLegacyTree(f.input),tree=generatePlacedTree(f.input);assert.equal(intersectsProtectedWood(original,f.input.origin,f.input.protectedBoxes),true);assert.equal(intersectsProtectedWood(tree,f.input.origin,f.input.protectedBoxes),false);assert.deepEqual(generatePlacedTree(f.input),tree);assert.notEqual(original.id,tree.id);
 const bounds={min:{x:-30,y:-5,z:-30},max:{x:30,y:40,z:30}},entries=new Map([[f.n.id,{id:f.n.id,tree,group:{position:{x:f.n.x,y:f.y,z:f.n.z}},mesh:{geometry:{boundingBox:bounds}}}]]);
 for(const z of [4,4.5,5])for(let x=-8;x<=7;x+=.25){const h=f.sim.groundHeight(x,z);assert.equal(treeBoxCollision(entries,{},[x-.3,h+.000001,z-.3],[x+.3,h+3,z+.3]),false,`${x},${z}`);}
 f.sim.treeOccupied=(min,max)=>treeBoxCollision(entries,{},min,max);Object.assign(f.sim.player,{x:-5.5,z:5,terrainY:f.sim.groundHeight(-5.5,5),y:0,velocityY:0});for(let i=0;i<130;i++)f.sim.movePlayer(.1,0,.05);assert.ok(f.sim.player.x>=7,'real swept body crosses foundry-to-alchemy route');
});
test('varied authored trees respect corridor envelope without blanket collision removal',()=>{for(const seed of [1,42,9372,12345,92714]){const f=fixture(seed),tree=generatePlacedTree(f.input);assert.equal(intersectsProtectedWood(tree,f.input.origin,f.input.protectedBoxes),false);assert.ok(tree.cells.some(c=>c.materialId.endsWith('_log')));}});
test('wild unprotected tree identity/geometry remains unchanged',()=>{const f=fixture(42);delete f.input.protectedBoxes;assert.deepEqual(generatePlacedTree(f.input),generateTree(f.input));});

test('extreme authored clearance falls back to connected pruned voxel data, not a disabled collision proxy',()=>{const f=fixture(92714);f.input.protectedBoxes=[{min:[-1000,f.y+.5,-1000],max:[1000,1000,1000]}];const t=generatePlacedTree(f.input);assert.match(t.id,/access-pruned-v1/);assert.equal(intersectsProtectedWood(t,f.input.origin,f.input.protectedBoxes),false);assert.ok(t.cells.some(c=>c.materialId.endsWith('_log')));});
