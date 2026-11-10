import { TerrainVolume } from './terrain-volume.mjs';
import { createTerrainField } from './terrain-field.mjs';
import { meshAdaptiveTerrain, surfaceRefinements } from './terrain-adaptive.mjs';
let identity='',field;
self.onmessage=({data})=>{
  const {token,seed,realm,generation,store,bounds,bands=[bounds],refined}=data;
  try {
    const key=seed+':'+realm+':'+JSON.stringify(generation);if(identity!==key){field=createTerrainField(seed,realm,generation);identity=key;}
    const volume=new TerrainVolume(store,realm,field,{cacheBlocks:2048}),start=performance.now();
    const fine=[...new Set([...refined,...bands.flatMap(b=>surfaceRefinements(volume,b))])];
    const parts=bands.map(b=>meshAdaptiveTerrain(volume,b,fine)),size=parts.reduce((n,m)=>n+m.positions.length,0),positions=new Float32Array(size),normals=new Float32Array(size);let offset=0;
    for(const part of parts){positions.set(part.positions,offset);normals.set(part.normals,offset);offset+=part.positions.length;}
    const mesh={positions,normals,quads:size/18,fineLeaves:fine.length};
    self.postMessage({token,mesh,bands,milliseconds:performance.now()-start},[mesh.positions.buffer,mesh.normals.buffer]);
  }catch(error){self.postMessage({token,error:String(error?.message||error)});}
};
