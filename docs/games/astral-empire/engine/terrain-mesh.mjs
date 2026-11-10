// Scratch optimization: binary occupancy only, same winding/order as original.
export function meshTerrain(volume,bounds,unit=1,emit=null){
 if(![1,.5,.25,.125,.0625].includes(unit))throw new RangeError('terrain resolution');
 const min=bounds.min.map(n=>Math.round(n/unit)),max=bounds.max.map(n=>Math.round(n/unit));
 const lo=min.map(n=>n-1),sz=max.map((n,i)=>n-min[i]+2),total=sz[0]*sz[1]*sz[2];
 if(sz.some(n=>n<2)||total>12000000)throw new RangeError('mesh budget');
 const dense=new Uint8Array(total),str=[1,sz[0],sz[0]*sz[1]],positions=[],normals=[];
 const scalar=volume.sampleXYZ;let k=0,occupied=0;
 for(let z=lo[2];z<=max[2];z++)for(let y=lo[1];y<=max[1];y++)for(let x=lo[0];x<=max[0];x++){
 const a=Math.floor((x+.5)*unit*16),b=Math.floor((y+.5)*unit*16),c=Math.floor((z+.5)*unit*16);
 const v=scalar?scalar(a,b,c):volume.material([a,b,c]);dense[k++]=v;occupied+=!!v;
 }
 if(!occupied||occupied===total)return {positions,normals,quads:0};
 for(let axis=0;axis<3;axis++){
 const u=(axis+1)%3,v=(axis+2)%3,wid=max[u]-min[u],hei=max[v]-min[v],mask=new Uint8Array(wid*hei),p=[0,0,0];
 for(const sign of [-1,1])for(let slice=min[axis];slice<max[axis];slice++){
 mask.fill(0);p[axis]=slice;
 const base=(slice-lo[axis])*str[axis]+str[u]+str[v];
 for(let j=0;j<hei;j++)for(let i=0;i<wid;i++){
 const ix=base+i*str[u]+j*str[v];if(!dense[ix]||dense[ix+sign*str[axis]])continue;
 if(emit){p[u]=min[u]+i;p[v]=min[v]+j;if(!emit([(p[0]+.5)*unit,(p[1]+.5)*unit,(p[2]+.5)*unit]))continue;}
 mask[j*wid+i]=1;
 }
 for(let j=0;j<hei;j++)for(let i=0;i<wid;){
 if(!mask[j*wid+i]){i++;continue;}let w=1,h=1;
 while(i+w<wid&&mask[j*wid+i+w])w++;
 outer:while(j+h<hei){for(let n=0;n<w;n++)if(!mask[(j+h)*wid+i+n])break outer;h++;}
 p[axis]=slice+(sign>0?1:0);p[u]=min[u]+i;p[v]=min[v]+j;
 const a=[...p],b=[...p],c=[...p];a[u]+=w;b[u]+=w;b[v]+=h;c[v]+=h;
 for(const corner of sign>0?[p,a,b,p,b,c]:[p,b,a,p,c,b]){positions.push(corner[0]*unit,corner[1]*unit,corner[2]*unit);normals.push(axis===0?sign:0,axis===1?sign:0,axis===2?sign:0);}
 for(let n=0;n<h;n++)mask.fill(0,(j+n)*wid+i,(j+n)*wid+i+w);i+=w;
 }
 }
 }
 return {positions,normals,quads:positions.length/18};
}
export function meshAdaptiveTerrain(volume,bounds,refined){
 const lo=bounds.min.map(n=>n-2),sz=bounds.max.map((n,i)=>n-lo[i]+2),sx=sz[0],sy=sz[1],total=sx*sy*sz[2];
 if(sz.some(n=>n<2)||total>12000000)throw new RangeError('adaptive mesh budget');
 const flags=new Uint8Array(total),pages=new Array(total),macro=new Uint8Array(total),valid=new Uint8Array(total),detail=new Set(refined);
 const idx=(x,y,z)=>(x-lo[0])+sx*((y-lo[1])+sy*(z-lo[2]));
 const inGrid=(x,y,z)=>x>=lo[0]&&y>=lo[1]&&z>=lo[2]&&x<lo[0]+sz[0]&&y<lo[1]+sz[1]&&z<lo[2]+sz[2];
 for(const key of refined){const p=key.split(':').map(Number);if(inGrid(...p))flags[idx(...p)]=1;for(let a=0;a<3;a++)for(const s of [-1,1]){const q=[...p];q[a]+=s;detail.add(q.join(':'));}}
 const detailFlags=new Uint8Array(total);for(const key of detail){const p=key.split(':').map(Number);if(inGrid(...p))detailFlags[idx(...p)]=1;}
 const sampleXYZ=(x,y,z)=>{const bx=Math.floor(x/16),by=Math.floor(y/16),bz=Math.floor(z/16),i=idx(bx,by,bz);
 if(flags[i]){let data=pages[i];if(!data)pages[i]=data=volume.blockData([bx,by,bz]);return data[(x-bx*16)+16*((y-by*16)+16*(z-bz*16))];}
 if(!valid[i]){macro[i]=volume.material([bx*16+8,by*16+8,bz*16+8]);valid[i]=1;}return macro[i];};
 const adaptive={sampleXYZ},coarse=meshTerrain(adaptive,bounds,1,p=>!detailFlags[idx(Math.floor(p[0]),Math.floor(p[1]),Math.floor(p[2]))]);
 const positions=coarse.positions,normals=coarse.normals;
 for(const key of detail){const p=key.split(':').map(Number);if(!p.every((n,i)=>n>=bounds.min[i]&&n<bounds.max[i]))continue;
 const m=meshTerrain(adaptive,{min:p,max:p.map(n=>n+1)},1/16);for(const n of m.positions)positions.push(n);for(const n of m.normals)normals.push(n);}
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),quads:positions.length/18};
}
