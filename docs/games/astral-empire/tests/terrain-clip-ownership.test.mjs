import assert from 'node:assert/strict';import {subtractVoxelBoxes,subtractBoxes,subtractAABBUnion} from '../engine/terrain-clip.mjs';
const box={min:[0,0,0],max:[1,1,1]};
function tri(axis,height,sign,wide=false){const u=(axis+1)%3,v=(axis+2)%3;let vs=[[0,0,0],[0,0,0],[0,0,0]];for(const p of vs)p[axis]=height;vs[0][u]=vs[0][v]=wide?-1:.1;vs[1][u]=wide?3:.9;vs[1][v]=wide?-1:.1;vs[2][u]=wide?-1:.1;vs[2][v]=wide?3:.9;if(sign<0)[vs[1],vs[2]]=[vs[2],vs[1]];return vs.map(p=>[...p,...[0,1,2].map(a=>a===axis?sign:0)]);}
let cases=0;
for(let axis=0;axis<3;axis++)for(const [side,height]of [['min',0],['max',1]])for(const sign of [-1,1]){
 const t=tri(axis,height,sign),outside=side==='min'?sign>0:sign<0;
 assert.equal(subtractVoxelBoxes(t,[box]).length,outside?1:0,`${axis} ${side} ${sign}`);
 assert.equal(subtractBoxes(t,[box]).length,0,'closed contract unchanged');
 const neighbor={min:[0,0,0],max:[1,1,1]};neighbor.min[axis]+=side==='min'?-1:1;neighbor.max[axis]+=side==='min'?-1:1;
 assert.equal(subtractVoxelBoxes(t,[box,neighbor]).length,0,'both owners patched removes shared face');
 assert.equal(subtractVoxelBoxes(t,[neighbor,box]).length,0,'union order independent');
 assert.equal(subtractVoxelBoxes(t,[box,box]).length,outside?1:0,'duplicate box');
 const wide=tri(axis,height,sign,true),pieces=subtractVoxelBoxes(wide,[box]);assert.ok(pieces.length>0);
 if(outside)assert.deepEqual(pieces,[wide],'greedy unpatched outside face crossing box stays intact');
 // Just inside cannot get incorrectly retained by an epsilon ownership test.
 assert.equal(subtractVoxelBoxes(tri(axis,height+(side==='min'?1:-1)/16,sign),[box]).length,0);
 cases++;
}
const airBox={min:[0,0,0],max:[1,1,1]},solidNeighborFace=tri(0,1,-1);
assert.deepEqual(subtractVoxelBoxes(solidNeighborFace,[airBox]),[solidNeighborFace],'mine-air-neighbor-face retains');
assert.equal(subtractAABBUnion([solidNeighborFace],[airBox,{min:[1,0,0],max:[2,1,1]}],{voxelOwnership:true}).length,0,'fill/owner-remesh removes');
console.log({ownershipOrientations:cases,axes:3,mineFillUnion:'pass',attributes:'preserved'});
