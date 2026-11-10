import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {updateCombatAssist} from '../engine/combat-assist.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ControllerInput,ControllerBuildHold,stick,controllerActions,controllerMenuDirection,targetInView} from '../engine/controller.mjs';
const hardware=(buttons=[],axes=[0,0,0,0],index=0)=>({connected:true,mapping:'standard',index,axes,buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))});
const read=(buttons)=>new ControllerInput().read([hardware(buttons)]);
test('Xbox actions map without obsolete aliases',()=>{for(const [button,action] of [[0,'jump'],[2,'interact'],[11,'autoTarget'],[12,'lance'],[15,'nova'],[13,'dash'],[14,'burst'],[9,'menu']])assert.deepEqual(controllerActions(read([button])),[action]);});
test('reserved B Y bumpers and F5 chord do nothing, including stagger/hold/release',()=>{const c=new ControllerInput();for(const b of [[1],[3],[4],[4,5],[4,5],[5],[],[5],[5,4],[]])assert.deepEqual(controllerActions(c.read([hardware(b)])),[]);});
test('RT holds attack, X only interacts on edge; release reconnect and unknown mapping',()=>{const c=new ControllerInput();let p=c.read([hardware([2,7])]);assert.deepEqual(controllerActions(p),['interact']);assert.ok(p.held.has(7));p=c.read([hardware([2,7])]);assert.deepEqual(controllerActions(p),[]);assert.ok(p.held.has(7));assert.equal(c.read([]),null);p=c.read([hardware([2],undefined,1)]);assert.deepEqual(controllerActions(p),['interact']);assert.equal(c.read([{...hardware(),mapping:''}]),null);});
test('menus consume controls and Start wins over gameplay simultaneous edges',()=>{assert.deepEqual(controllerActions(read([9,0,12])),['menu']);assert.deepEqual(controllerActions(read([0,12,7]),true),['select']);assert.deepEqual(controllerActions(read([1,0]),true),['close']);for(const button of [2,3,4,5,7,11,12,13,14,15])assert.deepEqual(controllerActions(read([button]),true),[]);});
test('radial deadzones, bounded diagonals, both menu axes',()=>{assert.deepEqual(stick(.1,.1),{x:0,y:0});assert.deepEqual(stick(NaN,0),{x:0,y:0});assert.ok(Math.abs(Math.hypot(...Object.values(stick(1,1)))-1)<1e-9);for(const [axes,expected] of [[[1,0,0,0],1],[[-1,0,0,0],-1],[[0,1,0,0],1],[[0,-1,0,0],-1]])assert.equal(controllerMenuDirection(new ControllerInput().read([hardware([],axes)])),expected);});
test('camera-forward targets exclude behind dead out-of-range or blocked',()=>{const front={x:0,z:-10,hp:2},side={x:2,z:-2,hp:2},back={x:0,z:1,hp:2};const sim={player:{x:0,z:0},enemies:[back,side,front]};assert.equal(targetInView(sim,0),front);front.hp=0;assert.equal(targetInView(sim,0),side);sim.combatVisible=()=>false;assert.equal(targetInView(sim,0),null);delete sim.combatVisible;assert.equal(targetInView(sim,Math.PI),back);});

test('B hold distinguishes tap, fires once, cancels on menu/blur/disconnect and rearms on release',()=>{
 const h=new ControllerBuildHold(), p=read([1]), neutral=read([]);
 assert.equal(h.update(p,0),false);assert.equal(h.update(neutral,100),false);
 assert.equal(h.update(p,200),false);assert.equal(h.update(p,699),false);assert.equal(h.update(p,700),true);assert.equal(h.update(p,2000),false);
 h.update(neutral,2100);h.update(p,2200);h.update(p,2300,false);assert.equal(h.update(p,4000,true),false);
 h.update(neutral,4100);h.update(p,4200);h.update(null,4300);assert.equal(h.update(p,5000),false);
 h.update(neutral,5100);h.update(p,5200);assert.equal(h.update(p,5700),true);
});

test('shared Q/R3 toggle persists and clears target; aim-selector never falls back behind',()=>{
 const source=readFileSync(new URL('../engine/app.mjs',import.meta.url),'utf8');
 const body=source.match(/function toggleAssist\(key\)\{([^\n]*)\}/)[1];
 const enemy={hp:10,x:0,z:-1};const context={key:'autoTarget',assist:{autoTarget:false,autoFire:true},controllerTargetSuppressed:true,sim:{locked:null},view:{yaw:0},targetInView:()=>enemy,localStorage:{setItem:()=>{}},ASSIST_KEY:'test',notify:()=>{}};
 vm.runInNewContext(body,context);assert.equal(context.sim.locked,enemy);assert.equal(context.assist.autoTarget,true);vm.runInNewContext(body,context);assert.equal(context.sim.locked,null);assert.equal(context.assist.autoTarget,false);
 const sim={player:{x:0,z:0,hp:10},enemies:[enemy],locked:null,attack:()=>{throw Error('must not fire')}};
 assert.equal(updateCombatAssist(sim,{autoTarget:true,selectTarget:()=>null,range:5}),false);assert.equal(sim.locked,null);
});
