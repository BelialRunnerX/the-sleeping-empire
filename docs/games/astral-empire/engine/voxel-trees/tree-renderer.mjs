// Three is injected; copy this folder unchanged under engine/voxel-trees/.
export class VoxelTreeRenderer {
 constructor(T,{seed,realm='bastion',maxNear=16,maxDistance=40,onReady=()=>{},canPublish=()=>true,onError=console.warn,workerFactory=()=>new Worker(new URL('./tree-worker.mjs',import.meta.url),{type:'module'})}={}){
 this.T=T;this.seed=seed;this.realm=realm;this.maxNear=maxNear;this.maxDistance=maxDistance;this.onReady=onReady;this.canPublish=canPublish;this.onError=onError;this.entries=new Map();this.serial=0;this.pending=null;this.player={x:0,z:0};this.material=new T.MeshLambertMaterial({vertexColors:true});this.worker=workerFactory();this.worker.onmessage=e=>this.receive(e.data);this.worker.onerror=e=>{this.onError(e);if(this.pending){this.pending.entry.failed=true;this.pending=null;}this.pump();};}
 attach(group,d,{saved,felled=false,environment,species}={}){
 if(felled)return()=>{};const id=String(d.id),old=this.entries.get(id);if(old)this.detach(id);
 const kind=species||(this.realm==='frost'?'spruce':this.realm==='cinder'?'emberwood':'oak');
 const input={seed:`${this.seed}:${this.realm}:${id}`,anchorMicro:[Math.round(d.x*4)*4,Math.round(group.position.y*4)*4,Math.round(d.z*4)*4],species:kind,biomeId:`browser:${this.realm}`,sourceFeature:'browser-adaptation:existing-node-placement',environment};
 const entry={id,group,d,input,saved,fallback:[...group.children],mesh:null,tree:null,deferred:null,failed:false};this.entries.set(id,entry);this.pump();return()=>this.detach(id);}
 update(x,z){this.player={x,z};for(const e of this.entries.values())if(e.deferred&&Math.hypot(e.d.x-x,e.d.z-z)>this.maxDistance*1.3)e.deferred=null;for(const e of this.entries.values())if(e.mesh&&Math.hypot(e.d.x-x,e.d.z-z)>this.maxDistance*1.3){e.group.remove(e.mesh);e.mesh.geometry.dispose();e.mesh=null;e.tree=null;e.fallback.forEach(o=>o.visible=true);}this.pump();}
 allows(e,r){try{return this.canPublish(e,r)===true;}catch(error){this.onError(error);return false;}}
 pump(){if(!this.worker)return;for(const e of this.entries.values())if(e.deferred&&this.allows(e,e.deferred)){const r=e.deferred;e.deferred=null;this.publish(e,r);}if(this.pending)return;let count=0;const queue=[];for(const e of this.entries.values()){if(e.mesh||e.deferred)count++;else if(!e.failed&&Math.hypot(e.d.x-this.player.x,e.d.z-this.player.z)<=this.maxDistance)queue.push(e);}if(count>=this.maxNear)return;queue.sort((a,b)=>Math.hypot(a.d.x-this.player.x,a.d.z-this.player.z)-Math.hypot(b.d.x-this.player.x,b.d.z-this.player.z));const entry=queue[0];if(!entry)return;const job=++this.serial;this.pending={job,entry};this.worker.postMessage({job,input:entry.input,saved:entry.saved});}
 receive({job,result,error}){const p=this.pending;if(!p||p.job!==job)return;this.pending=null;const e=p.entry;if(this.entries.get(e.id)!==e){this.pump();return;}if(error){e.failed=true;this.onError(error);this.pump();return;}
 if(!this.allows(e,result)){e.deferred=result;this.pump();return;}this.publish(e,result);this.pump();}
 publish(e,result){
 const T=this.T,g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(result.position,3));g.setAttribute('normal',new T.BufferAttribute(result.normal,3));g.setAttribute('color',new T.BufferAttribute(result.color,3));g.setIndex(new T.BufferAttribute(result.index,1));g.computeBoundingSphere();g.computeBoundingBox();const mesh=new T.Mesh(g,this.material);mesh.name='procedural-voxel-tree';mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.voxelTreeId=result.tree.id;
 // Keep old mesh until a complete replacement exists; never remove unrelated future children.
 e.fallback.forEach(o=>o.visible=false);e.group.add(mesh);e.mesh=mesh;e.tree=result.tree;this.onReady(e,result);}
 detach(id){const e=this.entries.get(String(id));if(!e)return;this.entries.delete(String(id));if(e.mesh){e.group.remove(e.mesh);e.mesh.geometry.dispose();}e.fallback.forEach(o=>o.visible=true);}
 dispose(){for(const id of [...this.entries.keys()])this.detach(id);this.worker?.terminate();this.worker=null;this.pending=null;this.material.dispose();}
}
