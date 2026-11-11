// Isolated WebGL2 experiment, not a production renderer or FPS benchmark.
import {meshTerrain} from '../engine/terrain-mesh.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const mesh=meshTerrain({material:([x,y,z])=>y/16<8+Math.floor(4*Math.sin(x/48)*Math.cos(z/48))?1:0},{min:[0,0,0],max:[32,16,32]});
const packed=[];for(let i=0;i<mesh.positions.length;i+=18){const p=mesh.positions;packed.push(p[i],p[i+1],p[i+2],0,p[i+3]-p[i],p[i+4]-p[i+1],p[i+5]-p[i+2],0,p[i+6]-p[i+3],p[i+7]-p[i+4],p[i+8]-p[i+5],0);}
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader']});
try{const page=await browser.newPage();await page.setContent('<canvas width="256" height="256"></canvas>');console.log(JSON.stringify(await page.evaluate(async({positions,normals,packed})=>{
 const gl=document.querySelector('canvas').getContext('webgl2',{antialias:false,preserveDrawingBuffer:true});if(!gl)return {supported:false};
 const dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
 const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 const common='out vec3 n; vec4 project(vec3 p){return vec4((p.x-p.z)/36.,(p.y-8.)/18.+(p.x+p.z-32.)/72.,(p.x+p.z)/100.,1.);}';
 const standard='#version 300 es\nprecision highp float;in vec3 position;in vec3 normal;'+common+'void main(){n=normal;gl_Position=project(position);}';
 const pull='#version 300 es\nprecision highp float;precision highp int;uniform sampler2D quads;'+common+'void main(){int q=gl_VertexID/6;int k=gl_VertexID%6;int c=k==3?0:k==4?2:k==5?3:k;vec3 p=texelFetch(quads,ivec2(0,q),0).xyz;vec3 a=texelFetch(quads,ivec2(1,q),0).xyz;vec3 b=texelFetch(quads,ivec2(2,q),0).xyz;n=normalize(cross(a,b));p+=((c==1||c==2)?a:vec3(0.))+((c==2||c==3)?b:vec3(0.));gl_Position=project(p);}';
 const frag='#version 300 es\nprecision highp float;in vec3 n;out vec4 color;void main(){color=vec4(vec3(.2,.5,.3)*(.5+.5*max(dot(normalize(n),normalize(vec3(1.,2.,3.))),0.)),1.);}';
 const program=vs=>{const p=gl.createProgram();for(const [type,src]of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,frag]]){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
 const base=program(standard),pulled=program(pull),vao=gl.createVertexArray();gl.bindVertexArray(vao);
 for(const [name,data]of [['position',positions],['normal',normals]]){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const loc=gl.getAttribLocation(base,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);}
 const pv=gl.createVertexArray();gl.bindVertexArray(pv);const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,3,packed.length/12,0,gl.RGBA,gl.FLOAT,new Float32Array(packed));
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(0,0,0,1);
 const draw=(p,v)=>{gl.useProgram(p);gl.bindVertexArray(v);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,positions.length/3);};
 const read=(p,v)=>{draw(p,v);const a=new Uint8Array(256*256*4);gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
 const a=read(base,vao),b=read(pulled,pv);let different=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])different++;
 const measure=async(p,v)=>{for(let i=0;i<20;i++)draw(p,v);gl.finish();const q=ext?gl.createQuery():null;if(q)gl.beginQuery(ext.TIME_ELAPSED_EXT,q);const t=performance.now();for(let i=0;i<100;i++)draw(p,v);gl.finish();const wallMs=(performance.now()-t)/100;if(q){gl.endQuery(ext.TIME_ELAPSED_EXT);gl.flush();for(let i=0;i<100&&!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE);i++)await new Promise(r=>setTimeout(r,10));if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT))return {wallMs,gpuMs:gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6/100};}return {wallMs,gpuMs:null};};
 return {supported:true,gpu,quads:packed.length/12,baselinePositionNormalBytes:(positions.length+normals.length)*4,packedBytes:packed.length*4,pixelBytesDifferent:different,baseline:await measure(base,vao),vertexPulling:await measure(pulled,pv),glError:gl.getError()};
},{positions:mesh.positions,normals:mesh.normals,packed}),null,2));}finally{await browser.close();}
