import { createAtlas } from './mountain-hydrology.mjs';
// Browser continental adaptation. The legacy sanctuary is retained in a certified
// dry plain; all water and terrain use the same translated global datum.
export const CONTINENTAL_GENERATION = 2;
export function createContinentalTerrain(seed, legacyHeight, savedAnchor = null) {
  const atlas = createAtlas({ seed });
  const anchor = savedAnchor || atlas.suitableSpawn(224);
  if (!anchor || ![anchor.x, anchor.z, anchor.height].every(Number.isFinite))
    throw new Error('No safe continental sanctuary anchor');
  const smooth = t => { t = Math.max(0, Math.min(1,t)); return t*t*(3-2*t); };
  function sample(x,z) {
    const macro=atlas.sample(x+anchor.x,z+anchor.z), distance=Math.hypot(x,z);
    const blend=smooth((distance-32)/64), original=blend<1?legacyHeight(x,z):0;
    const height=original*(1-blend)+(macro.height-anchor.height)*blend;
    // The certified dry exclusion includes an interpolation halo. Never blend
    // or independently raise a river surface: solved drainage starts outside it.
    const waterHeight=macro.waterHeight===null?null:macro.waterHeight-anchor.height;
    if (distance<224 && waterHeight!==null) throw new Error('Wet sanctuary anchor');
    return {...macro,height,waterHeight,water:waterHeight,seaLevel:macro.seaLevel-anchor.height};
  }
  return {version:CONTINENTAL_GENERATION,sourceVersion:atlas.version,anchor:Object.freeze({...anchor}),atlas,sample,height:(x,z)=>sample(x,z).height};
}
