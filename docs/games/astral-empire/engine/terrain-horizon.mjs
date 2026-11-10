// Budgeted distant surface adapter. Near geometry remains the authoritative
// editable volume. All vertices lie on a globally aligned 8/40 metre lattice.
export function* horizonMesh(field,cx,cz,{radius=50,fineRadius=8}={}) {
 const positions=[],normals=[],uv=[],cache=new Map(),originX=cx*40,originZ=cz*40;
 const point=(x,z)=>{const k=x+':'+z;if(cache.has(k))return cache.get(k);const p=[x,field.surfaceHeight(x,z)-.08,z];cache.set(k,p);return p;};
 const emit=(a,b,c)=>{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;for(const p of[a,b,c]){positions.push(...p);normals.push(nx/l,ny/l,nz/l);uv.push(p[0]/320,-p[2]/320);}};
 const fine=(x,z)=>Math.abs(x)<=fineRadius&&Math.abs(z)<=fineRadius;
 for(let z=-radius;z<=radius;z++)for(let x=-radius;x<=radius;x++){
  const X=originX+x*40,Z=originZ+z*40;
  if(fine(x,z))for(let j=0;j<5;j++)for(let i=0;i<5;i++){const a=point(X+i*8,Z+j*8),b=point(X+(i+1)*8,Z+j*8),c=point(X+i*8,Z+(j+1)*8),d=point(X+(i+1)*8,Z+(j+1)*8);emit(a,c,b);emit(b,c,d);}
  else{
   // Split coarse boundary edges wherever the adjacent cell uses 8m spacing.
   const ring=[];for(const [dx,dz,ex,ez,n] of [[0,0,0,40,fine(x-1,z)?5:1],[0,40,40,40,fine(x,z+1)?5:1],[40,40,40,0,fine(x+1,z)?5:1],[40,0,0,0,fine(x,z-1)?5:1]])for(let i=0;i<n;i++)ring.push(point(X+dx+(ex-dx)*i/n,Z+dz+(ez-dz)*i/n));
   const center=point(X+20,Z+20);for(let i=0;i<ring.length;i++)emit(center,ring[i],ring[(i+1)%ring.length]);
  }
  yield null;
 }
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),uv:new Float32Array(uv),triangles:positions.length/9};
}
export class HorizonJob {
 constructor(field,cx,cz,options){this.iterator=horizonMesh(field,cx,cz,options);this.done=false;}
 advance(budget=2){if(this.done)return null;const start=performance.now();let next;do{next=this.iterator.next();if(next.done){this.done=true;return next.value;}}while(performance.now()-start<budget);return null;}
 cancel(){this.done=true;this.iterator.return();}
}
export class HorizonView {
 constructor(T,scene,field,groundMaterial,tint){Object.assign(this,{T,scene,field});this.rect=new T.Vector4();this.material=groundMaterial.clone();this.material.vertexColors=false;this.material.color.set(tint);const base=groundMaterial.onBeforeCompile;this.material.onBeforeCompile=shader=>{base?.(shader);shader.uniforms.horizonNear={value:this.rect};shader.vertexShader='varying vec2 vHorizonXZ;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHorizonXZ=position.xz;');shader.fragmentShader='varying vec2 vHorizonXZ;uniform vec4 horizonNear;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vHorizonXZ.x>=horizonNear.x&&vHorizonXZ.x<=horizonNear.z&&vHorizonXZ.y>=horizonNear.y&&vHorizonXZ.y<=horizonNear.w)discard;');};this.material.customProgramCacheKey=()=> 'continental-horizon-v1';}
 update(x,z){const cx=Math.floor(x/40),cz=Math.floor(z/40);this.rect.set((cx-5)*40,(cz-5)*40,(cx+6)*40,(cz+6)*40);const hx=Math.round(x/160)*4,hz=Math.round(z/160)*4,key=hx+':'+hz;
  if(key!==this.key){this.job?.cancel();this.key=key;this.job=new HorizonJob(this.field,hx,hz);}
  const data=this.job?.advance(2);if(!data)return false;
  const T=this.T,g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(data.positions,3));g.setAttribute('normal',new T.BufferAttribute(data.normals,3));g.setAttribute('uv',new T.BufferAttribute(data.uv,2));g.computeBoundingSphere();const mesh=new T.Mesh(g,this.material);mesh.frustumCulled=true;this.scene.add(mesh);if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose();}this.mesh=mesh;this.triangles=data.triangles;this.job=null;return true;
 }
 dispose(){this.job?.cancel();if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose();}this.material.dispose();this.mesh=null;}
}
