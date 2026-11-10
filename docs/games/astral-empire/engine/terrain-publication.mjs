// Publication dependency group: existing resident meshes satisfy a neighbor;
// mutually pending first-load neighbors publish together, never deadlock.
export function publicationGroup(seed,records,dependencies,isCurrent){
 if(records.get(seed.key)!==seed)return null;
 const group=[],seen=new Set();
 function visit(record){
  if(seen.has(record.key))return true;
  if(!record.pendingResult||!isCurrent(record.pendingResult.token))return false;
  seen.add(record.key);group.push(record);
  for(const key of dependencies(record)){
   const neighbor=records.get(key);
   if(!neighbor||neighbor.mesh)continue;
   if(!visit(neighbor))return false;
  }return true;
 }
 return visit(seed)?group:null;
}
