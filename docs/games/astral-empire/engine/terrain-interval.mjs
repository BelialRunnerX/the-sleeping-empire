// Conservative interval helpers for classification only. Native scalar samples
// remain authoritative; a range never substitutes a generated scalar value.
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const scale=(a,n)=>n>=0?[a[0]*n,a[1]*n]:[a[1]*n,a[0]*n];
const mix=(a,b,t)=>[Math.min(a[0]*(1-t[0])+b[0]*t[0],a[0]*(1-t[1])+b[0]*t[1]),Math.max(a[1]*(1-t[0])+b[1]*t[0],a[1]*(1-t[1])+b[1]*t[1])];
const smooth=t=>t*t*t*(t*(t*6-15)+10);
const absMin=a=>a[0]<=0&&a[1]>=0?0:Math.min(Math.abs(a[0]),Math.abs(a[1]));
const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
export function noiseBounds(noise,box){
 let low=Infinity,high=-Infinity;
 for(let z=Math.floor(box[2][0]);z<=Math.floor(box[2][1]);z++)for(let y=Math.floor(box[1][0]);y<=Math.floor(box[1][1]);y++)for(let x=Math.floor(box[0][0]);x<=Math.floor(box[0][1]);x++){
  const cell=[x,y,z],p=box.map((v,i)=>[Math.max(0,v[0]-cell[i]),Math.min(1,v[1]-cell[i])]),t=p.map(v=>[smooth(v[0]),smooth(v[1])]),values=[];
  for(let k=0;k<8;k++){const corner=[k&1,(k>>1)&1,(k>>2)&1],g=noise.gradientIndex(x+corner[0],y+corner[1],z+corner[2]);let v=[0,0];for(let axis=0;axis<3;axis++){const unit=[0,0,0];unit[axis]=1;const coefficient=noise.gradientValue(g,...unit);if(coefficient)v=add(v,scale([p[axis][0]-corner[axis],p[axis][1]-corner[axis]],coefficient));}values.push(v);}
  const v=mix(mix(mix(values[0],values[1],t[0]),mix(values[2],values[3],t[0]),t[1]),mix(mix(values[4],values[5],t[0]),mix(values[6],values[7],t[0]),t[1]),t[2]);low=Math.min(low,v[0]);high=Math.max(high,v[1]);
 }
 return [low-1e-12,high+1e-12];
}
export function fbmBounds(noise,box,octaves){let total=[0,0],amp=1,norm=0,freq=1;for(let i=0;i<octaves;i++){total=add(total,scale(noiseBounds(noise,box.map(v=>scale(v,freq))),amp));norm+=amp;amp*=.5;freq*=2;}return scale(total,1/norm);}
export function volumePositionBounds(radius,block){
 const x=[block[0]+1/32,block[0]+31/32],z=[block[2]+1/32,block[2]+31/32],alt=[block[1]+1/32,block[1]+31/32];
 const maxAbs=a=>Math.max(Math.abs(a[0]),Math.abs(a[1]));
 const len=[Math.hypot(radius,absMin(x),absMin(z)),Math.hypot(radius,maxAbs(x),maxAbs(z))];
 const divide=a=>{const v=[a[0]/len[0],a[0]/len[1],a[1]/len[0],a[1]/len[1]];return [Math.min(...v),Math.max(...v)];};
 const r=[radius+alt[0],radius+alt[1]];
 return [divide(x),divide([radius,radius]),divide(z)].map(a=>{const v=[a[0]*r[0],a[0]*r[1],a[1]*r[0],a[1]*r[1]];return [Math.min(...v)-1e-10,Math.max(...v)+1e-10];});
}
export function noCaveInBlock(kernel,block,baseRange){
 const alt=[block[1]+1/32,block[1]+31/32],under=[baseRange[0]-alt[1],baseRange[1]-alt[0]];
 if(alt[0]>140||alt[1]<-498||under[1]<8)return true;
 const box=volumePositionBounds(kernel.radius,block),scaled=(b,n)=>b.map(v=>scale(v,1/n));
 if(under[1]>=24){const r=.042*(1+clamp(-alt[0]/420,0,1)*.45),a=fbmBounds(kernel.caveA,scaled(box,78),3);if(absMin(a)**2<r*r){const b=fbmBounds(kernel.caveB,scaled(box,78),3);if(absMin(a)**2+absMin(b)**2<r*r)return false;}
  const bias=clamp(1-absMin([alt[0]+210,alt[1]+210])/260,0,1);if(bias>0&&fbmBounds(kernel.chamber,scaled(box,165),3)[1]>.50-.12*bias)return false;
 }
 if(alt[1]>-200){const sq=[box[0],scale(box[1],.14),box[2]],f=fbmBounds(kernel.fissure,scaled(sq,62),2),threshold=under[1]<24?.0022:.020;if(absMin(f)<threshold)return false;}
 return true;
}
export function densityBounds(kernel,block,baseRange,squash){
 const alt=[block[1]+1/32,block[1]+31/32],delta=[baseRange[0]-alt[1],baseRange[1]-alt[0]],box=volumePositionBounds(kernel.radius,block);
 const near=[clamp(1-Math.max(Math.abs(delta[0]),Math.abs(delta[1]))/40,0,1),clamp(1-absMin(delta)/40,0,1)];
 const product=(a,b)=>{const v=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];return [Math.min(...v),Math.max(...v)];};
 let result=scale(delta,1/squash);
 if(near[1]>0){result=add(result,product(scale(fbmBounds(kernel.large,box.map(v=>scale(v,1/180)),3),2.2),near));result=add(result,product(scale(fbmBounds(kernel.small,box.map(v=>scale(v,1/45)),2),.9),near));}
 if(alt[0]<-440)result=add(result,[Math.max(0,-440-alt[1])*.06,(-440-alt[0])*.06]);
 return result;
}
export const blendBounds=mix;
