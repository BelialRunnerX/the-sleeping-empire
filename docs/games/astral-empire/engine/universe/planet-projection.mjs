import {planetScale} from './planet-scale.mjs';
export const PROJECTION_VERSION='native-tangent-cubesphere-v1';
const norm=d=>{if(!Array.isArray(d)||d.length!==3||!d.every(Number.isFinite)||!Math.hypot(...d))throw Error('Nonzero finite direction required');const l=Math.hypot(...d);return d.map(x=>x/l);};
export function direction(face,u,v){
 if(!Number.isInteger(face)||face<0||face>5||![u,v].every(x=>Number.isFinite(x)&&Math.abs(x)<=1))throw Error('Invalid face coordinate');
 // Exact endpoints eliminate tan(pi/4) rounding at ownership seams.
 const t=x=>Math.abs(x)===1?x:Math.tan(x*Math.PI/4),a=t(u),b=t(v);
 return norm([[1,b,-a],[-1,b,a],[a,1,-b],[a,-1,b],[a,b,1],[-a,b,-1]][face]);
}
export function project(dir){
 const [x,y,z]=norm(dir),ax=Math.abs(x),ay=Math.abs(y),az=Math.abs(z);let face,a,b;
 if(ax>=ay&&ax>=az){face=x>0?0:1;a=(x>0?-z:z)/ax;b=y/ax;}
 else if(ay>=az){face=y>0?2:3;a=x/ay;b=(y>0?-z:z)/ay;}
 else {face=z>0?4:5;a=(z>0?x:-x)/az;b=y/az;}
 return {face,u:Math.atan(a)*4/Math.PI,v:Math.atan(b)*4/Math.PI};
}
export function createPlanetProjection(parameters){
 const scale=planetScale(parameters),resolution=Math.floor(Math.PI*scale.radiusMetres/2+.5);
 if(resolution<1)throw Error('Radius too small for metre grid');
 const microResolution=resolution*16;
 function position(face,u,v,altitude=0){
  if(!Number.isFinite(altitude)||altitude<scale.minAltitudeMetres||altitude>scale.maxAltitudeMetres)throw Error('Altitude outside declared envelope');
  return direction(face,u,v).map(x=>x*(scale.radiusMetres+altitude));
 }
 function address(dir){
  const p=project(dir),axis=t=>Math.min(microResolution-1,Math.max(0,Math.floor((t*.5+.5)*microResolution)));
  const iu=axis(p.u),iv=axis(p.v);
  return {...p,iu,iv,centeredU:iu-Math.floor(microResolution/2),centeredV:iv-Math.floor(microResolution/2),
   chunkU:Math.floor(iu/512),chunkV:Math.floor(iv/512),localU:iu%512,localV:iv%512};
 }
 function patch(face,level,x,y,{altitude=0,camera=[0,0,0]}={}){
  if(!Number.isInteger(level)||level<0||level>40||![x,y].every(n=>Number.isSafeInteger(n)&&n>=0&&n<2**level)||!Array.isArray(camera)||camera.length!==3||!camera.every(Number.isFinite))throw Error('Invalid bounded patch');
  const n=2**level,u0=2*x/n-1,v0=2*y/n-1,u1=2*(x+1)/n-1,v1=2*(y+1)/n-1;
  return {key:face+':'+level+':'+x+':'+y,face,level,x,y,bounds:[u0,v0,u1,v1],
   corners:[[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(([u,v])=>position(face,u,v,altitude).map((a,i)=>a-camera[i])),
   center:position(face,(u0+u1)/2,(v0+v1)/2,altitude).map((a,i)=>a-camera[i])};
 }
 return Object.freeze({version:PROJECTION_VERSION,scale,resolution,microResolution,position,address,patch,
  fieldPosition:(face,u,v)=>direction(face,u,v).map(x=>x*scale.radiusMetres)});
}
