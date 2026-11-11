// CPU-only paired fixture; fixed content and geometry, not a rendered FPS claim.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createTerrainField} from '../engine/terrain-field.mjs';
import {createTerrainField as referenceField} from './fixtures/terrain-field-c943a13.mjs';
import {TerrainVolume} from '../engine/terrain-volume.mjs';
import {surfaceRefinements,meshAdaptiveTerrain} from '../engine/terrain-adaptive.mjs';
const samples=Math.max(3,Number(process.env.BENCH_SAMPLES)||7);
const variants={reference:referenceField,scalar:(s,r,g)=>createTerrainField(s,r,g,{batchBlocks:false}),batched:createTerrainField};
const fixtures=[{name:'settlement',x:0,generation:null},{name:'frontier',x:168,generation:null},{name:'continental',x:168,generation:{version:2}}];
const percentile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.ceil(p*a.length)-1)];
const stats=a=>({samples:a.length,median:percentile(a,.5),p95:percentile(a,.95),worst:Math.max(...a)});
function run(field,bounds) {
  const v=new TerrainVolume({realms:{}},'bastion',field,{cacheBlocks:2048});
  const start=performance.now(),fine=surfaceRefinements(v,bounds),classified=performance.now();
  const mesh=meshAdaptiveTerrain(v,bounds,fine),finished=performance.now();
  const hash=createHash('sha256').update(JSON.stringify(fine)).update(new Uint8Array(mesh.positions.buffer)).update(new Uint8Array(mesh.normals.buffer)).digest('hex');
  return {classificationMs:classified-start,meshMs:finished-classified,totalMs:finished-start,fine:fine.length,quads:mesh.quads,meshBytes:mesh.positions.byteLength+mesh.normals.byteLength,denseCacheBytes:[...v.collisionCache.values()].reduce((n,a)=>n+a.byteLength,0),uniformPages:v.uniformCache.size,hash};
}
console.log(JSON.stringify({type:'metadata',base:'c943a13',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model,samples,clock:'performance.now',jitWarmup:'one discarded run per variant and fixture',phases:'cold field cache, then warm field cache in fresh volume',units:'milliseconds and bytes; CPU only'}));
for(const fixture of fixtures) {
  const results={},seed=9372,realm='bastion',initial=createTerrainField(seed,realm,fixture.generation),generation=initial.generation,h=Math.floor(initial.baseHeight(fixture.x,0));
  const bounds={min:[fixture.x,h-8,0],max:[fixture.x+8,h+8,8]};let expected;
  for(const [name,factory] of Object.entries(variants)){results[name]={cold:[],warm:[]};run(factory(seed,realm,generation),bounds);}
  for(let i=0;i<samples;i++) {
    const names=Object.keys(variants);if(i%2)names.reverse();
    for(const name of names) {
      const field=variants[name](seed,realm,generation);
      for(const phase of ['cold','warm']) {
        const value=run(field,bounds);expected??=value.hash;
        assert.equal(value.hash,expected,`${fixture.name}/${name}/${phase} mesh/refinement parity`);
        results[name][phase].push(value);
      }
    }
  }
  for(const [variant,phases] of Object.entries(results))for(const [phase,rows] of Object.entries(phases)) {
    const {fine,quads,meshBytes,denseCacheBytes,uniformPages,hash}=rows[0];
    console.log(JSON.stringify({type:'result',fixture:fixture.name,variant,phase,bounds,fine,quads,meshBytes,denseCacheBytes,uniformPages,hash,classificationMs:stats(rows.map(r=>r.classificationMs)),meshMs:stats(rows.map(r=>r.meshMs)),totalMs:stats(rows.map(r=>r.totalMs))}));
  }
  if(process.argv.includes('--check')&&fixture.name==='frontier')assert.ok(percentile(results.batched.cold.map(r=>r.totalMs),.5)<=percentile(results.reference.cold.map(r=>r.totalMs),.5)*1.2,'frontier total CPU regression exceeds 20% guardrail');
}
