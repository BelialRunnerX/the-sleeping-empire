// Original procedural tileable textures guided by approved Elysium modular world kit.
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fract=v=>v-Math.floor(v);
export const SURFACES=Object.freeze({ceramic:{color:[226,228,221],rough:.43,metal:.04},limestone:{color:[195,192,174],rough:.85,metal:0},roof:{color:[54,78,94],rough:.6,metal:.18},graphite:{color:[41,48,53],rough:.48,metal:.18},wood:{color:[119,91,62],rough:.74,metal:0}});
const periodic=(u,v)=>Math.sin(TAU*(u*3+v*2))*.45+Math.sin(TAU*(u*11-v*7))*.18+Math.sin(TAU*(u*37+v*29))*.05;
export function surfaceSample(kind,u,v){const s=SURFACES[kind];if(!s)throw Error('Unknown surface');u=fract(u);v=fract(v);const n=periodic(u,v);let height=0,tone=n*2,rough=s.rough;
 if(kind==='ceramic'){const edge=Math.min(u,1-u,v,1-v),seam=edge<.014,groove=Math.abs(u-.12)<.003&&v>.14&&v<.86;const bolt=[[.05,.05],[.95,.05],[.05,.95],[.95,.95]].some(([x,y])=>Math.hypot(u-x,v-y)<.011);height=seam?-.012:groove?-.004:bolt?-.006:0;tone+=seam?-88:groove?-22:bolt?-60:0;rough+=seam?.2:0;}
 if(kind==='limestone'){const row=Math.floor(v*3),x=fract(u*2+(row%2)*.5),y=fract(v*3),seam=Math.min(x,1-x)<.012||Math.min(y,1-y)<.018;const vein=Math.abs(Math.sin(TAU*(u*2+v+Math.sin(TAU*v*2)*.06)))<.035;height=n*.002-(seam?.009:0);tone+=n*4-(seam?33:vein?6:0);rough+=n*.04;}
 if(kind==='roof'){const row=Math.floor(v*5),x=fract(u*4+(row%2)*.5),y=fract(v*5),seam=x<.025||y<.045;height=y*.003-(seam?.005:0);tone+=(seam?-18:0)+Math.floor(v*5)%2*2;}
 if(kind==='graphite'){const grain=Math.sin(TAU*v*96)*.5;height=grain*.00012;tone+=grain*1.4;rough+=grain*.025;}
 if(kind==='wood'){const grain=Math.sin(TAU*(u*11+Math.sin(TAU*v)*.12));height=grain*.0005;tone+=grain*4+Math.sin(TAU*(u*25+v))*1.5;}
 return {color:s.color.map(c=>clamp(Math.round(c+tone),0,255)),height,rough:clamp(rough,.1,1)};}
export function makeTextureData(kind,size=256){if(!Number.isInteger(size)||size<32||size>1024)throw Error('size32..1024');const color=new Uint8Array(size*size*4),normal=new Uint8Array(color.length),roughness=new Uint8Array(color.length),step=1/size;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,s=surfaceSample(kind,u,v),dx=(surfaceSample(kind,u+step,v).height-surfaceSample(kind,u-step,v).height)/(2*step),dy=(surfaceSample(kind,u,v+step).height-surfaceSample(kind,u,v-step).height)/(2*step),len=Math.hypot(dx,dy,1),k=(y*size+x)*4;color.set([...s.color,255],k);normal.set([Math.round(127.5*(-dx/len+1)),Math.round(127.5*(-dy/len+1)),Math.round(127.5*(1/len+1)),255],k);const r=Math.round(s.rough*255);roughness.set([r,r,r,255],k);}return {color,normal,roughness,size};}
export function packSurfaceAtlas(size=256){if(size<32||size>512||(size&(size-1)))throw Error('Atlas size must be power-of-two32..512');const names=Object.keys(SURFACES),padding=Math.max(4,Math.floor(size/16)),stride=size+2*padding,width=stride*names.length,height=stride,tiles={};const arrays={color:new Uint8Array(width*height*4),normal:new Uint8Array(width*height*4),roughness:new Uint8Array(width*height*4)};
 names.forEach((name,tile)=>{const data=makeTextureData(name,size);tiles[name]={offset:[(tile*stride+padding)/width,padding/height],scale:[size/width,size/height]};
 for(let y=0;y<stride;y++)for(let x=0;x<stride;x++){const sx=((x-padding)%size+size)%size,sy=((y-padding)%size+size)%size,src=(sy*size+sx)*4,dst=(y*width+tile*stride+x)*4;for(const key of Object.keys(arrays))arrays[key].set(data[key].subarray(src,src+4),dst);}});
 return {...arrays,width,height,tiles,padding,size,maxLod:Math.max(0,Math.floor(Math.log2(padding))-1)};}
