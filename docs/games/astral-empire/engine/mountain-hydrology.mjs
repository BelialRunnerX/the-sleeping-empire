// Isolated, versioned planar macro atlas. Browser adaptation, not native parity.
export const VERSION = 'continental-drainage-v2';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function hash(x,z,s){let h=Math.imul(x,374761393)^Math.imul(z,668265263)^s;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function noise(x,z,s){const i=Math.floor(x),j=Math.floor(z),u=smooth(x-i),v=smooth(z-j);const a=hash(i,j,s),b=hash(i+1,j,s),c=hash(i,j+1,s),d=hash(i+1,j+1,s);return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;}
class Heap { constructor(){this.a=[]} push(id,h){let i=this.a.length;this.a.push([id,h]);while(i){const p=(i-1)>>1;if(this.less(this.a[p],this.a[i]))break;[this.a[p],this.a[i]]=[this.a[i],this.a[p]];i=p}} less(a,b){return a[1]<b[1]||(a[1]===b[1]&&a[0]<b[0])} pop(){const a=this.a,r=a[0],t=a.pop();if(a.length){a[0]=t;let i=0;for(;;){let c=2*i+1;if(c>=a.length)break;if(c+1<a.length&&this.less(a[c+1],a[c]))c++;if(this.less(a[i],a[c]))break;[a[i],a[c]]=[a[c],a[i]];i=c}}return r} }
export function createAtlas(options={}) {
 const c={seed:1701,n:257,size:32768,sea:0,peak:1100,oceanDepth:180,water:true,riverThreshold:16,maxRiverDepth:7,...options};
 if(!Number.isInteger(c.n)||c.n<9||c.n>513||!(c.size>0)||!Number.isFinite(c.size)||!(c.peak>0)||!(c.oceanDepth>0)||!Number.isFinite(c.sea)||!Number.isInteger(c.seed)||!(c.riverThreshold>=1)||!(c.maxRiverDepth>0))throw Error('Invalid atlas configuration');
 for(const key of ['peak','oceanDepth','riverThreshold','maxRiverDepth'])if(!Number.isFinite(c[key]))throw Error('Finite configuration required');
 const n=c.n,N=n*n,step=c.size/(n-1),raw=new Float64Array(N),filled=new Float64Array(N),bed=new Float64Array(N),water=new Float64Array(N).fill(NaN),parent=new Int32Array(N).fill(-1),rank=new Int32Array(N),outlet=new Int32Array(N),flow=new Float64Array(N).fill(1),seen=new Uint8Array(N),order=[],heap=new Heap();
 // Broad irregular continents from overlapping warped continental lobes.
 // Long chains are predominantly cardinal, not a radial central mountain.
 const eastWest=hash(2,3,c.seed)>.5,angle=(eastWest?0:Math.PI/2)+(hash(4,7,c.seed)-.5)*.2,ca=Math.cos(angle),sa=Math.sin(angle);
 const continentShift=(hash(6,2,c.seed)-.5)*.15;
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){
  const X=x/(n-1)*2-1,Z=z/(n-1)*2-1;
  const wx=X+.13*(noise(X*3,Z*3,c.seed+11)-.5)+.07*(noise(X*9,Z*9,c.seed+12)-.5);
  const wz=Z+.15*(noise(X*3,Z*3,c.seed+13)-.5)+.06*(noise(X*11,Z*11,c.seed+14)-.5);
  // Union creates hooked mainland, wide shelves, bays, peninsulas and an offshore landmass.
  const lobes=[[-.27+continentShift,-.28,.63,.40],[.12+continentShift,.12,.66,.46],[-.18+continentShift,.48,.53,.30],[.68,-.52,.18,.26]];
  let land=-Infinity;
  for(const [cx,cz,rx,rz] of lobes)land=Math.max(land,1-Math.sqrt(((wx-cx)/rx)**2+((wz-cz)/rz)**2));
  land+=(noise(X*7,Z*7,c.seed+21)-.5)*.20+(noise(X*19,Z*19,c.seed+22)-.5)*.07;
  const inland=smooth(land/.38),coast=smooth((land+.16)/.23);
  const u=X*ca+Z*sa,v=-X*sa+Z*ca;
  const bend=.06*Math.sin(u*6+c.seed)+.03*Math.sin(u*17+c.seed*.1);
  const chain1=Math.exp(-Math.pow((v+.16-bend)/.075,2))*smooth((.86-Math.abs(u+.04))/.16);
  const chain2=.65*Math.exp(-Math.pow((v-.30+.5*bend)/.065,2))*smooth((.62-Math.abs(u-.05))/.19);
  const ridge=Math.max(chain1,chain2),peaks=.58+.42*noise(u*16,v*9,c.seed+5);
  const plains=c.peak*(.035+.10*inland)+ (noise(X*17,Z*17,c.seed+6)-.5)*c.peak*.045*inland;
  const uplift=c.peak*ridge*peaks*smooth((land+.015)/.22);
  const base=c.sea-c.oceanDepth+(c.oceanDepth+plains+uplift)*coast;
  // Constant sea-floor boundary keeps finite atlas/ocean extension continuous.
  const edge=smooth((1-Math.max(Math.abs(X),Math.abs(Z)))/.065);
  raw[z*n+x]=c.sea-c.oceanDepth+(base-c.sea+c.oceanDepth)*edge;
 } // Priority flood: ocean-connected boundary seeds, spill elevations and stable outlet tree.
 function add(i,p,h){seen[i]=1;parent[i]=p;filled[i]=h;heap.push(i,h)}
 for(let z=0;z<n;z++)for(let x=0;x<n;x++)if(!x||!z||x===n-1||z===n-1){const i=z*n+x;add(i,-1,Math.max(c.sea,raw[i]))}
 while(heap.a.length){const [i]=heap.pop();rank[i]=order.length;outlet[i]=parent[i]<0?i:outlet[parent[i]];order.push(i);const x=i%n,z=(i/n)|0;for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,z>0?i-n:-1,z<n-1?i+n:-1])if(j>=0&&!seen[j])add(j,i,Math.max(raw[j],filled[i]));}
 // Choose steepest resolved downhill neighbor, preserving flood-tree ties on flats.
 for(const i of order){const x=i%n,z=Math.floor(i/n);let best=parent[i],slope=0;if(best<0)continue;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz||x+dx<0||x+dx>=n||z+dz<0||z+dz>=n)continue;const j=(z+dz)*n+x+dx,drop=(filled[i]-filled[j])/Math.hypot(dx,dz);if(rank[j]<rank[i]&&drop>slope){slope=drop;best=j;}}parent[i]=best;outlet[i]=outlet[best];}
 for(let k=N-1;k>=0;k--){const i=order[k],p=parent[i];if(p>=0)flow[p]+=flow[i]}
 for(let i=0;i<N;i++){
  const river=c.water&&flow[i]>=c.riverThreshold&&filled[i]>c.sea;
  const depth=river?Math.min(c.maxRiverDepth,1+Math.log2(flow[i]/c.riverThreshold+1)):0;
  bed[i]=river?Math.min(raw[i],filled[i]-depth):raw[i];
  if(c.water&&(raw[i]<c.sea||filled[i]-raw[i]>.01||river))water[i]=filled[i];
 }
 function sample(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('Finite world coordinates required');
  if(Math.abs(x)>c.size/2||Math.abs(z)>c.size/2)return {height:c.sea-c.oceanDepth,seaLevel:c.sea,water:c.water?c.sea:null,waterHeight:c.water?c.sea:null,flow:0,flowCell:null,downstreamCell:null,outletCell:null,climate:{continentalness:-1,temperature:null,humidity:null},domain:'ocean-extension',version:VERSION};
  const gx=(x+c.size/2)/step,gz=(z+c.size/2)/step,ix=Math.min(n-2,Math.floor(gx)),iz=Math.min(n-2,Math.floor(gz)),u=gx-ix,v=gz-iz;
  const ids=[iz*n+ix,iz*n+ix+1,(iz+1)*n+ix,(iz+1)*n+ix+1],weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
  const interp=a=>ids.reduce((s,i,k)=>s+a[i]*weights[k],0);
  let h=interp(raw),wh=null;
  const spill=interp(filled),cell=Math.round(gz)*n+Math.round(gx);
  // Basin lakes use spill level; narrow rivers use globally shared graph segments.
  if(c.water&&spill>h+.01)wh=spill;
  if(c.water){
   let nearest=Infinity,level=0,depth=0,width=0;
   for(let zz=Math.max(0,iz-1);zz<=Math.min(n-1,iz+2);zz++)for(let xx=Math.max(0,ix-1);xx<=Math.min(n-1,ix+2);xx++){
    const i=zz*n+xx,p=parent[i];if(p<0||flow[i]<c.riverThreshold||filled[i]<=c.sea)continue;
    const px=p%n,pz=Math.floor(p/n),dx=px-xx,dz=pz-zz;
    const t=clamp(((gx-xx)*dx+(gz-zz)*dz)/(dx*dx+dz*dz)),distance=Math.hypot(gx-xx-t*dx,gz-zz-t*dz)*step;
    const f=flow[i]+(flow[p]-flow[i])*t,w=Math.min(step*.45,3+Math.sqrt(f/c.riverThreshold)*1.5);
    if(distance/w<nearest){nearest=distance/w;level=filled[i]+(filled[p]-filled[i])*t;depth=Math.min(c.maxRiverDepth,1+Math.log2(f/c.riverThreshold+1));width=w;}
   }
   if(nearest<1){const blend=1-smooth(nearest),cut=h*(1-blend)+(level-depth)*blend;if(cut<h)h=cut;if(level>h+.01)wh=level;}
  }
  return {height:h,seaLevel:c.sea,water:wh,waterHeight:wh,flow:interp(flow),flowCell:cell,downstreamCell:parent[cell],outletCell:outlet[cell],climate:{continentalness:clamp((interp(raw)-c.sea)/c.peak,-1,1),temperature:null,humidity:null},domain:'atlas',version:VERSION};
 }
 function suitableSpawn(radius=160){
  if(!(radius>0)||!Number.isFinite(radius)||radius>c.size/4)throw Error('Invalid spawn radius');
  const r=Math.ceil(radius/step)+2;let best=null;
  for(let z=r;z<n-r;z++)for(let x=r;x<n-r;x++){
   const i=z*n+x;if(raw[i]<c.sea+8||raw[i]>c.sea+c.peak*.22)continue;
   let lo=Infinity,hi=-Infinity,slope=0,valid=true;
   for(let dz=-r;dz<=r&&valid;dz++)for(let dx=-r;dx<=r;dx++){
    if(Math.hypot(dx,dz)*step>radius+step*1.5)continue;
    const j=(z+dz)*n+x+dx;
    // Conservative wet-cell/river exclusion includes interpolation halo.
    if(raw[j]<=c.sea+2||filled[j]-raw[j]>.01||(c.water&&flow[j]>=c.riverThreshold)){valid=false;break;}
    lo=Math.min(lo,raw[j]);hi=Math.max(hi,raw[j]);
    if(dx<r&&x+dx+1<n)slope=Math.max(slope,Math.abs(raw[j+1]-raw[j])/step);
    if(dz<r&&z+dz+1<n)slope=Math.max(slope,Math.abs(raw[j+n]-raw[j])/step);
   }
   if(!valid||slope>.14)continue;
   const score=(hi-lo)+slope*100+Math.hypot(x-(n-1)/2,z-(n-1)/2)*.02;
   if(!best||score<best.score)best={x:x*step-c.size/2,z:z*step-c.size/2,height:raw[i],radius,minHeight:lo,maxHeight:hi,maxAxisSlope:slope,score,version:VERSION};
  }
  return best; // null is a real blocker, never silently flatten a mountain.
 }
 // Sparse edits always win. No player delta is modified or persisted by this kernel.
 function solidAt(x,y,z,lookupEdit){const edit=lookupEdit?.(x,y,z);return edit!==undefined?edit:y<sample(x,z).height;}
 return {version:VERSION,config:Object.freeze(c),step,raw,filled,bed,water,parent,rank,outlet,flow,sample,suitableSpawn,solidAt,bytes:[raw,filled,bed,water,parent,rank,outlet,flow,seen].reduce((s,a)=>s+a.byteLength,0)};
}








