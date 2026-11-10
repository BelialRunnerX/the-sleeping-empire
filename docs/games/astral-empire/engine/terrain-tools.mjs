import { isVoxelFrontier } from './terrain-field.mjs';
export function useTerrainTool(state,volume,player,mode,direction) {
  if(!['mine','micro','place'].includes(mode)||!isVoxelFrontier(player.x,player.z)||!Number.isFinite(player.terrainY))return {ok:false,message:'Terrain tools operate beyond the protected Dawnwake settlement.'};
  const foot=player.terrainY+player.y,hit=volume.ray([player.x,foot+1.6,player.z],direction,6);
  if(!hit)return {ok:false,message:'Aim toward nearby terrain within 6 m.'};
  const block=hit.cell.map(n=>Math.floor(n/16));
  if(!isVoxelFrontier(block[0]+.5,block[2]+.5))return {ok:false,message:'Settlement ground is protected.'};
  let units=0;
  if(mode==='place'){
    const target=hit.cell.map((n,i)=>Math.floor((n+hit.normal[i])/16));
    if(!isVoxelFrontier(target[0]+.5,target[2]+.5))return {ok:false,message:'Settlement ground is protected.'};
    if(target[0]<player.x+.3&&target[0]+1>player.x-.3&&target[2]<player.z+.3&&target[2]+1>player.z-.3&&target[1]<foot+3&&target[1]+1>foot)return {ok:false,message:'Cannot place inside your body.'};
    if(!(state.resources.stone>=1))return {ok:false,message:'One stone is required to place a block.'};
    // Placement charges a full block even when the neighboring block is partial.
    units=volume.fillBlock(target,1);if(!units)return {ok:false,message:'That block is already full.'};state.resources.stone--;
    return {ok:true,block:target,units:-4096,message:'Placed 1 m stone block.'};
  }
  units=mode==='micro'?(volume.set(hit.cell,0)?1:0):volume.fillBlock(block,0);
  if(!units)return {ok:false,message:'That material has already been removed.'};
  const total=(state.terrain.stoneUnits||0)+units;state.resources.stone+=Math.floor(total/4096);state.terrain.stoneUnits=total%4096;
  return {ok:true,block,units,message:`Recovered ${units}/4096 stone. Terrain edits saved.`};
}
export function terrainPanel(state) {
  return `<article class="card"><h3>Editable frontier terrain</h3><p>The settlement remains protected. Beyond 160 m east/west/north/south, volumetric ground streams around you, with 6.25 cm surface detail streamed nearby. Source density and caves are adapted to this planar world.</p><p>Choose a tool, then aim the camera toward nearby ground and use Interact (E). Whole blocks are 1 m; fine carving removes one cell. Stone accounting uses 4096 exact units per block.</p><button data-terrain-mode="mine">EQUIP BLOCK EXCAVATOR</button> <button data-terrain-mode="micro">EQUIP MICRO CARVER</button> <button data-terrain-mode="place">EQUIP STONE PLACER</button> <button data-terrain-mode="off">PUT TOOLS AWAY</button><p>Stone: ${state.resources.stone} + ${state.terrain.stoneUnits||0}/4096</p><button data-terrain-deploy>FRONTIER SURVEY TRANSFER</button><p>Survey transfer is a temporary browser access aid, not a source waygate. Terrain, physics and generation are under active integration.</p></article>`;
}
