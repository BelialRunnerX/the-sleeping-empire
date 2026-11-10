import {planWholeTreeChop} from './tree-interaction.mjs';
export function normalizeTreeLedger(input){
 const felled={};for(const [id,value]of Object.entries(input?.felled||{}))if(id.length<512&&[2,3].includes(value?.revision)&&typeof value.treeId==='string'&&value.treeId.length<4096&&value.felled===true)felled[id]={treeId:value.treeId,revision:value.revision,felled:true,harvest:value.harvest};
 return {version:2,felled,timberMicroUnits:Number.isInteger(input?.timberMicroUnits)&&input.timberMicroUnits>=0&&input.timberMicroUnits<4096?input.timberMicroUnits:0};
}
export function fellGameTree(state,node,bonus=0){
 state.trees ||= normalizeTreeLedger();
 if(state.trees.felled[node.id])return {ok:false,message:'This tree has already been felled.'};
 if(!node.voxelTree)return {ok:false,message:'The tree is still preparing. Try again shortly.'};
 const plan=planWholeTreeChop(node.voxelTree),total=state.trees.timberMicroUnits+plan.inventoryAdaptation.logMicroUnits;
 const timber=Math.floor(total/4096),extra=Math.max(0,Math.floor(bonus));
 state.trees.timberMicroUnits=total%4096;
 const {delta,...record}=plan.nextState;state.trees.felled[node.id]=record;
 state.resources.timber=(state.resources.timber||0)+timber+extra;
 return {ok:true,timber,bonus:extra,receipt:plan.receipt,message:`+${timber} timber from log volume${extra?' +'+extra+' harvesting bonus':''}. Tree permanently felled.`};
}
// Same material-valued woody cells used by generated geometry, not cylindrical stand-ins.
export function treeBoxCollision(entries,ledger,min,max){
 for(const e of entries.values()){
  if(!e.mesh||!e.tree||ledger?.felled?.[e.id])continue;
  const o=e.group.position,b=e.mesh.geometry.boundingBox;
  if(max[0]<=o.x+b.min.x||min[0]>=o.x+b.max.x||max[1]<=o.y+b.min.y||min[1]>=o.y+b.max.y||max[2]<=o.z+b.min.z||min[2]>=o.z+b.max.z)continue;
  e.woodKeys ||= new Set(e.tree.cells.filter(c=>c.materialId.endsWith('_log')).map(c=>`${c.x},${c.y},${c.z}`));
  const cellScale=16/(e.tree.cellMicro||4);
  const lo=min.map((v,i)=>Math.floor((v-[o.x,o.y,o.z][i])*cellScale)),hi=max.map((v,i)=>Math.ceil((v-[o.x,o.y,o.z][i])*cellScale)-1);
  for(let z=lo[2];z<=hi[2];z++)for(let y=lo[1];y<=hi[1];y++)for(let x=lo[0];x<=hi[0];x++)if(e.woodKeys.has(`${x},${y},${z}`))return true;
 }return false;
}
