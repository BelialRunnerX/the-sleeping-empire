import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrainField} from '../engine/terrain-field.mjs';
import {createTerrainField as referenceField} from './fixtures/terrain-field-c943a13.mjs';
import {TerrainVolume,normalizeTerrainDeltas} from '../engine/terrain-volume.mjs';
import {TerrainVolume as ReferenceVolume} from './fixtures/terrain-volume-c943a13.mjs';
import {surfaceRefinements,meshAdaptiveTerrain} from '../engine/terrain-adaptive.mjs';

function scalarBlock(field,[bx,by,bz]) {
  const data=new Uint8Array(4096);
  for(let z=0;z<16;z++)for(let y=0;y<16;y++)for(let x=0;x<16;x++)
    data[x+16*(y+16*z)]=field(bx+(x+.5)/16,by+(y+.5)/16,bz+(z+.5)/16)>0?1:0;
  return data;
}

test('batched microcolumns equal the frozen scalar field across worlds, negative seams and caves',()=>{
  for(const [seed,realm,generation] of [[9372,'bastion',null],[12345,'moon',null],[5,'cinder',null],[24,'frost',null],[812,'orbit',null],[9372,'bastion',{version:2}]]) {
    const field=createTerrainField(seed,realm,generation),reference=referenceField(seed,realm,field.generation);
    for(const x of [-193,-160,0,159,168,192]) {
      const z=x<0?-3:3,base=Math.floor(reference.baseHeight(x,z));
      for(const y of [base,base-28]) {
        const block=[x,y,z],data=new Uint8Array(4096);
        assert.equal(field.fillBlock(block,data),data);
        assert.deepEqual(data,scalarBlock(reference,block),`${seed}/${realm}/${generation?.version||1} at ${block}`);
      }
    }
  }
});

test('bulk sampling overlays edits last and respects filled blocks, cache eviction and transaction isolation',()=>{
  const field=createTerrainField(9372,'bastion'),reference=referenceField(9372,'bastion');
  const make=f=>new TerrainVolume(normalizeTerrainDeltas(),'bastion',f,{cacheBlocks:1});
  const volume=make(field),oracle=make(reference),base=Math.floor(field.baseHeight(168,3)),block=[168,base,3];
  const compare=()=>{assert.deepEqual(volume.blockData(block),oracle.blockData(block));assert.deepEqual(volume.store,oracle.store);};
  compare();
  const p=[168*16+7,base*16+8,3*16+9],value=1-oracle.material(p);
  assert.equal(volume.set(p,value),oracle.set(p,value));compare();
  const a=volume.fork(),b=oracle.fork();a.set([p[0]+1,p[1],p[2]],value);b.set([p[0]+1,p[1],p[2]],value);
  compare();volume.commitFrom(a);oracle.commitFrom(b);compare();
  for(const x of [169,170,171]){volume.blockData([x,base,3]);oracle.blockData([x,base,3]);}compare();
  assert.equal(volume.fillBlock(block,0),oracle.fillBlock(block,0));compare();
  volume.set(p,1);oracle.set(p,1);compare();
  const reloaded=new TerrainVolume(normalizeTerrainDeltas(JSON.parse(JSON.stringify(volume.store))),'bastion',field);
  assert.deepEqual(reloaded.blockData(block),oracle.blockData(block));
});

test('scalar fallback and batch sampling produce identical refinements and mesh bytes',()=>{
  for(const x of [0,168]) {
    const field=createTerrainField(9372,'bastion'),reference=referenceField(9372,'bastion'),h=Math.floor(field.baseHeight(x,0));
    const bounds={min:[x,h-2,0],max:[x+2,h+2,2]},a=new TerrainVolume({realms:{}},'bastion',field),b=new TerrainVolume({realms:{}},'bastion',reference);
    const fine=surfaceRefinements(a,bounds),before=surfaceRefinements(b,bounds);
    assert.deepEqual(fine,before);assert.deepEqual(meshAdaptiveTerrain(a,bounds,fine),meshAdaptiveTerrain(b,bounds,before));
  }
});

test('bulk sampling can be disabled without changing field values',()=>{
  const field=createTerrainField(9372,'bastion',null,{batchBlocks:false});
  assert.equal(field.fillBlock,undefined);
  assert.deepEqual(scalarBlock(field,[168,0,3]),scalarBlock(referenceField(9372,'bastion'),[168,0,3]));
});

test('optional bulk sampler avoids 4096 scalar dispatches and never runs for authoritative fill overrides',()=>{
  let scalarCalls=0,bulkCalls=0;
  const field=()=>{scalarCalls++;return 1;};
  field.fillBlock=(block,data)=>{bulkCalls++;data.fill(1);data[3]=0;};
  const volume=new TerrainVolume({realms:{}},'bastion',field);
  assert.equal(volume.blockData([0,0,0])[3],0);assert.equal(bulkCalls,1);assert.equal(scalarCalls,0);
  volume.blockData([0,0,0]);assert.equal(bulkCalls,1);
  const filled=new TerrainVolume({realms:{bastion:{blocks:{'0:0:0:0:0:0':{fill:0,cells:{3:1}}}}}},'bastion',field);
  assert.equal(filled.blockData([0,0,0])[3],1);assert.equal(bulkCalls,1);
});


test('mixed-page edits, reward counts, occupancy and rays match original volume operation replay',()=>{
  const field=(x,y,z)=>Math.sin(x*3)+Math.cos(z*2)-y;
  const a=new TerrainVolume(normalizeTerrainDeltas(),'bastion',field,{cacheBlocks:2});
  const b=new ReferenceVolume(normalizeTerrainDeltas(),'bastion',field,{cacheBlocks:2});
  let seed=8374;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<120;i++){
    const block=Array.from({length:3},()=>Math.floor(random()*5)-2),value=random()<.5?0:1;
    const cell=block.map(n=>n*16+Math.floor(random()*16));
    if(i%4===0)assert.equal(a.fillBlock(block,value),b.fillBlock(block,value));
    else assert.equal(a.set(cell,value),b.set(cell,value));
    const low=cell.map(n=>n/16),high=low.map(n=>n+.18);
    assert.equal(a.occupied(low,high),b.occupied(low,high));
    assert.deepEqual(a.ray(low,[.1,-1,.1],2),b.ray(low,[.1,-1,.1],2));
    assert.deepEqual(a.store,b.store);assert.equal(a.revision,b.revision);assert.deepEqual(a.changes,b.changes);
  }
});
