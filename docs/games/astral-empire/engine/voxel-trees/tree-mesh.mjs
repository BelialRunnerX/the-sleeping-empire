import {createTreeState,exposedFaces} from './voxel-trees.mjs';
import {generatePlacedTree as generateTree} from './tree-placement.mjs';
const srgb=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
const CORNERS={
 '1,0,0':[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],
 '-1,0,0':[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],
 '0,1,0':[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],
 '0,-1,0':[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
 '0,0,1':[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],
 '0,0,-1':[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]};
// Exact same exposed surface, canonical material and tint. No decimation of occupancy.
export function greedyFaces(faces,cellMicro){
 const planes=new Map();
 for(const f of faces){const axis=f.normal.findIndex(v=>v!==0),uv=[0,1,2].filter(i=>i!==axis),plane=f.min[axis]+(f.normal[axis]>0?cellMicro:0),key=JSON.stringify([axis,f.normal[axis],plane,f.materialId,f.tint]);let group=planes.get(key);if(!group){group={axis,uv,face:f,cells:new Map()};planes.set(key,group);}group.cells.set(`${f.min[uv[0]]},${f.min[uv[1]]}`,f);}
 const result=[];
 for(const g of planes.values()){
 const {cells,uv}=g;
 for(const f of cells.values()){
 const u=f.min[uv[0]],v=f.min[uv[1]];let width=1,height=1;
 while(cells.has(`${u+width*cellMicro},${v}`))width++;
 outer:for(;;height++){for(let i=0;i<width;i++)if(!cells.has(`${u+i*cellMicro},${v+height*cellMicro}`))break outer;}
 for(let j=0;j<height;j++)for(let i=0;i<width;i++)cells.delete(`${u+i*cellMicro},${v+j*cellMicro}`);
 const size=[cellMicro,cellMicro,cellMicro];size[uv[0]]=width*cellMicro;size[uv[1]]=height*cellMicro;
 result.push({...f,size});
 }
 }
 return result;
}
export function meshTree(input,saved){const tree=generateTree(input);return meshGeneratedTree(tree,saved,{renderDetail:input.renderDetail});}
export function meshGeneratedTree(tree,saved,{renderDetail='exact'}={}){if(!['exact','two-tone'].includes(renderDetail))throw Error('Unknown tree render detail');const state=createTreeState(tree,saved),raw=exposedFaces(tree,state),renderFaces=renderDetail==='two-tone'?raw.map(f=>({...f,tint:f.tint<4?f.tint-f.tint%2:f.tint})):raw,faces=greedyFaces(renderFaces,tree.cellMicro),n=faces.length;
 const position=new Float32Array(n*12),normal=new Float32Array(n*12),color=new Float32Array(n*12),index=new Uint32Array(n*6);
 faces.forEach((f,j)=>{const rgb=tree.palette[f.tint].map(v=>srgb(v/255)),corners=CORNERS[f.normal.join(',')];for(let v=0;v<4;v++)for(let axis=0;axis<3;axis++){const k=j*12+v*3+axis;position[k]=(f.min[axis]-tree.anchorMicro[axis]+corners[v][axis]*f.size[axis])/16;normal[k]=f.normal[axis];color[k]=rgb[axis];}index.set([j*4,j*4+1,j*4+2,j*4,j*4+2,j*4+3],j*6);});
 return {tree,position,normal,color,index,faceCount:n,unmergedFaceCount:raw.length,renderDetail};}
