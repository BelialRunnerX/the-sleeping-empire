// Static water surface extraction. Not fluid simulation. One mesh buffer per tile.
export function buildWaterTile({sample,minX,minZ,size=32,step=1,isSolid=()=>false,maxCells=4096,allowCoarse=false}){
 if(typeof sample!=='function'||![minX,minZ,size,step].every(Number.isFinite)||size<=0||step<=0||(!allowCoarse&&step>2))throw Error('Invalid water tile or near step > 2m');
 const n=Math.round(size/step);if(Math.abs(n*step-size)>1e-8||n*n>maxCells||n<1)throw Error('Water tile exceeds bounded grid');
 const positions=[],indices=[],cache=new Map();let samples=0,clipped=0,blocked=0;
 function at(x,z){const key=x+','+z;if(cache.has(key))return cache.get(key);const s=sample(x,z),w=s.waterHeight??s.water;const wet=Number.isFinite(w)&&w>s.height+.01&&!isSolid(x,w-.01,z);const p={x,z,y:Number.isFinite(w)?w:s.height,wet};cache.set(key,p);samples++;return p;}
 function crossing(a,b){let wet=a.wet?a:b,dry=a.wet?b:a;for(let k=0;k<8;k++){const p=at((wet.x+dry.x)/2,(wet.z+dry.z)/2);if(p.wet)wet=p;else dry=p;}return wet;}
 function emit(tri){let poly=[];for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3];if(a.wet)poly.push(a);if(a.wet!==b.wet){poly.push(crossing(a,b));clipped++;}}
  for(let i=1;i+1<poly.length;i++){
   const t=[poly[0],poly[i],poly[i+1]],cx=t.reduce((s,p)=>s+p.x,0)/3,cz=t.reduce((s,p)=>s+p.z,0)/3;
   // Conservative occupied centroid and edge checks avoid covering edited solid columns.
   if(!at(cx,cz).wet||t.some((p,j)=>!at((p.x+t[(j+1)%3].x)/2,(p.z+t[(j+1)%3].z)/2).wet)){blocked++;continue;}
   for(const p of t){indices.push(positions.length/3);positions.push(p.x-minX,p.y,p.z-minZ);}
  }
 }
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const X=minX+x*step,Z=minZ+z*step,a=at(X,Z),b=at(X+step,Z),c=at(X,Z+step),d=at(X+step,Z+step);emit([a,c,b]);emit([b,c,d]);}
 return {positions:new Float32Array(positions),indices:new Uint32Array(indices),origin:[minX,0,minZ],triangles:indices.length/3,samples,clippedEdges:clipped,conservativeDiscards:blocked,staticSurface:true};
}
