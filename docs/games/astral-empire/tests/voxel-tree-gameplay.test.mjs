import test from 'node:test';import assert from 'node:assert/strict';
import {generateTree} from '../engine/voxel-trees/voxel-trees.mjs';
import {fellGameTree,normalizeTreeLedger,treeBoxCollision} from '../engine/voxel-trees/tree-gameplay.mjs';
import {freshState,migrateState,gather} from '../engine/simulation.mjs';
const tree=generateTree({seed:'test',anchorMicro:[0,0,0],species:'oak',biomeId:'test',sourceFeature:'test'});
test('actual gathering pays finite wood volume plus explicit build bonuses and persists permanent felling',()=>{
 const s=freshState(123),node={id:'tree-test',kind:'tree',voxelManaged:true,voxelTree:tree};const before=s.resources.timber;
 const r=gather(s,node);assert.equal(r.ok,true);assert.ok(s.resources.timber>before);assert.equal(s.trees.felled[node.id].felled,true);
 const total=s.resources.timber,count=s.statistics.gathers;assert.equal(gather(s,node).ok,false);assert.equal(s.resources.timber,total);assert.equal(s.statistics.gathers,count);
 const reload=migrateState(JSON.parse(JSON.stringify(s)));assert.deepEqual(reload.trees,s.trees);assert.equal(gather(reload,node).ok,false);
});
test('unready generated trees do not pay or advance gathering; legacy save gets safe ledger',()=>{const s=freshState(2),before=JSON.stringify(s);assert.equal(gather(s,{id:'pending',kind:'tree',voxelManaged:true}).ok,false);assert.equal(JSON.stringify(s),before);assert.deepEqual(migrateState({version:3,seed:2}).trees,normalizeTreeLedger());});
test('fractional log volume pooled across trees and empty repeat remains idempotent',()=>{const s=freshState(3);for(let i=0;i<3;i++)assert.equal(fellGameTree(s,{id:'n'+i,voxelTree:tree}).ok,true);assert.ok(s.trees.timberMicroUnits>=0&&s.trees.timberMicroUnits<4096);const before=JSON.stringify(s);assert.equal(fellGameTree(s,{id:'n0',voxelTree:tree}).ok,false);assert.equal(JSON.stringify(s),before);});
test('collision uses actual woody voxel and felling removes it without phantom trunk',()=>{const c=tree.cells.find(c=>c.materialId.endsWith('_log'));const e={id:'n',tree,group:{position:{x:0,y:0,z:0}},mesh:{geometry:{boundingBox:{min:{x:-30,y:-30,z:-30},max:{x:30,y:30,z:30}}}}};const entries=new Map([['n',e]]),min=[c.x*tree.cellMicro/16+.01,c.y*tree.cellMicro/16+.01,c.z*tree.cellMicro/16+.01],max=min.map(n=>n+.1);assert.equal(treeBoxCollision(entries,{},min,max),true);assert.equal(treeBoxCollision(entries,{felled:{n:{felled:true}}},min,max),false);});

test('legacy v2 felled node stays suppressed after detail revision3',()=>{const s=freshState(7);s.trees.felled.old={treeId:'old-v2-identity',revision:2,felled:true};const restored=migrateState(JSON.parse(JSON.stringify(s)));assert.equal(fellGameTree(restored,{id:'old',voxelTree:tree}).ok,false);assert.equal(restored.trees.felled.old.revision,2);});
