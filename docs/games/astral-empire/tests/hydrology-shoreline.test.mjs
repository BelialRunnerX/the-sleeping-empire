import test from 'node:test';import assert from 'node:assert/strict';import {standingWaterLevel,createAtlas} from '../engine/mountain-hydrology.mjs';
test('standing water remains flat beside dry banks and ocean shoreline',()=>{
 for(let k=0;k<=100;k++){const t=k/100,bed=5*t;assert.equal(standingWaterLevel([0,5],[2,5],[0,1],[1-t,t],bed),bed<1.99?2:null);}
 assert.equal(standingWaterLevel([-5,8],[0,8],[0,1],[.5,.5],1.5),null);
 assert.equal(standingWaterLevel([-5,8],[0,8],[0,1],[.8,.2],-2.4),0);
 assert.equal(standingWaterLevel([0,1],[2,4],[0,1],[.5,.5],1.5),2);
});
test('actual atlas river centerlines remain wet and downhill after flat basin correction',()=>{
 const a=createAtlas(),half=a.config.size/2;let samples=0;
 for(let i=0;i<a.parent.length;i++){const p=a.parent[i];if(p<0||a.flow[i]<a.config.riverThreshold||a.filled[i]<=a.config.sea)continue;let prev=Infinity;for(let k=0;k<=8;k++){const t=k/8,s=a.sample(((i%a.config.n)*(1-t)+(p%a.config.n)*t)*a.step-half,(Math.floor(i/a.config.n)*(1-t)+Math.floor(p/a.config.n)*t)*a.step-half);assert.notEqual(s.waterHeight,null);assert(s.height<s.waterHeight);assert(s.waterHeight<=prev+1e-7);prev=s.waterHeight;samples++;}}
 assert(samples>46000);
});
