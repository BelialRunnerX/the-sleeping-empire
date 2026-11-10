import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const expected={axe:{bytes:918912,sha:'d3f30ef7d33190e16fec2e506a69c7fd54bb9f24594a341f6804420056ca40dc'},pickaxe:{bytes:957024,sha:'472f75566dd6984cded85e5c80424216bf59aed33114ce2fcca571ad90e48be3'}};
for(const [name,e] of Object.entries(expected)){
 const b=fs.readFileSync(new URL(`../assets/tools/${name}.glb`,import.meta.url));
 assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.length,e.bytes,`${name}: original byte count`);assert.equal(b.readUInt32LE(8),b.length,`${name}: full declared GLB length`);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),e.sha,`${name}: original artifact integrity`);
 const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());
 assert(j.meshes.length>0);assert(j.buffers.every(x=>!x.uri),'self-contained offline tool');
 console.log(`${name}: original bytes and self-contained GLB verified`);
}
