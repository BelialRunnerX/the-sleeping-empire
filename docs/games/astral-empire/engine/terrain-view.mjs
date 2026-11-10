import { publicationGroup } from "./terrain-publication.mjs";
import { patchTerrainMesh, dirtyBlockBoxes } from "./terrain-patch.mjs";
import { terrainBands } from "./terrain-bands.mjs";
import { terrainProfile } from "./terrain-profiles.mjs";
import * as T from '../vendor/three.module.js';
import { TerrainPublishLedger } from './terrain-ledger.mjs';
import { parseTerrainBlockKey } from './terrain-volume.mjs';
const TILE=8;
export class TerrainRenderer {
  constructor(scene,state,volume,canvas,onCoverage,groundMaterial) {
    Object.assign(this,{scene,state,volume,canvas,onCoverage});this.profile=terrainProfile(state.realm);this.surfaceColor=new T.Color(this.profile.surface);this.stoneColor=new T.Color(this.profile.stone);this.ledger=new TerrainPublishLedger();this.records=new Map();this.queue=[];this.busy=false;this.disposed=false;this.serial=0;
    this.material=groundMaterial ? groundMaterial.clone() : new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:true});
    if(groundMaterial)this.material.onBeforeCompile=groundMaterial.onBeforeCompile;
    try {this.worker=new Worker(new URL('./terrain-worker.mjs',import.meta.url),{type:'module'});this.worker.onmessage=e=>this.publish(e.data);this.worker.onerror=()=>{canvas.dataset.terrainError='worker';this.busy=false;};}catch{canvas.dataset.terrainError='unsupported';}
  }
  covered(x,z){return !!this.records.get(Math.floor(x/TILE)+':'+Math.floor(z/TILE))?.mesh;}
  request(record,refined,signature) {
    record.signature=signature;record.pendingResult=null;
    const token=this.ledger.request(record.key,++this.serial,refined.length?1:0);record.token=token;
    this.queue=this.queue.filter(j=>j.token.key!==record.key);
    const blocks={};for(const [key,entry] of Object.entries(this.volume.data.blocks)){const p=parseTerrainBlockKey(key);if(p&&p.every((n,i)=>n>=record.bounds.min[i]-1&&n<record.bounds.max[i]+1))blocks[key]={fill:entry.fill,cells:{...entry.cells}};}
    const store={version:1,realms:{[this.state.realm]:{blocks}}};
    this.queue.push({token,seed:this.state.seed,realm:this.state.realm,store,bounds:{min:[...record.bounds.min],max:[...record.bounds.max]},bands:record.bands.map(b=>({min:[...b.min],max:[...b.max]})),refined});this.pump();
  }
  pump(){if(this.busy||!this.worker||this.disposed)return;while(this.queue.length){const job=this.queue.shift();if(!this.ledger.current(job.token))continue;this.busy=true;this.worker.postMessage(job);break;}}
  publish(result) {
    this.busy=false;if(this.disposed)return;
    const record=this.records.get(result.token.key);
    if(result.error){this.canvas.dataset.terrainError=result.error;this.pump();return;}
    if(record&&this.ledger.current(result.token))record.pendingResult=result;
    this.drainPublications();this.pump();
  }
  publicationDependencies(record) {
    const deps=new Set(),[tx,tz]=record.key.split(':').map(Number);
    for(const key of Object.keys(this.volume.data.blocks)){
      const p=parseTerrainBlockKey(key);if(!p||Math.floor(p[0]/TILE)!==tx||Math.floor(p[2]/TILE)!==tz)continue;
      const x=p[0]-tx*TILE,z=p[2]-tz*TILE;
      if(x===0)deps.add((tx-1)+':'+tz);if(x===TILE-1)deps.add((tx+1)+':'+tz);
      if(z===0)deps.add(tx+':'+(tz-1));if(z===TILE-1)deps.add(tx+':'+(tz+1));
    }return deps;
  }
  drainPublications() {
    for(const record of this.records.values()){
      if(!record.pendingResult)continue;
      const group=publicationGroup(record,this.records,r=>this.publicationDependencies(r),token=>this.ledger.current(token));
      if(!group)continue;
      // Prepare every replacement before touching visible geometry.
      const prepared=[];
      try{for(const r of group)prepared.push({record:r,result:r.pendingResult,mesh:this.makeMesh(r.pendingResult.mesh)});}
      catch(error){for(const p of prepared)p.mesh.geometry.dispose();this.canvas.dataset.terrainError=String(error.message||error);continue;}
      for(const {record:r,result,mesh} of prepared){
        this.scene.add(mesh);const old=r.mesh;r.mesh=mesh;r.residentBands=result.bands;r.fineLeaves=result.mesh.fineLeaves;r.pendingResult=null;this.ledger.publish(result.token,mesh);
        if(old){this.scene.remove(old);old.geometry.dispose();}
        this.canvas.dataset.terrainBuildMs=result.milliseconds.toFixed(1);
      }
      this.canvas.dataset.terrainReady=String([...this.records.values()].filter(r=>r.mesh).length);
      this.canvas.dataset.terrainFine=String([...this.records.values()].filter(r=>r.mesh&&r.fineLeaves>0).length);
      this.onCoverage(prepared.length===1?prepared[0].record.key:null);
    }
  }
  makeMesh(data) {
      const geometry=new T.BufferGeometry(),{positions,normals}=data;
      geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));
      const colors=new Float32Array(positions.length);for(let i=0;i<colors.length;i+=3){const c=(normals[i+1]>.5?this.surfaceColor:this.stoneColor);colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
      const uv=new Float32Array(positions.length/3*2);for(let i=0,j=0;i<positions.length;i+=3,j+=2){uv[j]=(Math.abs(normals[i])>.5?positions[i+2]:positions[i])/320;uv[j+1]=(Math.abs(normals[i+1])>.5?-positions[i+2]:positions[i+1])/320;}
      geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.computeBoundingSphere();
      const mesh=new T.Mesh(geometry,this.material);mesh.receiveShadow=true;mesh.castShadow=true;
    return mesh;
  }
  preparePatch(candidate,block) {
    const groups=new Map(),prepared=[];
    for(const box of dirtyBlockBoxes(block)){
      const key=Math.floor(box.min[0]/TILE)+':'+Math.floor(box.min[2]/TILE),record=this.records.get(key);
      if(!record?.mesh||!record.residentBands?.some(b=>box.min[1]>=b.min[1]&&box.max[1]<=b.max[1]))return null;
      if(!groups.has(record))groups.set(record,[]);groups.get(record).push(box);
    }
    try {for(const [record,boxes] of groups){const g=record.mesh.geometry,data=patchTerrainMesh(candidate,{positions:g.attributes.position.array,normals:g.attributes.normal.array},boxes);prepared.push({record,mesh:this.makeMesh(data)});}return prepared;}
    catch(error){for(const item of prepared)item.mesh.geometry.dispose();this.canvas.dataset.terrainError=String(error.message||error);return null;}
  }
  commitPatch(prepared) {
    for(const {record,mesh} of prepared){const old=record.mesh;this.scene.add(mesh);record.mesh=mesh;this.scene.remove(old);old.geometry.dispose();}
    this.onCoverage(null,true);
  }
  sync(player) {
    if(this.disposed)return;
    const cx=Math.floor(player.x/TILE),cz=Math.floor(player.z/TILE),wanted=new Set(),candidates=[];
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const x=(cx+dx)*TILE,z=(cz+dz)*TILE;
      const key=(cx+dx)+':'+(cz+dz);wanted.add(key);candidates.push({key,x,z,d:dx*dx+dz*dz});
    }
    // Keep edited blocks and their six face-neighbours inside the fine union.
    // Never hide an edited cave opening behind a generic surface seam curtain.
    const baseWanted=new Set(wanted);
    for(const key of Object.keys(this.volume.data.blocks)){
      const b=parseTerrainBlockKey(key);if(!b||!baseWanted.has(Math.floor(b[0]/8)+':'+Math.floor(b[2]/8)))continue;
      for(const tx of [Math.floor((b[0]-1)/8),Math.floor((b[0]+1)/8)])for(const tz of [Math.floor((b[2]-1)/8),Math.floor((b[2]+1)/8)]){
        const key=tx+':'+tz;if(wanted.has(key))continue;wanted.add(key);candidates.push({key,x:tx*8,z:tz*8,d:(tx-cx)**2+(tz-cz)**2});
      }
    }
    for(const [key,r] of this.records)if(!wanted.has(key)){this.ledger.unload(key);if(r.mesh){this.scene.remove(r.mesh);r.mesh.geometry.dispose();}this.records.delete(key);this.queue=this.queue.filter(j=>j.token.key!==key);this.onCoverage(key);}
    for(const c of candidates.sort((a,b)=>a.d-b.d)){
      let r=this.records.get(c.key);
      if(!r){const h=[this.volume.field.baseHeight(c.x,c.z),this.volume.field.baseHeight(c.x+8,c.z),this.volume.field.baseHeight(c.x,c.z+8),this.volume.field.baseHeight(c.x+8,c.z+8)];r={key:c.key,surfaceMin:Math.min(...h),surfaceMax:Math.max(...h)};this.records.set(c.key,r);}
      const playerFoot=(player.terrainY??this.volume.field.baseHeight(player.x,player.z))+(player.y??0);
      r.bands=terrainBands(c.x,c.z,r.surfaceMin,r.surfaceMax,playerFoot);
      r.bounds={min:[c.x,r.bands[0].min[1],c.z],max:[c.x+8,r.bands.at(-1).max[1],c.z+8]};
      const fine=new Set();
      for(const key of Object.keys(this.volume.data.blocks)){const p=parseTerrainBlockKey(key);if(p&&p.every((n,i)=>n>=r.bounds.min[i]-1&&n<r.bounds.max[i]+1))fine.add(p.join(':'));}
      let localRevision=0;for(const [key,revision] of this.volume.changes){const p=parseTerrainBlockKey(key);if(p&&p.every((n,i)=>n>=r.bounds.min[i]-1&&n<r.bounds.max[i]+1))localRevision=Math.max(localRevision,revision);}
      const refined=[...fine].sort(),signature=refined.join('|')+':'+localRevision+':'+r.bands.map(b=>b.min[1]+','+b.max[1]).join(';');
      if(r.signature!==signature)this.request(r,refined,signature);
    }
    this.drainPublications();
  }
  get meshes(){return [...this.records.values()].flatMap(r=>r.mesh?[r.mesh]:[]);}
  dispose(){this.disposed=true;this.worker?.terminate();for(const [key,r]of this.records){this.ledger.unload(key);if(r.mesh){this.scene.remove(r.mesh);r.mesh.geometry.dispose();}}this.records.clear();this.queue=[];this.material.dispose();}
}
