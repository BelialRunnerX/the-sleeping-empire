import {createTreeState} from './voxel-trees.mjs';
// Use the actual rendered group's origin; its ground Y can differ slightly from integer seed anchor.
export function treeOccupancy(tree,origin,saved){const state=createTreeState(tree,saved?.delta);
 return {materialAt:(x,y,z)=>saved?.felled?null:state.sample(...[x,y,z].map((v,i)=>Math.floor((v-origin[i])*16)+tree.anchorMicro[i])),
 solidAt(x,y,z){return Boolean(this.materialAt(x,y,z)?.endsWith('_log'));}};}
export function planWholeTreeChop(tree,saved){
 if(saved?.treeId&&saved.treeId!==tree.id)throw Error('Chop state/tree identity mismatch');
 if(saved?.felled)return null;
 const state=createTreeState(tree,saved?.delta),receipt=state.fell(),logMicroUnits=Object.entries(receipt.units).filter(([id])=>id.endsWith('_log')).reduce((n,[,v])=>n+v,0);
 // Explicit browser economy adaptation, NOT exact Minecraft/Flora loot. All leaves retained in receipt, no invented leaf loot.
 const timberUnits=Math.floor(logMicroUnits/4096);
 return {transactionId:tree.id+':whole-tree-fell',receipt,
 inventoryAdaptation:{kind:'browser-timber-v1',item:'timber',quantity:timberUnits,logMicroUnits,remainderMicroUnits:logMicroUnits%4096,rule:'one timber per cubic metre of removed log; leaves yield no automatic inventory'},
 nextState:{treeId:tree.id,revision:tree.revision,felled:true,harvest:{logMicroUnits,timberUnits,remainderMicroUnits:logMicroUnits%4096,transactionId:tree.id+':whole-tree-fell'},delta:state.save()}};
}
// Persist must atomically save nextState and apply/dedupe transactionId inventory receipt.
// Tool/range/skill gates are caller-owned and must precede this method.
export class TreeChopCoordinator{
 constructor(persist){this.persist=persist;this.pending=new Map();}
 async chop(tree,saved){if(this.pending.has(tree.id))return this.pending.get(tree.id);const plan=planWholeTreeChop(tree,saved);if(!plan)return null;const job=Promise.resolve().then(()=>this.persist(plan)).then(()=>plan).finally(()=>this.pending.delete(tree.id));this.pending.set(tree.id,job);return job;}
}
