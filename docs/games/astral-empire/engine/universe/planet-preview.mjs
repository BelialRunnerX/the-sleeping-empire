import * as T from '../../vendor/three.module.js';
import {direction,createPlanetProjection} from './planet-projection.mjs';

// A bounded geometry inspector, not the gameplay world's terrain or collision.
export function sphereGeometry(resolution){
 if(![8,16,32,64].includes(resolution))throw Error('Preview mesh budget exceeded');
 const positions=[],normals=[],indices=[];
 for(let face=0;face<6;face++){
  const start=positions.length/3;
  for(let y=0;y<=resolution;y++)for(let x=0;x<=resolution;x++){
   const d=direction(face,2*x/resolution-1,2*y/resolution-1);positions.push(...d);normals.push(...d);
  }
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const a=start+y*(resolution+1)+x,b=a+1,c=a+resolution+1,d=c+1;
   indices.push(a,b,d,a,d,c);
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(indices);geometry.computeBoundingSphere();return geometry;
}
export function previewResolution(distance,height){
 // Conservative smooth-sphere chord error. Uniform edge resolution avoids T-junctions.
 for(const n of [8,16,32,64]){const error=1-Math.cos(Math.PI/(2*n));if(error*height/(2*Math.tan(Math.PI/8)*Math.max(.1,distance-1))<1.5)return n;}
 return 64;
}
export function mountPlanetPreview(host,{planetId,radiusMetres=64000000,color=0x779e97,surfaceParameters=null}={}){
 const projection=createPlanetProjection({radiusMetres,minAltitudeMetres:-512,maxAltitudeMetres:256});
 const renderer=new T.WebGLRenderer({antialias:false,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x0b2033);
 const canvas=renderer.domElement;canvas.style.cssText='display:block;width:100%;height:280px;touch-action:none;border-radius:12px';canvas.tabIndex=0;canvas.setAttribute('aria-label','Cube-sphere geometry preview. Drag to rotate, scroll to zoom, arrow keys rotate, plus and minus zoom.');host.append(canvas);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.01,30),group=new T.Group();scene.add(group);scene.add(new T.HemisphereLight(0xc9efff,0x223548,2));const sun=new T.DirectionalLight(0xffe5bb,2.4);sun.position.set(3,3,4);scene.add(sun);
 const material=new T.MeshStandardMaterial({color,roughness:.82,metalness:.05});const gridMaterial=new T.MeshBasicMaterial({color:0xc9efff,wireframe:true,transparent:true,opacity:.16});let distance=3.3,resolution=0,mesh=null,grid=null,disposed=false,pointer=null;
 let worker=null,jobSerial=0,pendingResolution=0,surfaceStatus='';
 group.rotation.set(.15,.4,0);const info=document.createElement('p');info.className='small muted';host.append(info);
 const controls=new AbortController();
 function render(){
  if(disposed)return;const w=Math.max(1,host.clientWidth),h=280;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,0,distance);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  const next=surfaceParameters?Math.max(32,previewResolution(distance,h)):previewResolution(distance,h);if(surfaceParameters && next!==pendingResolution){pendingResolution=next;surfaceStatus='Generating terrain and coarse drainage in worker...';worker?.terminate();worker=new Worker(new URL('./surface-preview-worker.mjs',import.meta.url),{type:'module'});worker.onmessage=({data})=>{if(disposed||data.serial!==jobSerial)return;if(data.error){surfaceStatus='Surface study unavailable: '+data.error;info.textContent=surfaceStatus;return;}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(data.positions,3));geometry.setAttribute('color',new T.BufferAttribute(data.colors,3));geometry.setIndex(new T.BufferAttribute(data.indices,1));geometry.setAttribute('normal',new T.BufferAttribute(data.normals,3));const old=mesh;mesh=new T.Mesh(geometry,material);material.vertexColors=true;material.color.set(0xffffff);material.needsUpdate=true;group.add(mesh);if(grid){group.remove(grid);grid=null;}if(old){group.remove(old);old.geometry.dispose();}resolution=data.resolution;const q=data.summary;surfaceStatus=`Terrain study: ${Math.round(q.minHeight)} to ${Math.round(q.maxHeight)} m. ${q.drainageNodes} coarse drainage nodes, ${q.riverEdges} candidate edges (${q.drainageStatus}). Ocean flat only; graph edges are not carved rivers or rendered lakes.`;canvas.dataset.surfaceReady='true';canvas.dataset.surfaceRecipe=data.recipeId;render();};worker.onerror=()=>{if(!disposed){surfaceStatus='Surface worker failed; close and reopen to retry.';info.textContent=surfaceStatus;}};worker.postMessage({serial:++jobSerial,resolution:next,parameters:surfaceParameters});}if(!surfaceParameters && next!==resolution){const geometry=sphereGeometry(next),old=mesh;mesh=new T.Mesh(geometry,material);group.add(mesh);if(grid)group.remove(grid);grid=new T.Mesh(geometry,gridMaterial);grid.scale.setScalar(1.001);group.add(grid);if(old){group.remove(old);old.geometry.dispose();}resolution=next;}
  renderer.render(scene,camera);canvas.dataset.resolution=String(resolution);canvas.dataset.triangles=String(renderer.info.render.triangles);canvas.dataset.radius=String(radiusMetres);
  const address=projection.address([0,0,1]);info.textContent=(surfaceParameters?surfaceStatus+' ':'')+`Preview radius ${radiusMetres.toLocaleString()} m · ${renderer.info.render.triangles.toLocaleString()} triangles · ${resolution} cells per face edge. Face micro width ${projection.microResolution.toLocaleString()} (${projection.microResolution>2147483647?'wide integer indexing required':'within int32 width'}). Canonical +Z sample face ${address.face}, chunk ${address.chunkU}, ${address.chunkV}.`;
 }
 const on=(name,fn)=>canvas.addEventListener(name,fn,{signal:controls.signal,passive:false});
 on('pointerdown',e=>{if(pointer)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 on('pointermove',e=>{if(pointer?.id!==e.pointerId)return;group.rotation.y+=(e.clientX-pointer.x)*.008;group.rotation.x=Math.max(-1.4,Math.min(1.4,group.rotation.x+(e.clientY-pointer.y)*.008));pointer={id:e.pointerId,x:e.clientX,y:e.clientY};render();});
 const release=e=>{if(pointer?.id===e.pointerId)pointer=null;};on('pointerup',release);on('pointercancel',release);on('lostpointercapture',release);
 on('wheel',e=>{distance=Math.max(1.15,Math.min(12,distance*Math.exp(e.deltaY*.001)));e.preventDefault();render();});
 on('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='ArrowLeft')group.rotation.y-=.15;if(e.key==='ArrowRight')group.rotation.y+=.15;if(e.key==='ArrowUp')group.rotation.x-=.15;if(e.key==='ArrowDown')group.rotation.x+=.15;if(e.key==='+'||e.key==='=')distance=Math.max(1.15,distance*.85);if(e.key==='-')distance=Math.min(12,distance/ .85);render();});
 const resize=new ResizeObserver(render);resize.observe(host);render();
 return {projection,planetId,zoom(factor){distance=Math.max(1.15,Math.min(12,distance*factor));render();},dispose(){if(disposed)return;disposed=true;jobSerial++;worker?.terminate();controls.abort();resize.disconnect();mesh?.geometry.dispose();material.dispose();gridMaterial.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();info.remove();}};
}
