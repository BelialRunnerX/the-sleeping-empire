import {createPlanetSurface} from './planet-surface.mjs';
import {direction} from './planet-projection.mjs';
export function generateSurfacePreview(parameters,resolution=32){
 if(![8,16,32,64].includes(resolution))throw Error('Preview budget exceeded');
 const field=createPlanetSurface(parameters),n=resolution;
 const positions=new Float32Array(6*(n+1)**2*3),colors=new Float32Array(positions.length),normals=new Float32Array(positions.length),indices=new Uint32Array(36*n*n);
 let v=0,k=0,land=0,ocean=0,min=Infinity,max=-Infinity;
 for(let f=0;f<6;f++){
  const start=v;
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
   const d=direction(f,2*x/n-1,2*y/n-1),s=field.sample(d),r=1+Math.max(s.heightMetres,s.waterHeightMetres??-Infinity)/parameters.radiusMetres;
   positions.set(d.map(a=>a*r),v*3);normals.set(d,v*3);min=Math.min(min,s.heightMetres);max=Math.max(max,s.heightMetres);
   const high=Math.max(0,Math.min(1,s.mountainness));
   const color=s.ocean?[.035,.18,.30]:[.20+high*.50,.36+high*.32,.22+high*.43];colors.set(color,v*3);s.ocean?ocean++:land++;v++;
  }
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=start+y*(n+1)+x,b=a+1,c=a+n+1,d=c+1;indices.set([a,b,d,a,d,c],k);k+=6;}
 }
 const drainage=field.drainage();
 return {positions,colors,normals,indices,resolution,recipeId:field.recipeId,summary:{minHeight:min,maxHeight:max,landSamples:land,oceanSamples:ocean,drainageStatus:drainage.status,drainageNodes:drainage.graph.nodes.length,riverEdges:drainage.riverEdges?.length||0}};
}
