export { meshAdaptiveTerrain } from "./terrain-mesh.mjs";

// Classify all candidate leaves, not just differing macro centres: thin caves
// can pass between every centre sample. Only proven field bounds skip sampling.
export function surfaceRefinements(volume,bounds) {
  const fine=[];
  for(let z=bounds.min[2]-1;z<=bounds.max[2];z++)for(let y=bounds.min[1]-1;y<=bounds.max[1];y++)for(let x=bounds.min[0]-1;x<=bounds.max[0];x++){
    const data=volume.blockData([x,y,z]);if(data.some(n=>n!==data[0]))fine.push(x+':'+y+':'+z);
  }return fine;
}
