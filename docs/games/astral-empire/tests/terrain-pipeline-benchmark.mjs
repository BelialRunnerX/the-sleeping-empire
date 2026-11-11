import {createTerrainField} from '../engine/terrain-field.mjs';
import {TerrainVolume} from '../engine/terrain-volume.mjs';
import {surfaceRefinements,meshAdaptiveTerrain} from '../engine/terrain-adaptive.mjs';
for(const x of [0,168]){
 const field=createTerrainField(9372,'bastion'),h=Math.floor(field.baseHeight(x,0));
 const v=new TerrainVolume({realms:{}},'bastion',field,{cacheBlocks:2048}),bounds={min:[x,h-8,0],max:[x+8,h+8,8]};
 let calls=0,ms=0;const block=v.blockData.bind(v);v.blockData=p=>{const t=performance.now(),r=block(p);ms+=performance.now()-t;calls++;return r;};
 if(process.argv.includes('--scan'))v.blockIsUniform=null;
 let t=performance.now();const fine=surfaceRefinements(v,bounds),classify=performance.now()-t,gen=ms;t=performance.now();const mesh=meshAdaptiveTerrain(v,bounds,fine),meshing=performance.now()-t;
 console.log(JSON.stringify({x,classificationMs:classify,classificationBlockDataMs:gen,meshMs:meshing,meshBlockDataMs:ms-gen,blockCalls:calls,fine:fine.length,quads:mesh.quads,bytes:mesh.positions.byteLength+mesh.normals.byteLength}));
}
