import { createContinentalTerrain } from './continental-terrain.mjs';
import { noCaveInBlock, densityBounds, blendBounds } from "./terrain-interval.mjs";
import { terrainProfile } from "./terrain-profiles.mjs";
import { DensitySlice } from './native-density.mjs';
import { terrainFor } from './frontier.mjs';
// Preserve existing settlement/surface coordinates inside the protected edit area.
// All ground uses volume occupancy; native perturbation starts beyond160m.
// Planar projection/base heights are browser adapters;
// native density/noise/cave arithmetic itself is fixture-verified unchanged.
export const VOLUME_EDGE=160;
export const isVoxelFrontier=(x,z)=>Math.max(Math.abs(x),Math.abs(z))>=VOLUME_EDGE;
export function createTerrainField(seed,realm,generation=null,{batchBlocks=true}={}) {
  const profile=terrainProfile(realm),legacyHeight=terrainFor(seed,realm),continental=generation?.version===2&&realm==='bastion'?createContinentalTerrain(seed,legacyHeight,generation.sourceVersion==='continental-drainage-v2'?generation.anchor:null):null,baseHeight=continental?.height||legacyHeight,kernel=new DensitySlice(seed,profile.radius),columns=new Map();
  const columnAt=(x,z)=>{
    const key=x+':'+z;let column=columns.get(key);
    if(!column){const distance=Math.max(Math.abs(x),Math.abs(z)),len=Math.hypot(x,profile.radius,z);column={base:baseHeight(x,z),distance,blend:Math.min(1,(distance-VOLUME_EDGE)/32),dir:[x/len,profile.radius/len,z/len]};if(columns.size>=65536)columns.clear();columns.set(key,column);}
    return column;
  };
  const sampleColumn=(column,y)=>{
    const {base,distance,blend,dir}=column;
    // Hydrology owns the surface zero crossing. Native caves remain below the
    // soil layer; surface noise must not dam the solved river/lake outlets.
    if(continental) return y>=base?-1:base-y<24?base-y:kernel.caveCarve(dir,y,base)>0?-1:1;
    if(distance<VOLUME_EDGE)return base-y;
    const squash=profile.squash;
    if(y>base+3.4*squash)return -1;
    if(y<base-3.4*squash)return blend===1&&kernel.caveCarve(dir,y,base)>0?-1:1;
    const d=(base-y)*(1-blend)+kernel.density(dir,y,base,squash)*blend;
    return d>0&&!(blend===1&&kernel.caveCarve(dir,y,base)>0)?1:-1;
  };
  const field=(x,y,z)=>sampleColumn(columnAt(x,z),y);
  // Exact 16-cubed sampling: resolve each horizontal dependency once, then
  // evaluate its sixteen altitudes without per-cell string keys or Map lookups.
  // The scalar path remains the fallback/oracle; neither values nor layout change.
  if(batchBlocks)field.fillBlock=([bx,by,bz],data)=>{
    for(let z=0;z<16;z++)for(let x=0;x<16;x++){
      const column=columnAt(bx+(x+.5)/16,bz+(z+.5)/16);
      for(let y=0;y<16;y++)data[x+16*(y+16*z)]=sampleColumn(column,by+(y+.5)/16)>0?1:0;
    }
    return data;
  };
  // Exact per-microcolumn bounds for guarantees already enforced by field.
  // Unknown cave-bearing blocks return null, never guessed uniform.
  const blockColumns=new Map();
  field.uniformBlock=([bx,by,bz])=>{
    const key=bx+':'+bz;let c=blockColumns.get(key);
    if(!c){let low=Infinity,high=-Infinity,dmin=Infinity,dmax=-Infinity;
      for(let z=0;z<16;z++)for(let x=0;x<16;x++){const px=bx+(x+.5)/16,pz=bz+(z+.5)/16,h=baseHeight(px,pz),d=Math.max(Math.abs(px),Math.abs(pz));low=Math.min(low,h);high=Math.max(high,h);dmin=Math.min(dmin,d);dmax=Math.max(dmax,d);}
      c={low,high,dmin,dmax};if(blockColumns.size>=4096)blockColumns.delete(blockColumns.keys().next().value);blockColumns.set(key,c);
    }
    const lowY=by+1/32,highY=by+31/32;
    if(continental){
      if(lowY>=c.high)return 0;
      if(highY<c.low&&(lowY>c.high-24||noCaveInBlock(kernel,[bx,by,bz],[c.low,c.high])))return 1;
      return null;
    }
    if(c.dmax<VOLUME_EDGE){if(highY<c.low)return 1;if(lowY>=c.high)return 0;return null;}
    const margin=3.4*profile.squash;
    if(lowY>c.high+margin)return 0;
    if(highY<c.low-margin&&(c.dmax<VOLUME_EDGE+32||noCaveInBlock(kernel,[bx,by,bz],[c.low,c.high])))return 1;
    const native=densityBounds(kernel,[bx,by,bz],[c.low,c.high],profile.squash),plain=[c.low-highY,c.high-lowY],blend=[Math.max(0,Math.min(1,(c.dmin-VOLUME_EDGE)/32)),Math.max(0,Math.min(1,(c.dmax-VOLUME_EDGE)/32))];
    const density=blendBounds(plain,native,blend);
    if(density[1]<=0)return 0;
    if(density[0]>0&&(c.dmax<VOLUME_EDGE+32||noCaveInBlock(kernel,[bx,by,bz],[c.low,c.high])))return 1;
    return null;
  };
  field.baseHeight=baseHeight;
  field.generation=continental?{version:2,sourceVersion:continental.sourceVersion,anchor:{x:continental.anchor.x,z:continental.anchor.z,height:continental.anchor.height}}:{version:1};
  field.waterHeight=continental?(x,z)=>continental.sample(x,z).waterHeight:()=>null;
  field.landform=continental?.sample||null;
  field.surfaceHeight=(x,z)=>{const base=baseHeight(x,z);if(continental)return Math.floor(base*16+.5)/16;let lo=base-5,hi=base+5;for(let i=0;i<10;i++){const y=(lo+hi)/2;if(field(x,y,z)>0)lo=y;else hi=y;}return Math.floor(((lo+hi)/2)*16+.5)/16;};
  return field;
}
