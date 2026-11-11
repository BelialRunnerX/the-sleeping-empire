import assert from 'node:assert/strict';
import {TerrainVolume} from '../engine/terrain-volume.mjs';
import {TerrainVolume as ReferenceVolume} from './fixtures/terrain-volume-c943a13.mjs';
const percentile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.ceil(p*a.length)-1)];
const fixtures=[{name:'warm uniform no-op fill',value:1,iterations:128,run:v=>v.fillBlock([0,0,0],1)},{name:'warm uniform empty collision 4x4x4',value:0,iterations:64,run:v=>Number(v.occupied([0,0,0],[4,4,4]))}];
for(const fixture of fixtures){
  const make=Type=>{const field=()=>fixture.value?1:-1;field.uniformBlock=()=>fixture.value;return new Type({realms:{}},'bastion',field);};
  const volumes={reference:make(ReferenceVolume),optimized:make(TerrainVolume)},times={reference:[],optimized:[]};
  for(const v of Object.values(volumes))fixture.run(v);
  for(let trial=0;trial<7;trial++)for(const name of trial%2?['optimized','reference']:['reference','optimized']){
    const v=volumes[name],start=performance.now();let total=0;
    for(let i=0;i<fixture.iterations;i++)total+=fixture.run(v);
    times[name].push((performance.now()-start)/fixture.iterations);assert.equal(total,0);
  }
  assert.deepEqual(volumes.optimized.store,volumes.reference.store);
  for(const [variant,samples] of Object.entries(times))console.log(JSON.stringify({fixture:fixture.name,variant,node:process.version,phase:'warm page cache',units:'CPU milliseconds per call',iterationsPerSample:fixture.iterations,samples:samples.length,median:percentile(samples,.5),p95:percentile(samples,.95),worst:Math.max(...samples)}));
}
