// Isolated proposed browser contract, not yet integrated into Aetherbound.
export class TerrainPublishLedger {
  constructor(){ this.serial=0; this.active=new Map(); this.resident=new Map(); this.visible=new Set(); this.groups=new Map(); }
  request(key,revision,lod){
    if(typeof key!=='string'||!Number.isSafeInteger(revision)||revision<0||!Number.isInteger(lod)) throw new TypeError('Invalid tile identity');
    const token=Object.freeze({key,revision,lod,serial:++this.serial});
    this.active.set(key,token); return token;
  }
  current(token){ const a=this.active.get(token?.key); return !!a && a.serial===token.serial && a.revision===token.revision && a.lod===token.lod; }
  ready(key){ const a=this.active.get(key), r=this.resident.get(key); return !!a && r?.token===a; }
  staged(key){ return [...this.groups.values()].some(g=>g.children.includes(key)); }
  publish(token,payload){
    if(!this.current(token)) return false;
    this.resident.set(token.key,{token:this.active.get(token.key),payload});
    if(!this.staged(token.key)) this.visible.add(token.key);
    this.tryCommit(); return true;
  }
  replace(coarseKey,children){
    if(!this.visible.has(coarseKey)||!this.resident.has(coarseKey)) throw new Error('A visible coarse fallback is required');
    if(!children.length||new Set(children).size!==children.length||children.includes(coarseKey)) throw new Error('Invalid coverage set');
    if(children.some(k=>!this.active.has(k))) throw new Error('Request every child before replacement');
    if(this.groups.has(coarseKey)||children.some(k=>this.staged(k))) throw new Error('Overlapping replacement');
    this.groups.set(coarseKey,{children:[...children]});
    children.forEach(k=>this.visible.delete(k)); this.tryCommit();
  }
  tryCommit(){
    for(const [coarse,g] of this.groups){
      if(!g.children.every(k=>this.ready(k))) continue;
      // One owner-thread operation. No renderer sees a half-updated coverage set.
      this.visible.delete(coarse); g.children.forEach(k=>this.visible.add(k));
      this.active.delete(coarse); this.resident.delete(coarse); this.groups.delete(coarse);
    }
  }
  cancelReplacement(coarse){
    const g=this.groups.get(coarse); if(!g) return false;
    this.groups.delete(coarse);
    for(const key of g.children){this.active.delete(key);this.resident.delete(key);this.visible.delete(key);}
    return true;
  }
  unload(key){
    // Unloading a member aborts pending refinement but retains parent coverage.
    for(const [coarse,g] of [...this.groups]) if(coarse===key||g.children.includes(key)) this.cancelReplacement(coarse);
    this.active.delete(key); this.resident.delete(key); this.visible.delete(key);
  }
  snapshot(){ return [...this.visible].sort().map(key=>({key,...this.resident.get(key)})); }
}
