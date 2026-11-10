import assert from 'node:assert/strict';
import {createUniverseSurvey,collectSurveyPages} from '../engine/universe/universe-survey.mjs';
import {SOURCE_WORLDS} from '../engine/universe/planet-environment.mjs';
import catalogue from '../engine/materials/material-catalogue.mjs';
const service=createUniverseSurvey('1701');
for(const id of service.manifest.resources)assert(catalogue.items.some(x=>x.id===id));
const request={min:[-32,0,-32],size:[64,1,64]};
const t=performance.now();let maxPageMs=0;
const pages=await collectSurveyPages(cursor=>{let start=performance.now();const p=service.scanSystems({...request,cursor});maxPageMs=Math.max(maxPageMs,performance.now()-start);return p;});
const systems=pages.flatMap(p=>p.systems);assert.equal(pages.length,32);assert.equal(pages.reduce((n,p)=>n+p.scanned,0),4096);
assert(systems.length>0,'fixed seed should have discoverable systems');
for(const system of systems){assert(system.materialDensity>=.85);assert.deepEqual(system,service.resolveSystem(system.cell));}
// Pagination/partition cannot change ownership or IDs.
let small=[];for(let cursor=0;cursor!==null;){const p=service.scanSystems({...request,cursor,limit:17});small.push(...p.systems);cursor=p.nextCursor;}assert.deepEqual(small,systems);
const halves=[{min:[-32,0,-32],size:[32,1,64]},{min:[0,0,-32],size:[32,1,64]}];let split=[];for(const r of halves)split.push(...(await collectSurveyPages(cursor=>service.scanSystems({...r,cursor}))).flatMap(p=>p.systems));assert.deepEqual(split.map(p=>p.id).sort(),systems.map(p=>p.id).sort());
const s=systems[0],planetPages=await collectSurveyPages(cursor=>service.scanPlanets(s,{cursor}));const planets=planetPages.flatMap(p=>p.planets);
for(const p of planets){assert.equal(p.systemId,s.id);assert(Math.hypot(...p.localPosition)<=4);assert.equal(p.recipeId,service.manifest.recipeId);for(const v of Object.values(p.resources))assert(v>=0&&v<=p.richness);if(p.environment.sourcePreset)assert.deepEqual(p.environment.preset,SOURCE_WORLDS[p.environment.sourcePreset]);}
assert.deepEqual(await collectSurveyPages(cursor=>service.scanPlanets(s,{cursor})),planetPages);
assert.throws(()=>createUniverseSurvey('different').scanPlanets(s));assert.throws(()=>service.scanPlanets({...s,id:s.id+'x'}));assert.throws(()=>service.scanSystems({min:[0,0,0],size:[17,17,17]}));assert.throws(()=>service.scanSystems({...request,limit:129}));assert.throws(()=>service.scanSystems({...request,cursor:4097}));assert.throws(()=>service.resolveSystem([Number.MAX_SAFE_INTEGER+1,0,0]));assert.throws(()=>createUniverseSurvey(''));assert.throws(()=>createUniverseSurvey(1,{radiusCells:9}));
const huge={min:['123456789012345678901234567890','-987654321098765432109876543210','0'],size:[3,2,3]};assert.deepEqual(service.scanSystems(huge),service.scanSystems(huge));
const withExtra=createUniverseSurvey('1701',{resources:[...service.manifest.resources,'elysiumores:amber']});assert.equal(withExtra.resolveSystem(s.cell).id,s.id);const extra=(await collectSurveyPages(cursor=>withExtra.scanPlanets(s,{cursor}))).flatMap(p=>p.planets);assert.deepEqual(extra.map(p=>[p.id,p.environment,p.resources['minecraft:raw_iron']]),planets.map(p=>[p.id,p.environment,p.resources['minecraft:raw_iron']]));
const abort=new AbortController();let calls=0;await assert.rejects(collectSurveyPages(cursor=>{calls++;return service.scanSystems({...request,cursor});},{signal:abort.signal,yieldControl:async()=>abort.abort()}),/cancelled/);assert.equal(calls,1);
// Environment metadata must be scoped by identity, not repeated system-local coordinates.
const dense=createUniverseSurvey('scope-fixture',{systemThreshold:.5,planetThreshold:.1,radiusCells:4});const ds=(await collectSurveyPages(cursor=>dense.scanSystems({min:[-8,0,-8],size:[16,1,16],cursor}))).flatMap(p=>p.systems);assert(ds.length>=2);
let seen=new Map(),different=false;for(const parent of ds.slice(0,8)){for(const p of (await collectSurveyPages(cursor=>dense.scanPlanets(parent,{cursor}))).flatMap(p=>p.planets)){const k=p.localPosition.map(Math.floor).join(',');if(seen.has(k)&&seen.get(k)!==JSON.stringify(p.environment.fields))different=true;seen.set(k,JSON.stringify(p.environment.fields));}}assert(different);
console.log(JSON.stringify({status:'PASS',systems:systems.length,planets:planets.length,queryCells:4096,pages:pages.length,maxPageMs,totalMs:performance.now()-t,sourcePresetValues:true,partitionAndResume:true,largeCoordinates:true,cancellation:true,resourceIndependence:true,objectScopedEnvironment:true,production:false},null,2));


import {freshState,migrateState} from '../engine/simulation.mjs';
const legacy=freshState(1701);delete legacy.universe;const migrated=migrateState(legacy);assert.equal(migrated.universe.universalSeed,'1701');assert.deepEqual(migrateState(JSON.parse(JSON.stringify(migrated))).universe,migrated.universe);const future={version:'future-v9',universalSeed:'same-universe',recipeId:'future-recipe',futureParameters:{resourcePolicy:'v9'}};assert.deepEqual(migrateState({...legacy,universe:future}).universe,future);assert.equal(migrateState({...legacy,universe:null}).universe.universalSeed,'1701');console.log('Universe manifest migration/preservation PASS');
