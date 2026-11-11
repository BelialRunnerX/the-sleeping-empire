import {test} from "node:test";
import assert from "node:assert/strict";
import {freshState,migrateState,craft} from "../engine/simulation.mjs";
import {placeStation,stationDefinitions,nearStation,nearbyStation,enqueueProcessing,collectProduction,normalizeProduction} from "../engine/artisan.mjs";
import {obstacles,blocked} from "../engine/navigation.mjs";
import {makeFrontier} from "../engine/frontier.mjs";
const supplied=()=>{const s=freshState(92714);for(const key of Object.keys(s.resources))s.resources[key]=100;return s;};
test("new characters have no forced construction sites; stations build outside sanctuary and persist",()=>{
 const s=supplied();assert.deepEqual(stationDefinitions(s),[]);s.realm="moon";s.position={x:321,z:-157};
 const before=s.resources.cobalt,r=placeStation(s,"foundry",{x:324,z:-157});assert.ok(r.ok);assert.equal(s.resources.cobalt,before-2);
 const saved=migrateState(JSON.parse(JSON.stringify(s)));for(const key of ["kind","realm","x","z","tier"])assert.equal(saved.production.stations[r.id][key],s.production.stations[r.id][key]);assert.ok(nearStation(saved,r.id));saved.realm="bastion";assert.equal(nearStation(saved,r.id),false);
});
test("separate instances own independent queues, output and proximity gates",()=>{
 const s=supplied();s.position={x:100,z:100};const a=placeStation(s,"foundry",{x:103,z:100}).id;
 s.position={x:200,z:200};const b=placeStation(s,"foundry",{x:203,z:200}).id;
 assert.notEqual(a,b);assert.equal(enqueueProcessing(s,"billet",1,1000,a).ok,false);assert.ok(enqueueProcessing(s,"billet",1,1000,b).ok);
 assert.equal(s.production.stations[a].jobs.length,0);assert.equal(s.production.stations[b].jobs.length,1);
 const restored=migrateState(JSON.parse(JSON.stringify(s)));assert.ok(collectProduction(restored,b,Date.now()+60000).ok);assert.equal(collectProduction(restored,b,Date.now()+60000).ok,false);
});
test("invalid placement and resource shortages do not spend, duplicate, or mutate",()=>{
 const s=supplied(),before=JSON.stringify(s);
 for(const [kind,p] of [["bogus",{x:0,z:9}],["foundry",{x:NaN,z:9}],["foundry",{x:100,z:9}]])assert.equal(placeStation(s,kind,p).ok,false);
 assert.equal(JSON.stringify(s),before);assert.ok(placeStation(s,"foundry",{x:0,z:9}).ok);const built=JSON.stringify(s);assert.equal(placeStation(s,"alchemy",{x:0,z:9}).ok,false);assert.equal(JSON.stringify(s),built);
 s.resources.timber=0;const poor=JSON.stringify(s);assert.equal(placeStation(s,"joinery",{x:4,z:6}).ok,false);assert.equal(JSON.stringify(s),poor);
});
test("personal basics craft anywhere; advanced gear requires correct nearby workstation",()=>{
 const s=supplied();s.position={x:100,z:100};assert.ok(craft(s,"loomflax-cord").ok);const before=JSON.stringify(s);assert.equal(craft(s,"aethercoil-pistol").ok,false);assert.equal(JSON.stringify(s),before);
 placeStation(s,"joinery",{x:103,z:100});assert.equal(craft(s,"aethercoil-pistol").ok,false);
 placeStation(s,"foundry",{x:97,z:100});assert.ok(craft(s,"aethercoil-pistol").ok);s.position.x=120;assert.equal(craft(s,"aethercoil-pistol").ok,false);
});
test("malformed dynamic stations are rejected while old paid stations and jobs survive",()=>{
 const s=supplied();s.production.stations.foundry={tier:2,jobs:[{recipe:"billet",start:1000}],output:{billet:4},xp:{smithing:5},completed:2};
 s.production.stations["placed-1"]={kind:"foundry",tier:1,x:Infinity,z:1,realm:"moon"};s.production.stations["placed-2"]={kind:"bogus",tier:1,x:0,z:1,realm:"moon"};
 const p=normalizeProduction(s.production,2000);assert.equal(p.stations.foundry.output.billet,4);assert.equal(p.stations.foundry.jobs.length,1);assert.equal(p.stations["placed-1"],undefined);assert.equal(p.stations["placed-2"],undefined);
});
test("placed station footprint blocks movement and only appears in its realm",()=>{
 const s=supplied();const id=placeStation(s,"foundry",{x:0,z:9}).id;let list=obstacles(s,makeFrontier(s.seed,s.realm));assert.ok(list.some(o=>o.id===id));assert.ok(blocked(0,9,list));s.realm="moon";list=obstacles(s,makeFrontier(s.seed,s.realm));assert.ok(!list.some(o=>o.id===id));
});
