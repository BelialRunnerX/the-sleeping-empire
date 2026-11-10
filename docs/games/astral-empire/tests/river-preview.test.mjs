import assert from 'node:assert/strict';
import {generateRiverPreview} from '../engine/universe/river-preview-data.mjs';
const p={universalSeed:'1701',planetId:'carving-fixture',radiusMetres:6371000,macroResolution:16};
const a=generateRiverPreview(p),b=generateRiverPreview(p);
assert.deepEqual(a,b);assert(a.water.indices.length>0);assert(a.triangleCount<=32768);
for(const mesh of [a.terrain,a.water]){assert(mesh.positions.every(Number.isFinite));assert(mesh.indices.every(i=>i<mesh.positions.length/3));}
for(const radiusMetres of [3000,131000000]){const x=generateRiverPreview({...p,radiusMetres,reliefMetres:Math.min(8000,radiusMetres*.1)});assert(x.water.positions.every(Number.isFinite));assert(x.triangleCount<=32768);}
for(const options of [{resolution:65},{resolution:7},{spanMetres:NaN},{spanMetres:1290}])assert.throws(()=>generateRiverPreview(p,options));
assert.throws(()=>generateRiverPreview({...p,sourcePreset:'emerald_bastion'}),/forbids oceans/);
console.log('River preview deterministic bounded meshes and source eligibility PASS');
