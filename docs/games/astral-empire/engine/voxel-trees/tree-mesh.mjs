import {generatePlacedTree} from './tree-placement.mjs';
import {createTreeState,exposedFaces} from './voxel-trees.mjs';
const srgb=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
const CORNERS={
 '1,0,0':[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],
 '-1,0,0':[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],
 '0,1,0':[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],
 '0,-1,0':[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
 '0,0,1':[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],
 '0,0,-1':[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]};
export function meshTree(input,saved){const tree=generatePlacedTree(input),state=createTreeState(tree,saved),faces=exposedFaces(tree,state),n=faces.length;
 const position=new Float32Array(n*12),normal=new Float32Array(n*12),color=new Float32Array(n*12),index=new Uint32Array(n*6);
 faces.forEach((f,j)=>{const rgb=tree.palette[f.tint].map(v=>srgb(v/255)),corners=CORNERS[f.normal.join(',')];for(let v=0;v<4;v++)for(let axis=0;axis<3;axis++){const k=j*12+v*3+axis;position[k]=(f.min[axis]-tree.anchorMicro[axis]+corners[v][axis]*4)/16;normal[k]=f.normal[axis];color[k]=rgb[axis];}index.set([j*4,j*4+1,j*4+2,j*4,j*4+2,j*4+3],j*6);});
 return {tree,position,normal,color,index,faceCount:n};}
