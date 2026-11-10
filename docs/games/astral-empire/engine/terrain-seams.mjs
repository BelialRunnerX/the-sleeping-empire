// Isolated surface-only seam bridge. No volume/collision or horizontal cap mutations.
const EPS=1e-6;
export function createCoarseHeightSampler(source,originX=0,originZ=0){
 const p=source.position,idx=source.index,buckets=new Map();let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,step=Infinity;
 const xs=[...new Set(Array.from({length:p.length/3},(_,i)=>p[i*3]))].sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)if(xs[i]-xs[i-1]>EPS)step=Math.min(step,xs[i]-xs[i-1]);
 for(let i=0;i<p.length;i+=3){minX=Math.min(minX,p[i]+originX);maxX=Math.max(maxX,p[i]+originX);minZ=Math.min(minZ,p[i+2]+originZ);maxZ=Math.max(maxZ,p[i+2]+originZ);}
 for(let i=0;i<idx.length;i+=3){const t=idx.slice(i,i+3).map(v=>[p[v*3]+originX,p[v*3+1],p[v*3+2]+originZ]);const key=Math.floor(Math.min(...t.map(v=>v[0]))/step)+':'+Math.floor(Math.min(...t.map(v=>v[2]))/step);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(t);}
 const sample=(x,z)=>{if(x<minX-EPS||x>maxX+EPS||z<minZ-EPS||z>maxZ+EPS)return null;const gx=Math.floor(x/step),gz=Math.floor(z/step);
 for(const dx of [0,-1])for(const dz of [0,-1])for(const [a,b,c]of buckets.get((gx+dx)+':'+(gz+dz))||[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<EPS)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;if(u>=-EPS&&v>=-EPS&&w>=-EPS)return u*a[1]+v*b[1]+w*c[1];}return null;};return sample;
}
export function buildSurfaceSeams(records,coarseHeight,allowSegment=()=>true){
 const positions=[],normals=[],seen=new Set();let skipped=0,segments=0,maxGap=0;
 const triangle=(a,b,c,axis,target)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(len<EPS)return;if(n[axis]*target<0){[b,c]=[c,b];for(let i=0;i<3;i++)n[i]=-n[i];}for(const q of[a,b,c]){positions.push(...q);normals.push(...n.map(v=>v/len||0));}};
 for(const r of records.values()){
  if(!r.mesh)continue;const [cx,cz]=r.key.split(':').map(Number),p=r.mesh.geometry.attributes.position.array,n=r.mesh.geometry.attributes.normal.array;
  for(const [axis,side,neighbor]of [[0,0,(cx-1)+':'+cz],[0,1,(cx+1)+':'+cz],[2,0,cx+':'+(cz-1)],[2,1,cx+':'+(cz+1)]]){
   if(records.get(neighbor)?.mesh)continue;const edge=(axis===0?cx:cz)*8+side*8,along=axis===0?2:0;
   for(let i=0;i<p.length;i+=9){if(n[i+1]<.9||n[i+4]<.9||n[i+7]<.9)continue;for(let j=0;j<3;j++){
    const k=i+j*3,l=i+((j+1)%3)*3;if(Math.abs(p[k+axis]-edge)>EPS||Math.abs(p[l+axis]-edge)>EPS)continue;
    const low=Math.min(p[k+along],p[l+along]),high=Math.max(p[k+along],p[l+along]),y=p[k+1];if(high-low<EPS||Math.abs(p[l+1]-y)>EPS)continue;
    for(let start=low;start<high-EPS;start+=1/16){const end=Math.min(high,start+1/16),mid=(start+end)/2,key=axis+':'+edge+':'+start+':'+y;if(seen.has(key))continue;seen.add(key);
     const a=axis===0?[edge,y,start]:[start,y,edge],b=axis===0?[edge,y,end]:[end,y,edge],x=axis===0?edge:mid,z=axis===2?edge:mid;
     const ya=coarseHeight(a[0],a[2]),yb=coarseHeight(b[0],b[2]);if(ya==null||yb==null||!Number.isFinite(ya+yb)){skipped++;continue;}if(!allowSegment(x,y,z,axis,side,Math.min(y,ya,yb),Math.max(y,ya,yb))){skipped++;continue;}
     const gap=Math.max(Math.abs(ya-y),Math.abs(yb-y));maxGap=Math.max(maxGap,gap);if(gap<EPS)continue;
     const emit=(a,b,ya,yb)=>{const c=[b[0],yb,b[2]],d=[a[0],ya,a[2]],target=(side?1:-1)*Math.sign(y-(ya+yb)/2);triangle(a,b,c,axis,target);triangle(a,c,d,axis,target);};
     if((ya-y)*(yb-y)<0){const t=(y-ya)/(yb-ya),m=a.map((v,i)=>v+(b[i]-v)*t);emit(a,m,ya,y);emit(m,b,y,yb);}else emit(a,b,ya,yb);segments++;
    }
   }}
  }
 }
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),quads:positions.length/18,segments,skipped,maxGap};
}
