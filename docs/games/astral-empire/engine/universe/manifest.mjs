export const UNIVERSE_VERSION='universe-survey-v1';
export const UNIVERSE_RECIPE=UNIVERSE_VERSION+':0.85:0.65:4';
export function universeManifest(input,seed){
 const text=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n&&!/[\x00-\x1f]/.test(v);
 if(input&&text(input.version,128)&&text(input.universalSeed,128)&&text(input.recipeId,256))return {version:input.version,universalSeed:input.universalSeed,recipeId:input.recipeId};
 return {version:UNIVERSE_VERSION,universalSeed:String(seed),recipeId:UNIVERSE_RECIPE};
}
export const supportedUniverse=m=>m?.version===UNIVERSE_VERSION&&m?.recipeId===UNIVERSE_RECIPE;
