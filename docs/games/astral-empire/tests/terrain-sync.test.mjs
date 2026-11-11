import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {TerrainRenderer} from '../engine/terrain-view.mjs';
import {TerrainVolume,terrainBlockKey,parseTerrainBlockKey} from '../engine/terrain-volume.mjs';
function fixture(blocks={}) {
 const field=()=>1;field.baseHeight=()=>0;field.generation={version:1};
 const volume=new TerrainVolume({realms:{bastion:{blocks}}},'bastion',field);
 const renderer=new TerrainRenderer(new T.Scene(),{seed:1,realm:'bastion'},volume,{dataset:{}},()=>{});
 return {volume,renderer};
}
const player=(x=0,z=0,foot=0)=>({x,z,terrainY:foot,y:0});
function snapshot(r){return {records:[...r.records].map(([key,v])=>({key,bands:v.bands,signature:v.signature,token:v.token})),queue:r.queue,serial:r.serial};}
test('stationary and sub-tile motion do not rescan persistent edits',()=>{
 const blocks={};for(let i=0;i<1000;i++)blocks[terrainBlockKey([100+i,0,100])]={fill:0,cells:{}};
 let scans=0;const proxy=new Proxy(blocks,{ownKeys(target){scans++;return Reflect.ownKeys(target);}});
 const {renderer:r}=fixture(proxy);r.sync(player());const before=scans;
 for(let i=0;i<120;i++)r.sync(player((i%7)/2,1,1));
 assert.equal(scans,before);r.dispose();
});
test('planning matches unconditionally recomputed reference through crossings and edits',()=>{
 const a=fixture(),b=fixture();
 const sync=p=>{a.renderer.sync(p);b.renderer.lastPlan=null;b.renderer.sync(p);assert.deepEqual(snapshot(a.renderer),snapshot(b.renderer));};
 sync(player());sync(player(1,1,1));sync(player(7.99,0,7.99));sync(player(8,0,8));sync(player(-.01,-.01,-.01));
 for(const f of [a,b])f.volume.set([0,0,0],0);
 sync(player(-.01,-.01,-.01));
 for(const f of [a,b]){const candidate=f.volume.fork();candidate.set([16,0,16],0);f.volume.commitFrom(candidate);}
 sync(player());sync(player(160,160,-40));sync(player());a.renderer.dispose();b.renderer.dispose();
});
test('pending results still drain when coverage plan is unchanged',()=>{
 const {renderer:r}=fixture();r.sync(player());let calls=0;r.drainPublications=()=>calls++;
 r.sync(player());r.sync(player(1,1));assert.equal(calls,2);r.dispose();
});
test('store replacement at equal revision invalidates plan',()=>{
 const {renderer:r,volume:v}=fixture();r.sync(player());const old=r.lastPlan;
 v.data={blocks:{[terrainBlockKey([0,0,0])]:{fill:0,cells:{}}}};r.sync(player());assert.notEqual(r.lastPlan,old);assert.match(r.records.get('0:0').signature,/0:0:0/);r.dispose();
});

// Independent full-scan oracle matching the original renderer predicates/order.
function scanIndexes(volume){
 const scan=entries=>{
  const all=()=>[...entries()].flatMap(([key,value])=>{const p=parseTerrainBlockKey(key);return p?[{key,p,value}]:[];});
  return {inTiles:keys=>{const wanted=new Set(keys);return all().filter(({p})=>wanted.has(Math.floor(p[0]/8)+':'+Math.floor(p[2]/8)));},
   within:bounds=>all().filter(({p})=>p.every((n,i)=>n>=bounds.min[i]-1&&n<bounds.max[i]+1))};
 };
 return {edits:scan(()=>Object.entries(volume.data.blocks)),revisions:scan(()=>volume.changes)};
}
test('spatial index matches full scan for halos, jobs, dependencies and removed edits',()=>{
 const blocks={};for(let i=0;i<160;i++){const p=[(i*17)%65-32,(i*11)%49-24,(i*23)%65-32];blocks[terrainBlockKey(p)]={fill:0,cells:{}};}
 blocks.invalid={fill:0,cells:{}};
 const a=fixture(structuredClone(blocks)),b=fixture(structuredClone(blocks));
 b.renderer.editIndexes=()=>scanIndexes(b.volume);
 const sync=p=>{a.renderer.sync(p);b.renderer.lastPlan=null;b.renderer.sync(p);assert.deepEqual(snapshot(a.renderer),snapshot(b.renderer));
  for(const [key,r] of a.renderer.records)assert.deepEqual(a.renderer.publicationDependencies(r),b.renderer.publicationDependencies(b.renderer.records.get(key)));};
 for(let i=0;i<45;i++){
  if(i%3===0)for(const f of [a,b])f.volume.set([i*13-96,i-16,i*7-100],0);
  if(i%5===0)for(const f of [a,b]){const c=f.volume.fork();c.set([i*9-64,16,i*3-48],0);f.volume.commitFrom(c);}
  sync(player((i*7)%48-24,(i*13)%48-24,(i*11)%40-20));
 }
 for(const f of [a,b]){f.volume.set([0,0,0],0);f.volume.set([0,0,0],1);}
 sync(player());
 // Loading/replacing backing dictionaries without a revision change also rebuilds.
 for(const f of [a,b])f.volume.data.blocks=structuredClone(blocks);
 sync(player());a.renderer.dispose();b.renderer.dispose();
});
test('tile crossings reuse edit index instead of enumerating global saved edits',()=>{
 const blocks={};for(let i=0;i<1000;i++)blocks[terrainBlockKey([1000+i,0,1000])]={fill:0,cells:{}};
 let scans=0;const {renderer:r}=fixture(new Proxy(blocks,{ownKeys:t=>{scans++;return Reflect.ownKeys(t);}}));
 r.sync(player());const before=scans;
 for(let i=0;i<80;i++)r.sync(player(i*8,0));
 assert.equal(scans,before);r.dispose();
});
