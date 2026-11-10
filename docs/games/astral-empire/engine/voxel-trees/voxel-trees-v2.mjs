export const REVISION=2, MICRO_PER_M=16, CELL_MICRO=4, MAX_CELLS=24000;
const key=(x,y,z)=>`${x},${y},${z}`;
export function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
// Four-word state avoids reducing an entire forest to one 32-bit morphology seed.
const random=s=>{let a=hash(s+'a'),b=hash(s+'b'),c=hash(s+'c'),d=hash(s+'d');return()=>{a|=0;b|=0;c|=0;d|=0;let t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+(c<<3)|0;c=(c<<21|c>>>11)+t|0;return(t>>>0)/4294967296;};};
export const SPECIES=Object.freeze({
 oak:{log:'minecraft:oak_log',leaf:'minecraft:oak_leaves',shape:'broad',height:5,color:[91,145,79]},
 spruce:{log:'minecraft:spruce_log',leaf:'minecraft:spruce_leaves',shape:'conifer',height:8,color:[58,118,94]},
 acacia:{log:'minecraft:acacia_log',leaf:'minecraft:acacia_leaves',shape:'flat',height:5,color:[132,155,79]},
 emberwood:{log:'elysiumflora:emberwood_log',leaf:'elysiumflora:emberwood_leaves',shape:'broad',height:5,color:[190,112,59]}
});
export function speciesForFeature(feature){if(/taiga|spruce|pine/.test(feature))return 'spruce';if(/savanna/.test(feature))return 'acacia';if(/emberwood/.test(feature))return 'emberwood';if(/plains|forest|swamp|hills/.test(feature))return 'oak';return null;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function generateTree({seed,anchorMicro,species='oak',biomeId,sourceFeature,environment={}}){
 if(!SPECIES[species])throw Error('Unknown species');
 if(!Array.isArray(anchorMicro)||anchorMicro.length!==3||anchorMicro.some(v=>!Number.isSafeInteger(v)||v%4))throw Error('Anchor must align to four microcells');
 // Explicit bounded climate values are adapters, not guessed Minecraft climate conversions.
 const env={};for(const [k,def] of Object.entries({moisture:.5,temperature:.5,wind:.2,season:0})){
 const v=environment[k]??def;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)throw Error('Climate value out of [0,1]: '+k);env[k]=v;}
 const id=JSON.stringify(['tree',REVISION,String(seed),biomeId,sourceFeature,species,...anchorMicro,env]),rng=random(id),s=SPECIES[species],cells=new Map();
 const R=(a,b)=>a+(b-a)*rng(),I=(a,b)=>Math.floor(R(a,b+1));
 const height=I(s.height*3,s.height*5+8),windAngle=R(0,Math.PI*2),lean=R(.02,.17)+env.wind*.15;
 const phenotype=Object.freeze({height,crownSpread:R(.7,1.4),crownDepth:R(.65,1.35),density:clamp(R(.76,.98)+env.moisture*.08,.65,1),branchRise:R(.22,.8),forkChance:R(.3,.85),lobeExponent:R(1.5,3),leafRoughness:R(.03,.17),windAngle,lean,moisture:env.moisture});
 // Two leaf pigment families + bark bands encoded as vertex tints, not extra draw calls.
 const pigment=R(-14,14),autumn=env.season,base=s.color.map((v,i)=>clamp(Math.round(v+pigment+(i===0?autumn*65-env.moisture*12:i===1?-autumn*35+env.moisture*12:env.temperature*-10)),20,230));
 const leafShadow=base.map((v,i)=>clamp(Math.round(v*.97+(i===2?1:0)),15,240));
 const leafLight=base.map((v,i)=>clamp(Math.round(v*1.025+(i===1?1:0)),15,240));
 const barkBases={oak:[111,81,55],spruce:[86,66,53],acacia:[132,113,89],emberwood:[120,71,54]};
 const barkHue=R(-18,18),bark=barkBases[species].map((v,i)=>clamp(Math.round(v+barkHue+(i===1?env.moisture*7:0)),20,220));
 const palette=Object.freeze([leafShadow,leafShadow.map(v=>clamp(v+1,0,255)),leafLight,leafLight.map(v=>clamp(v+1,0,255)),... [.74,.9,1.04,1.17].map(f=>bark.map(v=>Math.round(v*f)))].map(c=>Object.freeze(c)));

 const put=(x,y,z,materialId)=>{x=Math.round(x);y=Math.round(y);z=Math.round(z);if(y<0)return;const k=key(x,y,z),old=cells.get(k);if(old?.materialId===s.log&&materialId!==s.log)return;
 if(!old&&cells.size>=MAX_CELLS)throw Error('Tree cell budget exceeded; do not partially admit');
 const fine=hash(id+k),patch=hash(id+'patch'+key(Math.floor(x/3),Math.floor(y/3),Math.floor(z/3)));
 // Spatial pigment patches break up uniform canopies; bark has vertical grain + coarse mottling.
 const tint=materialId===s.leaf?(patch%2)*2+(fine%2):4+(hash(id+'bark'+key(x,Math.floor(y/4),z))%4);
 cells.set(k,Object.freeze({key:k,x,y,z,materialId,tint}));};
 // Face-connected digital branch lines (diagonal-only voxels cannot support neighbors).
 const line=(a,b,radius=0)=>{let p=a.map(Math.round);const end=b.map(Math.round),n=Math.max(...p.map((v,i)=>Math.abs(v-end[i])));const stamp=()=>{for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++)if(x*x+z*z<=radius*radius+1)put(p[0]+x,p[1],p[2]+z,s.log);};stamp();
 for(let j=1;j<=n;j++){const target=a.map((v,i)=>Math.round(v+(b[i]-v)*j/Math.max(n,1)));for(let axis=0;axis<3;axis++)while(p[axis]!==target[axis]){p[axis]+=Math.sign(target[axis]-p[axis]);stamp();}}};
 const trunkAt=y=>[Math.sin(y/height*1.6)*height*lean*Math.cos(windAngle),y,Math.sin(y/height*1.6)*height*lean*Math.sin(windAngle)];
 const trunkRadius=height>32?I(1,2):1;
 for(let y=0;y<height;y++)line(trunkAt(y),trunkAt(y+1),y<height*.65?trunkRadius:0);
 // A few low buttress roots, all above ground; support policy handles actual terrain admission.
 for(let i=0;i<I(3,5);i++){const a=windAngle+i*2.399;line([Math.cos(a)*R(2,4),0,Math.sin(a)*R(2,4)],trunkAt(4),0);}
 const foliage=(center,rx,ry,rz,phase)=>{const [cx,cy,cz]=center.map(Math.round);rx=Math.max(2,Math.round(rx));ry=Math.max(2,Math.round(ry));rz=Math.max(2,Math.round(rz));
 for(let x=-rx;x<=rx;x++)for(let y=-ry;y<=ry;y++)for(let z=-rz;z<=rz;z++){
 const angle=Math.atan2(z,x),lobes=1+.12*Math.sin(angle*3+phase)+.07*Math.cos(angle*5-phase);
 const e=phenotype.lobeExponent,dist=Math.pow(Math.abs(x/rx),e)+Math.pow(Math.abs(y/ry),e)+Math.pow(Math.abs(z/rz),e);
 const noise=(hash(id+key(cx+x,cy+y,cz+z))%10000)/10000;
 if(dist>lobes*(1-phenotype.leafRoughness+noise*phenotype.leafRoughness*2))continue;
 if(dist>.55&&noise>phenotype.density)continue;put(cx+x,cy+y,cz+z,s.leaf);}};
 let branchCount=0;
 const grow=(from,angle,length,rise,depth)=>{
 branchCount++;const to=[from[0]+Math.cos(angle)*length,from[1]+length*rise,from[2]+Math.sin(angle)*length];
 const mid=from.map((v,i)=>(v+to[i])*.5+(i===1?-R(0,2):R(-1.5,1.5)));line(from,mid,depth>1?1:0);line(mid,to,0);
 if(depth>0&&rng()<phenotype.forkChance){for(const sign of [-1,1])grow(to,angle+sign*R(.35,1.05),length*R(.45,.7),rise+R(-.2,.25),depth-1);}
 const leafScale=R(.7,1.2)*phenotype.crownSpread;
 foliage(to,leafScale*R(3,6),s.shape==='flat'?R(2,3.5):R(3,5)*phenotype.crownDepth,leafScale*R(3,6),angle);};
 if(s.shape==='conifer'){
 const spacing=I(3,6),start=height*R(.28,.48);for(let y=start;y<height-2;y+=spacing){const radius=(height-y)*R(.24,.38)*phenotype.crownSpread,branches=I(3,6),phase=R(0,6.28);for(let i=0;i<branches;i++){const a=phase+i*6.28/branches,p=trunkAt(y),tip=[p[0]+Math.cos(a)*radius,p[1]+R(-1,2),p[2]+Math.sin(a)*radius];line(p,tip);branchCount++;foliage(tip,R(2,4),R(2,3),R(2,4),a);}}foliage(trunkAt(height),2,3,2,0);
 }else{
 const count=I(4,8),start=R(.4,.65),phase=R(0,6.28);for(let i=0;i<count;i++){const y=height*(start+(1-start)*i/count)*R(.9,1),a=phase+i*2.399+R(-.4,.4);grow(trunkAt(y),a,R(5,11)*phenotype.crownSpread,s.shape==='flat'?R(.05,.3):phenotype.branchRise,1);}
 foliage(trunkAt(height),R(3,6),R(3,5),R(3,6),phase);
 }
 const list=Object.freeze([...cells.values()].sort((a,b)=>a.y-b.y||a.z-b.z||a.x-b.x));
 const bounds=Object.freeze({min:[0,1,2].map(i=>anchorMicro[i]+4*Math.min(...list.map(c=>[c.x,c.y,c.z][i]))),max:[0,1,2].map(i=>anchorMicro[i]+4*(1+Math.max(...list.map(c=>[c.x,c.y,c.z][i]))))});
 return Object.freeze({id,revision:REVISION,species,biomeId,sourceFeature,environment:Object.freeze(env),phenotype,palette,branchCount,anchorMicro:Object.freeze([...anchorMicro]),ownerChunk:anchorMicro.map(v=>Math.floor(v/512)).join(','),bounds,cells:list});
}
export function createTreeState(tree,saved){
 if(saved&&(saved.treeId!==tree.id||saved.revision!==REVISION))throw Error('Tree save identity/revision mismatch');
 const base=new Map(tree.cells.map(c=>[c.key,c])),removed=new Set(saved?.removed??[]);
 if([...removed].some(k=>!base.has(k)))throw Error('Invalid removed cell');
 const world=c=>[c.x,c.y,c.z].map((v,i)=>v*4+tree.anchorMicro[i]);
 const sample=(x,y,z)=>{const p=[x,y,z].map((v,i)=>Math.floor((v-tree.anchorMicro[i])/4)),k=key(...p);return removed.has(k)?null:base.get(k)?.materialId??null;};
 const cut=keys=>{const units={};const changed=[];for(const k of keys){const c=base.get(k);if(!c||removed.has(k))continue;removed.add(k);changed.push(k);units[c.materialId]=(units[c.materialId]??0)+64;}return {treeId:tree.id,changed,units,unit:'microvoxel-volume',microvoxelsPerCubicMetre:4096,sourceFeature:tree.sourceFeature};};
 return {sample,cutCells:cut,fell:()=>cut(base.keys()),save:()=>({treeId:tree.id,revision:REVISION,removed:[...removed].sort()}),boxes:()=>tree.cells.filter(c=>!removed.has(c.key)).map(c=>({min:world(c),max:world(c).map(v=>v+4),materialId:c.materialId,tint:c.tint,treeId:tree.id,key:c.key}))};
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
 for(const b of boxes)for(const normal of dirs){const p=b.min.map((v,i)=>v+1+normal[i]*4);if(state.sample(...p)===null)faces.push({...b,normal});}return faces;}

