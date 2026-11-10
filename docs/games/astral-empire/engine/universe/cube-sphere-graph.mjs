// Radius-independent coarse planetary ownership/connectivity proof. Not voxel allocation.
export function cubeSphereGraph(n=32){
 if(!Number.isInteger(n)||n<2||n>128)throw Error('Bounded planetary macro resolution2..128');
 const nodes=[],ids=new Map(),neighbors=[],faces=[];
 function node(v){const key=v.join(',');if(ids.has(key))return ids.get(key);const id=nodes.length,len=Math.hypot(...v);ids.set(key,id);nodes.push({cube:v,dir:v.map(x=>x/len),key});neighbors.push(new Set());return id;}
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const face=[];for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const v=[0,0,0];v[axis]=sign*n;v[(axis+1)%3]=-n+2*i;v[(axis+2)%3]=-n+2*j;face.push(node(v));}faces.push(face);}
 for(const f of faces)for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const a=f[j*(n+1)+i];for(const b of [i<n?f[j*(n+1)+i+1]:-1,j<n?f[(j+1)*(n+1)+i]:-1])if(b>=0){neighbors[a].add(b);neighbors[b].add(a);}}
 return{n,nodes,faces,neighbors:neighbors.map(x=>[...x].sort((a,b)=>a-b))};
}
class Heap{constructor(){this.a=[]}less(a,b){return a[1]<b[1]||(a[1]===b[1]&&a[0]<b[0])}push(v){let i=this.a.length;this.a.push(v);while(i){const p=(i-1)>>1;if(this.less(this.a[p],v))break;this.a[i]=this.a[p];i=p;this.a[i]=v}}pop(){const a=this.a,r=a[0],v=a.pop();if(a.length){a[0]=v;let i=0;for(;;){let k=i*2+1;if(k>=a.length)break;if(k+1<a.length&&this.less(a[k+1],a[k]))k++;if(this.less(a[i],a[k]))break;[a[i],a[k]]=[a[k],a[i]];i=k;}}return r;}}
/** height(direction) is supplied by real planetary source; fixtures are not generation. */
export function solvePlanetDrainage(graph,height,sea=0){
 const N=graph.nodes.length,raw=Float64Array.from(graph.nodes,q=>height(q.dir)),level=new Float64Array(N),parent=new Int32Array(N).fill(-1),rank=new Int32Array(N),outlet=new Int32Array(N),count=new Float64Array(N).fill(1),seen=new Uint8Array(N),heap=new Heap(),order=[];
 if(![...raw].every(Number.isFinite)||!Number.isFinite(sea))throw Error('Invalid planetary heights');
 for(let i=0;i<N;i++)if(raw[i]<sea){seen[i]=1;level[i]=sea;heap.push([i,sea]);outlet[i]=i;}
 if(!heap.a.length)return{status:'no-ocean-sink',raw}; // Do not silently invent oceans on dry mod planets.
 while(heap.a.length){const[i]=heap.pop();rank[i]=order.length;order.push(i);for(const j of graph.neighbors[i])if(!seen[j]){seen[j]=1;parent[j]=i;outlet[j]=outlet[i];level[j]=Math.max(raw[j],level[i]);heap.push([j,level[j]]);}}
 for(let k=order.length-1;k>=0;k--){const i=order[k];if(parent[i]>=0)count[parent[i]]+=count[i];}
 return{status:'solved',raw,level,parent,rank,outlet,catchmentNodes:count};
}