export function createWorldSurfaceKit(T,{size=256}={}){const materials=new Map(),textures=[],atlas=packSurfaceAtlas(size);
 const tex=(bytes,srgb)=>{const t=new T.DataTexture(bytes,atlas.width,atlas.height,T.RGBAFormat);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.anisotropy=1;t.needsUpdate=true;textures.push(t);return t;};
 const map=tex(atlas.color,true),normalMap=tex(atlas.normal,false),roughnessMap=tex(atlas.roughness,false);
 for(const [name,def]of Object.entries(SURFACES)){const tile=atlas.tiles[name],m=new T.MeshStandardMaterial({map,normalMap,roughnessMap,roughness:1,normalScale:new T.Vector2(.5,.5),metalness:def.metal});
 m.userData.worldSurfaceAtlas=true;m.customProgramCacheKey=()=>`world-surface-atlas-v1-${name}`;
 m.onBeforeCompile=shader=>{shader.uniforms.worldSurfaceTile={value:new T.Vector4(...tile.offset,...tile.scale)};shader.uniforms.worldSurfaceSize={value:new T.Vector2(atlas.width,atlas.height)};shader.uniforms.worldSurfaceMaxLod={value:atlas.maxLod};
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 uniform vec4 worldSurfaceTile;
 uniform vec2 worldSurfaceSize;
 uniform float worldSurfaceMaxLod;
 vec4 sampleWorldSurface(sampler2D sourceMap, vec2 uv){
   vec2 dx=dFdx(uv)*worldSurfaceTile.zw*worldSurfaceSize;
   vec2 dy=dFdy(uv)*worldSurfaceTile.zw*worldSurfaceSize;
   float lod=clamp(log2(max(max(length(dx),length(dy)),1.0)),0.0,worldSurfaceMaxLod);
   // Derivatives computed before fract: tile seams cannot spuriously select a distant mip.
   // LOD cap keeps bilinear/trilinear footprint inside periodic gutters at every sampled level.
   return textureLod(sourceMap,worldSurfaceTile.xy+fract(uv)*worldSurfaceTile.zw,lod);
 }`);
 for(const [chunk,sampler,uv]of [['map_fragment','map','vMapUv'],['normal_fragment_maps','normalMap','vNormalMapUv'],['roughnessmap_fragment','roughnessMap','vRoughnessMapUv']]){
 const source=T.ShaderChunk[chunk],needle=`texture2D( ${sampler}, ${uv} )`;
 if(!source?.includes(needle))throw Error('Unsupported Three surface chunk: '+chunk);
 shader.fragmentShader=shader.fragmentShader.replace(`#include <${chunk}>`,source.split(needle).join(`sampleWorldSurface( ${sampler}, ${uv} )`));}
 };materials.set(name,m);}
 return {materials,textures,atlas,get:name=>materials.get(name),dispose(){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};}
// Clone UVs only, never alter positions/silhouette. Caller releases owned clone on scene unload.
export function setWorldTexelDensity(mesh,kind){if(mesh.userData.surfaceUV)return;const g=mesh.geometry.clone(),uv=g.attributes.uv,n=g.attributes.normal;const s=mesh.scale;
 for(let i=0;i<uv.count;i++){let ru=1,rv=1;if(kind==='roof'){ru=4;rv=3;}else if(g.type==='BoxGeometry'){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));if(nx>.9){ru=s.z;rv=s.y;}else if(ny>.9){ru=s.x;rv=s.z;}else{ru=s.x;rv=s.y;}}else{if(Math.abs(n.getY(i))>.9){const p=g.attributes.position;uv.setXY(i,p.getX(i)*s.x,p.getZ(i)*s.z);continue;}ru=Math.max(s.x,s.z)*2*Math.PI;rv=s.y;}
 uv.setXY(i,uv.getX(i)*Math.max(.25,ru),uv.getY(i)*Math.max(.25,rv));}uv.needsUpdate=true;mesh.geometry=g;mesh.userData.surfaceUV=true;mesh.userData.ownedWorldSurfaceGeometry=true;}
// Bind only explicit known authoring roles; never guess all gray objects are stone.
export function applyBuildingSurfaces(root,kit,{wallColor,roofColor}){const report={bound:0,missingUV:0};root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const c=o.material.color?.getHex();let kind=c===wallColor?'ceramic':c===roofColor?'roof':[0x646e77].includes(c)?'limestone':[0x505360,0x535464,0x4c5362,0x343e50].includes(c)?'graphite':null;if(!kind)return;if(!o.geometry.attributes.uv){report.missingUV++;return;}setWorldTexelDensity(o,kind);o.material=kit.get(kind);o.userData.worldSurface=kind;report.bound++;});return report;}
export function applyRelicSurfaces(root,kit){const report={bound:0,missingUV:0};root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const c=o.material.color?.getHex();if(![0x8a9599,0x88979c,0xb0b5ae,0x68777c,0xb9b6a7].includes(c))return;if(!o.geometry.attributes.uv){report.missingUV++;return;}setWorldTexelDensity(o,'limestone');o.material=kit.get('limestone');o.userData.worldSurface='limestone';report.bound++;});return report;}

