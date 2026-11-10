import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';import {TerrainWaterView} from '../engine/terrain-water-view.mjs';
test('water errors retry bounded, stale errors ignored and success clears indicator',()=>{
 const old=globalThis.Worker;globalThis.Worker=class{postMessage(){}terminate(){}};
 const r=new TerrainWaterView(T,new T.Scene(),{seed:1,realm:'bastion'},{revision:0,field:{generation:{version:2}},store:{}},{dataset:{}});
 try{const request=()=>{r.retryAt.near=0;r.request('near',0,0,32,2);};
 request();let token=r.tokens.near;r.publish({kind:'near',token:token-1,error:'stale'});assert.equal(r.canvas.dataset.waterError,undefined);
 for(let i=0;i<3;i++){if(i)request();token=r.tokens.near;r.publish({kind:'near',token,error:'temporary'});}
 const serial=r.serial;request();assert.equal(r.serial,serial,'bounded retries');
 r.request('near',32,0,32,2);r.retryAt.near=0;r.request('near',32,0,32,2);assert(r.serial>serial);
 r.publish({kind:'near',token:r.tokens.near,positions:new Float32Array([0,0,0,1,0,0,0,0,1]),indices:new Uint32Array([0,2,1]),origin:[0,0,0],rect:[0,0,1,1],milliseconds:1});assert.equal(r.canvas.dataset.waterError,undefined);assert.equal(r.canvas.dataset.waterReady,'1');
 }finally{r.dispose();globalThis.Worker=old;}
});
