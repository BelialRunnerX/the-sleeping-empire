// Terrain generator identity is separate from save schema and sparse edit schema.
// Old profiles never silently receive a changed baseline under their buildings.
export function normalizeTerrainGeneration(raw) {
 if(raw?.version!=null&&![1,2].includes(raw.version))throw new Error("Unsupported terrain generator version");
 if(raw?.version!==2)return {version:1};
 const sourceVersion="continental-drainage-v2";
 if(raw.sourceVersion&&raw.sourceVersion!==sourceVersion)throw new Error("Unsupported continental terrain source version");
 const a=raw.sourceVersion===sourceVersion?raw.anchor:null;
 if(a==null)return {version:2,sourceVersion,anchor:null};
 if(![a.x,a.z,a.height].every(Number.isFinite)||Math.abs(a.x)>16384||Math.abs(a.z)>16384||Math.abs(a.height)>10000)throw new Error("Invalid continental terrain anchor");
 return {version:2,sourceVersion,anchor:{x:a.x,z:a.z,height:a.height}};
}
