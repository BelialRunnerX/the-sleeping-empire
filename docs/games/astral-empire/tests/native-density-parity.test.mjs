import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Noise, DensitySlice} from '../engine/native-density.mjs';
// Frozen pre-optimization implementation from c943a13. Do not derive this oracle
// from the production implementation: it must catch arithmetic-order changes.
import * as legacy from './fixtures/native-density-c943a13.mjs';

const seeds = [0n, 1n, -1n, 42n, 123456789n, 0xffffffffffffffffn, 0x10000000000000001n];
const points = [[0, 0, 0], [-0, 0, -0], [1, -1, 2], [-1e-12, 1e-12, 1-1e-12],
  [1+1e-12, -1-1e-12, 2-1e-12], [16384.125, -16384.5, 3000.75]];
let state = 12345;
const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2**32);
for (let i=0;i<160;i++) points.push([random()*100-50,random()*100-50,random()*100-50]);

test('scalar noise, fbm and ridged preserve exact legacy floats', () => {
  for (const seed of seeds) {
    const a = new Noise(seed), b = new legacy.Noise(seed);
    for (const p of points) {
      assert.equal(a.sample(p), b.sample(p));
      assert.equal(a.sample3(...p), b.sample(p));
      for (const [octaves, lacunarity, gain] of [[0,2,.5],[1,2,.5],[3,2,.5],[4,1.91,.47],[2,2,0],[3,-2,-.5]]) {
        assert.equal(a.fbm(p,octaves,lacunarity,gain), b.fbm(p,octaves,lacunarity,gain));
        assert.equal(a.fbm3(...p,octaves,lacunarity,gain), b.fbm(p,octaves,lacunarity,gain));
        assert.equal(a.ridged(p,octaves,lacunarity,gain), b.ridged(p,octaves,lacunarity,gain));
        assert.equal(a.ridged3(...p,octaves,lacunarity,gain), b.ridged(p,octaves,lacunarity,gain));
      }
    }
  }
});

const directions = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],
  ...points.slice(6,22).map(p=>{const length=Math.hypot(...p);return p.map(n=>n/length);})];
const altitudes = [-600,-498.0000001,-498,-497.9999999,-440.0000001,-440,-439.9999999,
  -420,-210,-200.0000001,-200,-199.9999999,-40,0,40,139.9999999,140,140.0000001];
const depths = [7.9999999,8,8.0000001,23.9999999,24,24.0000001,39.9999999,40,40.0000001,100];

test('density, cave and solidity match legacy at surface, cave and deep boundaries', () => {
  let carved = 0;
  for (const seed of seeds) {
    const a = new DensitySlice(seed,3000), b = new legacy.DensitySlice(seed,3000);
    for (const dir of directions) for (const alt of altitudes) {
      assert.deepEqual(a.volumePos(dir,alt), b.volumePos(dir,alt));
      for (const depth of depths) {
        const base = alt+depth, squash = .7+Math.abs(alt)/200;
        assert.equal(a.density(dir,alt,base,squash), b.density(dir,alt,base,squash));
        const cave = b.caveCarve(dir,alt,base);
        carved += cave;
        assert.equal(a.caveCarve(dir,alt,base), cave);
        assert.equal(a.solidAt(dir,alt,base,squash), b.solidAt(dir,alt,base,squash));
      }
      for (const offset of [-3.4000001,-3.4,-3.3999999,0,3.3999999,3.4,3.4000001]) {
        assert.equal(a.solidAt(dir,alt,alt+offset,1), b.solidAt(dir,alt,alt+offset,1));
      }
    }
  }
  assert.ok(carved>0,'include positive cave hits, not just empty carve results');
});

// Optional repeatable microbenchmark, deliberately excluded from timing assertions.
// Both implementations consume identical inputs and begin with fresh noise caches.
// Warm the JIT first and alternate trial order; no renderer or FPS claim is made.
if (process.env.DENSITY_BENCH === '1') {
  const {performance} = await import('node:perf_hooks');
  const fixture = [];
  for (const dir of directions) for (const alt of altitudes) for (const depth of depths)
    fixture.push([dir,alt,alt+depth,.7+Math.abs(alt)/200]);
  function run(Type) {
    const slice = new Type(123456789n,3000);
    let checksum = 0;
    const start = performance.now();
    for (const [dir,alt,base,squash] of fixture)
      checksum += slice.density(dir,alt,base,squash)+slice.caveCarve(dir,alt,base)+Number(slice.solidAt(dir,alt,base,squash));
    return {ms:performance.now()-start,checksum};
  }
  run(legacy.DensitySlice);run(DensitySlice);
  const before=[],after=[];
  for(let i=0;i<9;i++) {
    let a,b;
    if(i%2){b=run(DensitySlice);a=run(legacy.DensitySlice);}
    else {a=run(legacy.DensitySlice);b=run(DensitySlice);}
    assert.equal(a.checksum,b.checksum);
    before.push(a.ms);after.push(b.ms);
  }
  const median = values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
  console.log(JSON.stringify({fixtureRows:fixture.length,trials:9,legacyMedianMs:median(before),scalarMedianMs:median(after),before,after}));
}

test('typed arrays retain their original rounding and inputs remain unchanged', () => {
  for(const Type of [Array,Float32Array,Float64Array]) {
    const a=new Noise(42n),b=new legacy.Noise(42n);
    const da=new DensitySlice(42n,3000),db=new legacy.DensitySlice(42n,3000);
    for(const point of points.slice(0,32)) {
      const p=Type.from(point),before=Type.from(p);
      assert.equal(a.sample(p),b.sample(p));
      assert.equal(a.fbm(p,4,1.91,.47),b.fbm(p,4,1.91,.47));
      assert.equal(a.ridged(p,3,1.91,.47),b.ridged(p,3,1.91,.47));
      assert.equal(da.density(p,-100,-90,2),db.density(p,-100,-90,2));
      assert.equal(da.caveCarve(p,-100,0),db.caveCarve(p,-100,0));
      assert.deepEqual(p,before);
    }
  }
});

test('custom public noise and volume methods keep their existing dispatch', () => {
  const a=new Noise(42n),b=new legacy.Noise(42n);
  a.sample=b.sample=([x,y,z])=>x-y+z;
  assert.equal(a.fbm([.2,.3,.4],4),b.fbm([.2,.3,.4],4));
  assert.equal(a.ridged([.2,.3,.4],3),b.ridged([.2,.3,.4],3));
  for(const customize of [
    slice=>{slice.volumePos=()=>[100,200,300];},
    slice=>{for(const name of ['large','small','caveA','caveB','chamber','fissure'])slice[name].sample=([x,y,z])=>Math.sin(x-y+z);},
    slice=>{for(const name of ['large','small','caveA','caveB','chamber','fissure'])slice[name].fbm=([x,y,z])=>Math.sin(x-y+z);}
  ]) {
    const da=new DensitySlice(42n,3000),db=new legacy.DensitySlice(42n,3000);
    customize(da);customize(db);
    for(const alt of altitudes) for(const depth of depths) {
      assert.equal(da.density([1,0,0],alt,alt+depth,2),db.density([1,0,0],alt,alt+depth,2));
      assert.equal(da.caveCarve([1,0,0],alt,alt+depth),db.caveCarve([1,0,0],alt,alt+depth));
    }
  }
});
