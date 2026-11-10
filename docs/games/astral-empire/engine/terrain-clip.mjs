// Pure isolated geometry utility. Vertex = [x,y,z,...linearly interpolated attributes].
// Closed AABB owns coincident faces: replacement patch must include them.
// Inputs are not mutated. Normalize interpolated normals in caller if desired.
const cross=(a,b,c)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
const viable=t=>cross(...t).some(n=>n!==0);
function clean(poly){return poly.filter((p,i)=>{const q=poly[(i+poly.length-1)%poly.length];return p[0]!==q[0]||p[1]!==q[1]||p[2]!==q[2];});}
function split(poly,axis,bound,sign){
 const inside=[],outside=[];let hasOutside=false;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign;
  if(da>=0)inside.push(a);if(da<=0)outside.push(a);if(da<0)hasOutside=true;
  if((da<0&&db>0)||(da>0&&db<0)){
   const t=da/(da-db),p=a.map((v,k)=>v+(b[k]-v)*t);p[axis]=bound;inside.push(p);outside.push(p);
  }
 }
 return [clean(inside),hasOutside?clean(outside):[]];
}
function fan(poly){const out=[];for(let i=1;i<poly.length-1;i++){const t=[poly[0],poly[i],poly[i+1]];if(viable(t))out.push(t);}return out;}
function validateBox(b){if(!b?.min||!b?.max||b.min.length!==3||b.max.length!==3||b.min.some((n,i)=>!Number.isFinite(n)||!Number.isFinite(b.max[i])||n>=b.max[i]))throw new RangeError('Nonempty finite AABB required');}
function disjoint(t,b){return [0,1,2].some(a=>t.every(p=>p[a]<b.min[a])||t.every(p=>p[a]>b.max[a]));}
function outsideVoxelOwner(t,b){
 // Solid voxels own their outward-oriented face. Exact dyadic cell boundaries,
 // not epsilon expansion: preserve an unpatched neighbor's boundary face.
 const n=cross(...t);
 for(let axis=0;axis<3;axis++){
  if(n[axis]>0&&t.every(p=>p[axis]===b.min[axis]))return true;
  if(n[axis]<0&&t.every(p=>p[axis]===b.max[axis]))return true;
 }
 return false;
}
function subtract(t,b,voxelOwnership=false){
 if(voxelOwnership&&outsideVoxelOwner(t,b))return [t];
 if(disjoint(t,b))return [t];let pending=t;const out=[];
 for(let axis=0;axis<3;axis++)for(const [bound,sign]of [[b.min[axis],1],[b.max[axis],-1]]){
  const [inside,outside]=split(pending,axis,bound,sign);out.push(...fan(outside));pending=inside;if(pending.length<3)return out;
 }
 return out;
}
export function subtractAABB(triangle,box){validateBox(box);return viable(triangle)?subtract(triangle,box):[];}
export function subtractAABBUnion(triangles,boxes,{voxelOwnership=false}={}){
 boxes.forEach(validateBox);const out=[];
 if(!boxes.length)return triangles.filter(viable);
 const union={min:[0,1,2].map(a=>Math.min(...boxes.map(b=>b.min[a]))),max:[0,1,2].map(a=>Math.max(...boxes.map(b=>b.max[a])))};
 for(const triangle of triangles){
  if(!viable(triangle))continue;
  if(disjoint(triangle,union)){out.push(triangle);continue;}
  let pieces=[triangle];for(const box of boxes){if(disjoint(triangle,box))continue;pieces=pieces.flatMap(t=>subtract(t,box,voxelOwnership));if(!pieces.length)break;}out.push(...pieces);
 }return out;
}
// Surface edits affect the containing block and six face-neighbors.
export function dirtyBlockBoxes([x,y,z]){return [[x,y,z],[x-1,y,z],[x+1,y,z],[x,y-1,z],[x,y+1,z],[x,y,z-1],[x,y,z+1]].map(min=>({min,max:min.map(n=>n+1)}));}

// Single-triangle APIs; union mesh API above avoids repeated broadphase setup.
export const subtractBoxes=(triangle,boxes)=>subtractAABBUnion([triangle],boxes);
export const subtractVoxelBoxes=(triangle,boxes)=>subtractAABBUnion([triangle],boxes,{voxelOwnership:true});
