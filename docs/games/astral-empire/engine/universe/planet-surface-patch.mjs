import {direction} from './planet-projection.mjs';

// CPU-double evaluation, then camera-relative conversion. No saved world mutation.
// Equal-resolution adjacent patch edges share samples; mixed-LOD stitching is a
// separate scheduler responsibility and is deliberately not implied by this API.
export function buildPlanetSurfacePatch({projection,sample,face,level=0,x=0,y=0,resolution=16,camera=[0,0,0]}) {
 if(!projection || typeof sample!=='function') throw Error('Projection and scalar sampler required');
 if(![4,8,16,32,64].includes(resolution)) throw Error('Surface patch budget exceeded');
 const patch=projection.patch(face,level,x,y,{camera});
 const [u0,v0,u1,v1]=patch.bounds,n=resolution;
 const positions=new Float32Array((n+1)**2*3), heights=new Float64Array((n+1)**2), indices=new Uint32Array(n*n*6);
 let vertex=0,index=0;
 for(let j=0;j<=n;j++)for(let i=0;i<=n;i++) {
  const u=u0+(u1-u0)*i/n,v=v0+(v1-v0)*j/n,d=direction(face,u,v),s=sample(d);
  const h=s?.heightMetres;
  if(!Number.isFinite(h))throw Error('Finite heightMetres required');
  const point=projection.position(face,u,v,h);
  heights[vertex]=h;
  for(let k=0;k<3;k++)positions[vertex*3+k]=point[k]-camera[k];
  vertex++;
 }
 for(let j=0;j<n;j++)for(let i=0;i<n;i++) {
  const a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;
  indices.set([a,b,d,a,d,c],index);index+=6;
 }
 return {key:patch.key,face,level,x,y,resolution,origin:[...camera],positions,indices,heights,triangles:indices.length/3};
}
