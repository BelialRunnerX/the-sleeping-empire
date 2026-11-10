import {generateTree as generateV2} from './voxel-trees-v2.mjs';
import {generateTree as generateDetailed} from './voxel-trees-detailed-core.mjs';
export {hash,speciesForFeature,SPECIES} from './voxel-trees-v2.mjs';
export const REVISION=3, MICRO_PER_M=16, CELL_MICRO=3, MAX_CELLS=192000;
export const HEIGHT_RANGES=Object.freeze({oak:[6,12],spruce:[9,15],acacia:[6,10.5],emberwood:[6,12],shrub:[1.3125,1.6875]});
export function generateTree(input){
 const old=generateV2(input),detailed=generateDetailed(input),range=HEIGHT_RANGES[input.growthForm==='shrub'?'shrub':old.species];
 const oldHeight=(old.bounds.max[1]-old.bounds.min[1])/16;
 const target=Math.max(range[0],Math.min(range[1],oldHeight*1.5));
 const targetCells=Math.round(target*16/CELL_MICRO),oldCells=(detailed.bounds.max[1]-detailed.bounds.min[1])/3,factor=targetCells/oldCells;
 const cells=new Map();
 for(const c of detailed.cells){const lo=[c.x,c.y,c.z].map(v=>Math.floor(v*factor)),hi=[c.x,c.y,c.z].map(v=>Math.floor((v+1)*factor));
 for(let y=lo[1];y<hi[1];y++)for(let z=lo[2];z<hi[2];z++)for(let x=lo[0];x<hi[0];x++){const key=`${x},${y},${z}`;cells.set(key,{...c,key,x,y,z});if(cells.size>MAX_CELLS)throw Error('Tree cell budget exceeded; no partial admission');}}
 const list=[...cells.values()].sort((a,b)=>a.y-b.y||a.z-b.z||a.x-b.x),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const c of list)[c.x,c.y,c.z].forEach((v,i)=>{min[i]=Math.min(min[i],old.anchorMicro[i]+v*3);max[i]=Math.max(max[i],old.anchorMicro[i]+(v+1)*3);});
 return {...old,id:JSON.stringify(['tree',REVISION,old.id,input.growthForm??'tree']),revision:REVISION,cellMicro:CELL_MICRO,legacyIds:[old.id],growthForm:input.growthForm??'tree',bounds:{min,max},cells:list,scaleAudit:{oldHeight,targetHeight:target,actualHeight:(max[1]-min[1])/16,factor,range}};
}

const key=(x,y,z)=>`${x},${y},${z}`;
export function createTreeState(tree,saved){
 if(saved&&(saved.treeId!==tree.id||saved.revision!==REVISION))throw Error('Tree save identity/revision mismatch');
 const base=new Map(tree.cells.map(c=>[c.key,c])),removed=new Set(saved?.removed??[]);
 if([...removed].some(k=>!base.has(k)))throw Error('Invalid removed cell');
 const world=c=>[c.x,c.y,c.z].map((v,i)=>v*CELL_MICRO+tree.anchorMicro[i]);
 const sample=(x,y,z)=>{const p=[x,y,z].map((v,i)=>Math.floor((v-tree.anchorMicro[i])/CELL_MICRO)),k=key(...p);return removed.has(k)?null:base.get(k)?.materialId??null;};
 const cut=keys=>{const units={};const changed=[];for(const k of keys){const c=base.get(k);if(!c||removed.has(k))continue;removed.add(k);changed.push(k);units[c.materialId]=(units[c.materialId]??0)+CELL_MICRO**3;}return {treeId:tree.id,changed,units,unit:'microvoxel-volume',microvoxelsPerCubicMetre:4096,sourceFeature:tree.sourceFeature};};
 return {sample,cutCells:cut,fell:()=>cut(base.keys()),save:()=>({treeId:tree.id,revision:REVISION,removed:[...removed].sort()}),boxes:()=>tree.cells.filter(c=>!removed.has(c.key)).map(c=>({min:world(c),max:world(c).map(v=>v+CELL_MICRO),materialId:c.materialId,tint:c.tint,treeId:tree.id,key:c.key}))};
}
// Must be checked before committing ANY feature writes; callback owns real support/slope/structure policy.
export function acceptPlacement(tree,{support,air,protectedBox}){
 if(!support||!air||!protectedBox)throw Error('All placement policies required');
 if(!support(tree.anchorMicro,tree))return false;
 for(const box of createTreeState(tree).boxes())if(protectedBox(box)||!air(box))return false;
 return true;
}
// Surface-only quads; caller batches by material, frustum/occlusion culls tree bounds and greedy-merges.
export function exposedFaces(tree,state){const boxes=state.boxes(),faces=[];const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 for(const b of boxes)for(const normal of dirs){const p=b.min.map((v,i)=>v+1+normal[i]*CELL_MICRO);if(state.sample(...p)===null)faces.push({...b,normal});}return faces;}

