// Bounded vertical geometry windows. Persistence/collision remain full volume.
// Keep the visible surface plus a quantized local band around the player; do
// not mesh the entire growing column between a deep cave and the surface.
export function terrainBands(x,z,surfaceMin,surfaceMax,foot,tile=8){
 const center=Math.floor(foot/8)*8,intervals=[[Math.floor(surfaceMin)-8,Math.ceil(surfaceMax)+8],[center-8,center+16]].sort((a,b)=>a[0]-b[0]),merged=[];
 for(const range of intervals){const prev=merged.at(-1);if(prev&&range[0]<=prev[1])prev[1]=Math.max(prev[1],range[1]);else merged.push([...range]);}
 return merged.map(([lo,hi])=>({min:[x,lo,z],max:[x+tile,hi,z+tile]}));
}
