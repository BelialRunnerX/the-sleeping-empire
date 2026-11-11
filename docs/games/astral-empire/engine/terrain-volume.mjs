// Stable 32m persistence chunks, 1m blocks, 16^3 microcells. Field and renderer
// are separate: untouched space always comes from the continuous baseline.
export const TERRAIN_MICRO = 16, TERRAIN_UNITS = 4096, TERRAIN_CHUNK = 32;
const mod=(n,d)=>((n%d)+d)%d;
const EMPTY_BLOCK=new Uint8Array(4096),FULL_BLOCK=new Uint8Array(4096).fill(1);
export function terrainAddress(p) {
  const block=p.map(n=>Math.floor(n/16));
  return {chunk:block.map(n=>Math.floor(n/32)),block:block.map(n=>mod(n,32)),micro:p.map(n=>mod(n,16))};
}
export function terrainBlockKey(block) {
  return [...block.map(n=>Math.floor(n/32)),...block.map(n=>mod(n,32))].join(':');
}
export function parseTerrainBlockKey(key) {
  const a=key.split(':').map(Number);
  if(a.length!==6||a.some(n=>!Number.isSafeInteger(n))||a.slice(3).some(n=>n<0||n>=32))return null;
  const p=a.slice(0,3).map((n,i)=>n*32+a[i+3]);
  return p.every(n=>Number.isSafeInteger(n*16)&&Math.abs(n)<2**30)?p:null;
}
export function normalizeTerrainDeltas(raw) {
  const realms={};
  for(const [realm,input] of Object.entries(raw?.realms||{})) {
    if(!['bastion','moon','cinder','frost','orbit'].includes(realm))continue;
    const blocks={};
    for(const [key,entry] of Object.entries(input?.blocks||{})) {
      const p=parseTerrainBlockKey(key);if(!p||!entry||typeof entry!=='object')continue;
      const fill=entry.fill===0||entry.fill===1?entry.fill:null,cells={};
      for(const [i,v] of Object.entries(entry.cells||{}))if(/^\d+$/.test(i)&&Number(i)<4096&&(v===0||v===1)&&v!==fill)cells[Number(i)]=v;
      if(fill!==null||Object.keys(cells).length)blocks[terrainBlockKey(p)]={fill,cells};
    }
    realms[realm]={blocks};
  }
  return {version:1,realms,stoneUnits:Number.isSafeInteger(raw?.stoneUnits)&&raw.stoneUnits>=0&&raw.stoneUnits<4096?raw.stoneUnits:0};
}
export class TerrainVolume {
  constructor(store, realm, field, {cacheBlocks=256}={}) {
    this.cacheBlocks=Math.max(1,Math.min(2048,Math.floor(cacheBlocks)||256));
    this.store=store;this.realm=realm;this.field=field;this.revision=0;this.changes=new Map();this.collisionCache=new Map();this.uniformCache=new Map();
    this.data=store.realms[realm] ||= {blocks:{}};
  }
  fork() {
    const blocks=Object.fromEntries(Object.entries(this.data.blocks).map(([key,value])=>[key,{fill:value.fill,cells:{...value.cells}}]));
    const store={...this.store,realms:{...this.store.realms,[this.realm]:{blocks}}},candidate=new TerrainVolume(store,this.realm,this.field,{cacheBlocks:this.cacheBlocks});
    candidate.collisionCache=new Map(this.collisionCache);candidate.uniformCache=new Map(this.uniformCache);candidate.revision=this.revision;candidate.baseRevision=this.revision;
    return candidate;
  }
  commitFrom(candidate) {
    if(candidate.realm!==this.realm||candidate.field!==this.field||candidate.baseRevision!==this.revision)throw new Error('terrain candidate mismatch or stale revision');
    this.store.realms[this.realm]=candidate.data;this.store.stoneUnits=candidate.store.stoneUnits;this.data=candidate.data;
    this.collisionCache=candidate.collisionCache;this.uniformCache=candidate.uniformCache;this.revision++;
    for(const key of candidate.changes.keys())this.changes.set(key,this.revision);
  }
  address(p) { const b=p.map(n=>Math.floor(n/16));return {key:terrainBlockKey(b),index:mod(p[0],16)+16*(mod(p[1],16)+16*mod(p[2],16)),block:b}; }
  material(p) {
    const a=this.address(p),edit=this.data.blocks[a.key];
    if(this.uniformCache.has(a.key))return this.uniformCache.get(a.key);
    const cached=this.collisionCache.get(a.key);if(cached)return cached[a.index];
    if(edit&&Object.hasOwn(edit.cells,a.index))return edit.cells[a.index];
    if(edit?.fill!==null&&edit?.fill!==undefined)return edit.fill;
    return this.field((p[0]+.5)/16,(p[1]+.5)/16,(p[2]+.5)/16)>0?1:0;
  }
  set(p,value) {
    if(!p.every(Number.isSafeInteger)||![0,1].includes(value)||this.material(p)===value)return false;
    const a=this.address(p),edit=this.data.blocks[a.key] ||= {fill:null,cells:{}};
    const base=edit.fill??(this.field((p[0]+.5)/16,(p[1]+.5)/16,(p[2]+.5)/16)>0?1:0);
    if(value===base)delete edit.cells[a.index];else edit.cells[a.index]=value;
    if(edit.fill===null&&!Object.keys(edit.cells).length)delete this.data.blocks[a.key];
    this.collisionCache.delete(a.key);this.uniformCache.delete(a.key);this.revision++;this.changes.set(a.key,this.revision);return true;
  }
  fillBlock(block,value) {
    if(!block.every(Number.isSafeInteger)||![0,1].includes(value))return 0;
    let changed=0;
    for(let z=0;z<16;z++)for(let y=0;y<16;y++)for(let x=0;x<16;x++)
      if(this.material([block[0]*16+x,block[1]*16+y,block[2]*16+z])!==value)changed++;
    if(changed){this.data.blocks[terrainBlockKey(block)]={fill:value,cells:{}};this.collisionCache.delete(terrainBlockKey(block));this.uniformCache.delete(terrainBlockKey(block));this.revision++;this.changes.set(terrainBlockKey(block),this.revision);}
    return changed;
  }
  blockData(block) {
    const key=terrainBlockKey(block);if(this.collisionCache.has(key))return this.collisionCache.get(key);
    if(this.uniformCache.has(key))return this.uniformCache.get(key)?FULL_BLOCK:EMPTY_BLOCK;
    const edit=this.data.blocks[key];
    if(!edit&&this.field.uniformBlock){const uniform=this.field.uniformBlock(block);if(uniform===0||uniform===1){if(this.uniformCache.size>=4096)this.uniformCache.delete(this.uniformCache.keys().next().value);this.uniformCache.set(key,uniform);return uniform?FULL_BLOCK:EMPTY_BLOCK;}}
    const data=new Uint8Array(4096);
    if(edit?.fill!==null&&edit?.fill!==undefined)data.fill(edit.fill);
    else for(let z=0;z<16;z++)for(let y=0;y<16;y++)for(let x=0;x<16;x++)data[x+16*(y+16*z)]=this.field(block[0]+(x+.5)/16,block[1]+(y+.5)/16,block[2]+(z+.5)/16)>0?1:0;
    if(edit)for(const [index,value] of Object.entries(edit.cells))data[index]=value;
    if(data.every(n=>n===data[0])){if(this.uniformCache.size>=4096)this.uniformCache.delete(this.uniformCache.keys().next().value);this.uniformCache.set(key,data[0]);return data[0]?FULL_BLOCK:EMPTY_BLOCK;}
    if(this.collisionCache.size>=this.cacheBlocks)this.collisionCache.delete(this.collisionCache.keys().next().value);
    this.collisionCache.set(key,data);return data;
  }
  blockIsUniform(block) {
    const data=this.blockData(block);
    return data===EMPTY_BLOCK||data===FULL_BLOCK;
  }
  occupied(min,max) {
    const lo=min.map(n=>Math.floor(n*16)),hi=max.map(n=>Math.ceil(n*16)-1),b0=lo.map(n=>Math.floor(n/16)),b1=hi.map(n=>Math.floor(n/16));
    for(let bz=b0[2];bz<=b1[2];bz++)for(let by=b0[1];by<=b1[1];by++)for(let bx=b0[0];bx<=b1[0];bx++){
      const data=this.blockData([bx,by,bz]);
      for(let z=Math.max(0,lo[2]-bz*16);z<=Math.min(15,hi[2]-bz*16);z++)for(let y=Math.max(0,lo[1]-by*16);y<=Math.min(15,hi[1]-by*16);y++)for(let x=Math.max(0,lo[0]-bx*16);x<=Math.min(15,hi[0]-bx*16);x++)if(data[x+16*(y+16*z)])return true;
    }return false;
  }
  ray(origin,direction,range=8) {
    const len=Math.hypot(...direction);if(!Number.isFinite(len)||!len||!origin.every(Number.isFinite)||!Number.isFinite(range)||range<0)return null;
    const d=direction.map(n=>n/len),p=origin.map(n=>Math.floor(n*16)),step=d.map(Math.sign),delta=d.map(n=>n?1/(Math.abs(n)*16):Infinity),next=d.map((n,i)=>n?((p[i]+(n>0?1:0))/16-origin[i])/n:Infinity);
    let distance=0,normal=[0,0,0];while(distance<=range){if(this.material(p))return {cell:[...p],normal,distance};const a=next[0]<=next[1]&&next[0]<=next[2]?0:next[1]<=next[2]?1:2;distance=next[a];p[a]+=step[a];next[a]+=delta[a];normal=[0,0,0];normal[a]=-step[a];}return null;
  }
}
