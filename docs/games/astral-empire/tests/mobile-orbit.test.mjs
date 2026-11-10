import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {CameraRig,CAMERA_HOME} from '../engine/camera.mjs';
const source=readFileSync(new URL('../engine/app.mjs',import.meta.url),'utf8').replace(/\r/g,'');
const handler=source.match(/document.addEventListener\('aether-touch-camera',e=>\{([\s\S]*?)\n\}\);/)[1];
const rig=new CameraRig();
const run=(x,y)=>vm.runInNewContext(`(function(){${handler}})()`,{view:{rig},playing:true,panel:null,e:{detail:{x,y,dt:.05}}});
const home={...rig.goal};run(-1,0);assert.ok(rig.goal.yaw<home.yaw);assert.deepEqual(rig.pan,{x:0,z:0});assert.equal(rig.goal.distance,home.distance);
run(1,0);assert.ok(Math.abs(rig.goal.yaw-home.yaw)<1e-9);run(0,-1);assert.ok(rig.goal.distance<home.distance);run(0,1);assert.ok(Math.abs(rig.goal.distance-home.distance)<1e-9);assert.deepEqual(CAMERA_HOME,home);
const enemy={id:'enemy'};
assert.match(source,/action==='autoTarget'\) toggleAssist\('autoTarget'\)/);
assert.match(source,/view.rig.orbit\(pad.look.x\*2.45\*step,0\)/);
assert.match(source,/view.rig.zoom\(Math.exp\(pad.look.y\*1.45\*step\)\)/);
console.log('PASS actual CameraRig mobile orbit/zoom; controller uses same direction and R3 shared Q toggle');

const end=source.match(/function endPointer\(e\) \{([\s\S]*?)\n\}\nfor \(const type/)[1];
const selected={type:'node',x:3,z:0},calls=[];
const tap={pointers:new Map(),view:{pickEnemy:()=>null,pick:()=>selected},playing:true,panel:null,sim:{locked:null},notify:()=>{},cancelTravel:()=>{},startGather:t=>calls.push(t),beginTravel:()=>calls.push('travel'),saveCamera:()=>{},holdingAttack:false};
const finish=(ms=100,moved=false,type='pointerup',mode='touch')=>{tap.pointers.set(1,{mode,startedAt:0,moved});vm.runInNewContext(`(function(e){${end}})({pointerId:1,timeStamp:${ms},type:'${type}',clientX:1,clientY:1})`,tap);};
finish();assert.equal(calls.pop(),selected);finish(600);finish(100,true);finish(100,false,'pointercancel');assert.deepEqual(calls,[]);
tap.view.pick=()=>({x:1,z:1});finish();assert.equal(calls.pop(),'travel');tap.view.pickEnemy=()=>enemy;finish();assert.equal(tap.sim.locked,enemy);
// Use the actual normal interaction reach guard, not a separate touch radius.
const reach=source.match(/function startGather\(target = nearestInteraction\(\)\) \{([\s\S]*?)  if \(!combatSafe\(\)\)/)[1];
const inReach=t=>vm.runInNewContext(`(function(target){${reach};return true;})(target)`,{target:t,playing:true,panel:null,cancelTravel:()=>{},sim:{player:{x:0,z:0}}});
assert.equal(inReach({type:'node',x:4,z:0}),true);assert.equal(inReach({type:'node',x:4.01,z:0}),undefined);assert.equal(inReach({type:'feature',x:3.4,z:0}),true);assert.equal(inReach({type:'feature',x:3.41,z:0}),undefined);
console.log('PASS contextual touch exact picked object, empty ground travel, enemy lock, drag/cancel/longpress suppression, normal4/3.4 reach');

tap.view.pickEnemy=()=>null;tap.view.pick=()=>selected;finish(100,false,'pointerup','tap');assert.equal(calls.pop(),selected);tap.view.pick=()=>({x:1,z:1});finish(100,false,'pointerup','tap');assert.equal(calls.pop(),'travel');finish(600,false,'pointerup','tap');assert.deepEqual(calls,[]);console.log('PASS desktop contextual object click and emptyground travel; longpress ignored');

const touchGuard=source.match(/document.addEventListener\('pointerdown',e=>\{([\s\S]*?)\},true\);/)[1];
const gestures={activeTouchPointers:new Set([11]),pointers:new Map([[11,{moved:false}]])};vm.runInNewContext(`(function(e){${touchGuard}})({pointerType:'touch',pointerId:12})`,gestures);assert.equal(gestures.pointers.get(11).moved,true);assert.equal(gestures.activeTouchPointers.size,2);assert.match(source,/moved: mode === "touch" && activeTouchPointers.size > 1/);console.log('PASS shared UI/canvas touch guard suppresses simultaneous joystick and multi-finger taps');
