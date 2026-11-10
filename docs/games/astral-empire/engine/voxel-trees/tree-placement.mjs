import {generateTree} from './voxel-trees.mjs';
export function intersectsProtectedWood(tree,origin,boxes=[]){
 const size=(tree.cellMicro||4)/16;
 for(const c of tree.cells){if(!c.materialId.endsWith('_log'))continue;const x=origin[0]+c.x*size,y=origin[1]+c.y*size,z=origin[2]+c.z*size;
  for(const b of boxes)if(x<b.max[0]&&x+size>b.min[0]&&y<b.max[1]&&y+size>b.min[1]&&z<b.max[2]&&z+size>b.min[2])return true;
 }return false;
}
export function generatePlacedTree(input){
 const boxes=input.protectedBoxes||[],origin=input.origin||input.anchorMicro.map(n=>n/16);
 let last;
 for(let attempt=0;attempt<8;attempt++){
  const tree=last=generateTree({...input,seed:attempt?`${input.seed}:corridor-v1:${attempt}`:input.seed});
  if(!intersectsProtectedWood(tree,origin,boxes))return tree;
 }
 // Rare fallback is real data pruning, not disabled collision or an unharvestable proxy.
 // Keep the root-connected woody component, then only its connected leaf canopy.
 const wood=new Map(last.cells.filter(c=>c.materialId.endsWith('_log')&&!intersectsProtectedWood({...last,cells:[c]},origin,boxes)).map(c=>[c.key,c]));
 const root=[...wood.values()].sort((a,b)=>(Math.abs(a.x)+a.y+Math.abs(a.z))-(Math.abs(b.x)+b.y+Math.abs(b.z)))[0];
 if(!root)throw Error('Authored root intersects protected access; no tree admitted.');
 const neighbors=c=>[[c.x-1,c.y,c.z],[c.x+1,c.y,c.z],[c.x,c.y-1,c.z],[c.x,c.y+1,c.z],[c.x,c.y,c.z-1],[c.x,c.y,c.z+1]].map(p=>p.join(','));
 const connected=new Map([[root.key,root]]),queue=[root];
 for(let i=0;i<queue.length;i++)for(const key of neighbors(queue[i]))if(wood.has(key)&&!connected.has(key)){const c=wood.get(key);connected.set(key,c);queue.push(c);}
 const leaves=new Map(last.cells.filter(c=>!c.materialId.endsWith('_log')).map(c=>[c.key,c]));
 for(let i=0;i<queue.length;i++)for(const key of neighbors(queue[i]))if(leaves.has(key)&&!connected.has(key)){const c=leaves.get(key);connected.set(key,c);queue.push(c);}
 return Object.freeze({...last,id:last.id+':access-pruned-v1',cells:Object.freeze(last.cells.filter(c=>connected.has(c.key)))});
}
// Authored sanctuary roads are deliberate public access envelopes, not invisible collision exceptions.
// Box Y uses the unchanged deterministic ground and includes the full3m body plus headroom.
export function sanctuaryTreeClearance(field){
 const boxes=[],paths=[[-11,4.6,11,4.6],[0,-11,0,13],[-8,-6,0,0],[-3.6,10.5,0,6],[0,6,9,13.8]];
 for(const [ax,az,bx,bz]of paths){const steps=Math.ceil(Math.hypot(bx-ax,bz-az)*2);for(let i=0;i<=steps;i++){
  const x=ax+(bx-ax)*i/steps,z=az+(bz-az)*i/steps,heights=[];
  for(const dx of [-.8,0,.8])for(const dz of [-.8,0,.8])heights.push(field.surfaceHeight(x+dx,z+dz));
  boxes.push({min:[x-.8,Math.min(...heights)-.25,z-.8],max:[x+.8,Math.max(...heights)+3.35,z+.8]});
 }}return boxes;
}
