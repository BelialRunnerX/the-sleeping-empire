import test from 'node:test';
import assert from 'node:assert/strict';
import {compileFieldProgram,CORE_FIELD_DATA} from '../engine/universe/field-program.mjs';
import {normalizeGeology,coreDeposits,adoptCoreFields,CORE_FIELD_RECIPE,CORE_DRILL} from '../engine/geology-field.mjs';
const data={a:{layers:[{scale:32,weight:2},{scale:1,weight:1}]},b:{layers:[{scale:4,weight:1}],modulateBy:'a'}};
test('fields repeat, stay bounded and preserve exact distant identity',()=>{
 const a=compileFieldProgram('seed','realm',data),b=compileFieldProgram('seed','realm',data);
 for(const cell of [[0,0,0],[-32,-1,1],['999999999999999999',0,0]]){const v=a.sample(cell,[.25,.5,.75]);assert.deepEqual(v,b.sample(cell,[.25,.5,.75]));assert.ok(v.a>=0&&v.a<=1&&v.b>=0&&v.b<=v.a);}
 assert.notDeepEqual(a.sample(['9007199254740992',0,0]),a.sample(['9007199254740993',0,0]));
 assert.throws(()=>a.sample([Number.MAX_SAFE_INTEGER+1,0,0]));
});
test('field additions and enumeration order do not perturb existing streams; input is snapshotted',()=>{
 const defs=structuredClone(data),a=compileFieldProgram('s','scope',defs),b=compileFieldProgram('s','scope',{c:{layers:[{scale:1,weight:1}]},...data});
 const before=a.sample([-5,2,1]);defs.a.layers[0].scale=99;assert.deepEqual(before,a.sample([-5,2,1]));
 assert.deepEqual(before,b.sample([-5,2,1],[0,0,0],['a','b']));
 assert.equal(a.recipeId,compileFieldProgram('s','scope',{b:data.b,a:data.a}).recipeId);
});
test('continuous boundaries and invalid programs',()=>{
 const a=compileFieldProgram('s','r',data);assert.deepEqual(a.sample([-1,0,0],[1,.3,.2]),a.sample([0,0,0],[0,.3,.2]));
 for(const bad of [{},{a:{layers:[]}},{a:{layers:[{scale:0,weight:1}]}},{a:{...data.a,modulateBy:'missing'}},{a:{...data.a,modulateBy:'a'}}])assert.throws(()=>compileFieldProgram('s','r',bad));
 assert.throws(()=>a.sample([0,0,0],[NaN,0,0]));assert.throws(()=>a.sample([0,0,0],[0,0,0],['missing']));
});
test('playable extraction field recipe preserves legacy depletion and future identities',()=>{
 const state={seed:123,realm:'bastion',position:{x:CORE_DRILL.x,z:CORE_DRILL.z},geology:normalizeGeology({},123)};
 const original=coreDeposits(state);assert.ok(original.length);state.geology.mined=[original[0].id];assert.ok(adoptCoreFields(state));assert.equal(state.geology.fieldRecipe,CORE_FIELD_RECIPE);
 const filtered=coreDeposits(state);assert.ok(filtered.every(d=>original.some(o=>o.id===d.id)));assert.ok(!filtered.some(d=>d.id===original[0].id));assert.equal(adoptCoreFields(state),false);
 const restored=normalizeGeology(JSON.parse(JSON.stringify(state.geology)),123);assert.deepEqual(restored.mined,state.geology.mined);assert.equal(restored.fieldRecipe,CORE_FIELD_RECIPE);
 state.geology=normalizeGeology({...restored,fieldRecipe:'future-v8'},123);assert.equal(state.geology.fieldRecipe,'future-v8');assert.deepEqual(coreDeposits(state),[]);assert.equal(adoptCoreFields(state),false);
});

test('candidate ownership is independent of adjacent query partitions',async()=>{
 const {sampleFieldCandidates}=await import('../engine/universe/field-program.mjs');
 const p=compileFieldProgram('candidate','realm',data),query=(min,size)=>sampleFieldCandidates(p,{field:'a',min,size,threshold:0});
 const all=query([-4,0,0],[8,2,2]),parts=[...query([-4,0,0],[4,2,2]),...query([0,0,0],[4,2,2])];
 const sort=a=>a.sort((x,y)=>x.cell.join(',').localeCompare(y.cell.join(',')));
 assert.deepEqual(sort(all),sort(parts));assert.throws(()=>query([0,0,0],[9,1,1]));
});
