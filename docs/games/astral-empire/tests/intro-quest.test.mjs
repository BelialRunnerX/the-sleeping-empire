import {test} from 'node:test';
import assert from 'node:assert/strict';
import {QUESTS} from '../engine/content.mjs';
import {freshState,migrateState,claimQuest,questStatus,gather,harvestCrop,craft} from '../engine/progression.mjs';
import {buildNursery,plantCrop,NURSERY} from '../engine/nursery.mjs';
test('intro graph has 13 reachable steps and valid useful rewards',()=>{
 const seen=new Set(), s=freshState();
 for(const q of QUESTS){assert.ok(!seen.has(q.id)); assert.ok(q.needs.every(id=>seen.has(id)));seen.add(q.id); assert.ok(q.xp>0&&q.gold>0&&q.hint);for(const [key,n] of Object.entries(q.resources)){assert.ok(Object.hasOwn(s.resources,key));assert.ok(n>0);}}
 assert.equal(seen.size,13);
});
test('actual gathering unlocks supplies, not locked or malformed progress',()=>{
 const s=freshState(); assert.equal(claimQuest(s,'warden'),false);s.statistics.bosses=NaN;assert.equal(claimQuest(s,'warden'),false);
 for(let i=0;i<5;i++)assert.equal(gather(s,{id:'tree-'+i,kind:'tree'},1000).ok,true);
 const before=s.resources.timber;assert.equal(claimQuest(s,'gather'),true);assert.equal(s.resources.timber,before+4);
 assert.equal(claimQuest(s,'gather'),false);assert.equal(questStatus(s,QUESTS[1]).unlocked,true);
});
test('full chain grants exactly once and survives save migration with precompleted progress',()=>{
 let s=freshState();s.statistics={...s.statistics,gathers:5,workstations:3,processed:5,crafts:1,cropHarvests:2,kills:5,relays:2,salvages:3,bosses:1};s.nursery.tier=1;s.exploration.discovered=['a','b','c'];s.passives=['a','b','c','d','e'];
 const before=s.gold; for(const q of QUESTS){assert.equal(claimQuest(s,q.id),true,q.id);assert.equal(claimQuest(s,q.id),false);}
 assert.equal(s.gold-before,QUESTS.reduce((n,q)=>n+q.gold,0));const gold=s.gold; s=migrateState(JSON.parse(JSON.stringify(s)));for(const q of QUESTS)assert.equal(claimQuest(s,q.id),false);assert.equal(s.gold,gold);assert.equal(s.statistics.cropHarvests,2);
});
test('legacy claims are retained without retroactive duplicated payouts',()=>{
 const s=freshState();s.claimed=['atelier-build','gather','warden'];delete s.statistics.cropHarvests;
 const migrated=migrateState(s);assert.deepEqual(migrated.claimed,s.claimed);assert.equal(migrated.statistics.cropHarvests,0);assert.equal(claimQuest(migrated,'warden'),false);
});
test('crop milestone only advances on successful mature nursery harvest',()=>{
 const s=freshState();s.position={x:NURSERY.x,z:NURSERY.z};Object.assign(s.resources,{stone:2,timber:2,cobalt:1,loomflaxSeed:2});assert.equal(buildNursery(s),true);
 s.nursery.plots[0]={species:'loomflax',tier:1,plantedAt:1000};assert.equal(harvestCrop(s,0,1001).ok,false);assert.equal(s.statistics.cropHarvests,0);assert.equal(harvestCrop(s,0,211000).ok,true);assert.equal(harvestCrop(s,0,211001).ok,false);assert.equal(s.statistics.cropHarvests,1);
});
