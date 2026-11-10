import { meshTerrain } from './terrain-mesh.mjs';
import { subtractAABBUnion, dirtyBlockBoxes } from './terrain-clip.mjs';
export {dirtyBlockBoxes};
// Clip only affected tile geometry, then replace the containing block and its
// six face neighbors. Ownership-aware clipping preserves external solid faces.
export function patchTerrainMesh(volume, old, boxes) {
  const triangles=[];
  for(let i=0;i<old.positions.length;i+=9){const tri=[];for(let k=0;k<3;k++){const n=i+k*3;tri.push([old.positions[n],old.positions[n+1],old.positions[n+2],old.normals[n],old.normals[n+1],old.normals[n+2]]);}triangles.push(tri);}
  const positions=[],normals=[];
  for(const triangle of subtractAABBUnion(triangles,boxes,{voxelOwnership:true}))for(const vertex of triangle){positions.push(...vertex.slice(0,3));normals.push(...vertex.slice(3,6));}
  for(const box of boxes)volume.blockData(box.min);
  for(const box of boxes){const patch=meshTerrain(volume,box,1/16);for(const n of patch.positions)positions.push(n);for(const n of patch.normals)normals.push(n);}
  return {positions:new Float32Array(positions),normals:new Float32Array(normals),quads:positions.length/18};
}
