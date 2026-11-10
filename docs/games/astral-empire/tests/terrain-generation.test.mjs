import test from 'node:test';import assert from 'node:assert/strict';
import {freshState,migrateState} from '../engine/progression.mjs';
import {normalizeTerrainGeneration} from '../engine/terrain-generation.mjs';
test('legacy saves retain terrain baseline and new identity survives replay',()=>{
 const old=freshState(42);delete old.terrainGeneration;assert.deepEqual(migrateState(old).terrainGeneration,{version:1});
 const newer={...old,terrainGeneration:{version:2,sourceVersion:'continental-drainage-v2',anchor:{x:576,z:2496,height:26.18}}};
 assert.deepEqual(migrateState(JSON.parse(JSON.stringify(newer))).terrainGeneration,newer.terrainGeneration);
 assert.throws(()=>normalizeTerrainGeneration({version:2,sourceVersion:'continental-drainage-v2',anchor:{x:NaN,z:0,height:0}}),/anchor/);
 assert.throws(()=>normalizeTerrainGeneration({version:999}),/Unsupported/);
 assert.throws(()=>normalizeTerrainGeneration({version:2,sourceVersion:"mountain-drainage-v1"}),/Unsupported/);
});

import {Simulation} from '../engine/combat.mjs';
test('continental ocean admission excludes land trees, wildlife and encounters',()=>{
 const state=freshState(1701);state.terrainGeneration={version:2};state.position={x:50000,z:50000};
 const sim=new Simulation(state);assert.equal(state.terrainGeneration.version,2);
 for(const tile of sim.chunks.tiles.values()){assert.equal(tile.nodes.length,0);assert.equal(tile.wildlife.length,0);assert.equal(tile.features.length,0);assert.equal(tile.enemy,null);assert.equal(tile.beast,null);}
 assert.equal(sim.layout.height(50000,50000),sim.terrainVolume.field.baseHeight(50000,50000));
});

import {Profiles} from '../engine/profiles.mjs';
test('new profile uses continents while existing legacy profile retains baseline',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const profiles=new Profiles(storage),created=profiles.login('new-world','1234',true);
 assert.equal(created.terrainGeneration.version,2);
 const legacy=freshState(22);profiles.save(legacy);profiles.logout();
 assert.equal(profiles.login('new-world','1234').terrainGeneration.version,1);
});
