import {TerrainRenderer} from '../engine/terrain-view.mjs';
import {TerrainVolume,terrainBlockKey,parseTerrainBlockKey} from '../engine/terrain-volume.mjs';
import * as T from '../vendor/three.module.js';
const field=()=>1;field.baseHeight=()=>0;field.generation={version:1};
for(const count of [0,100,1000]){
const blocks={};for(let i=0;i<count;i++)blocks[terrainBlockKey([100+i,0,100])] = {fill:0,cells:{}};
const v=new TerrainVolume({realms:{bastion:{blocks}}},'bastion',field),r=new TerrainRenderer(new T.Scene(),{seed:1,realm:'bastion'},v,{dataset:{}},()=>{}),p={x:0,z:0,terrainY:0,y:0};
if(process.argv.includes('--scan'))r.editIndexes=()=>{
 const scan=entries=>{const all=()=>[...entries()].flatMap(([key,value])=>{const p=parseTerrainBlockKey(key);return p?[{key,p,value}]:[];});return {
 inTiles:keys=>{const wanted=new Set(keys);return all().filter(({p})=>wanted.has(Math.floor(p[0]/8)+':'+Math.floor(p[2]/8)));},
 within:bounds=>all().filter(({p})=>p.every((n,i)=>n>=bounds.min[i]-1&&n<bounds.max[i]+1))};};
 return {edits:scan(()=>Object.entries(v.data.blocks)),revisions:scan(()=>v.changes)};};
 r.sync(p);const samples=[];for(let run=0;run<5;run++){let t=performance.now();for(let i=0;i<120;i++){if(process.argv.includes('--replan'))r.lastPlan=null;r.sync(p);}samples.push((performance.now()-t)/120)}console.log(count,samples);r.dispose();}
