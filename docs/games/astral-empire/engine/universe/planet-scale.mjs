// Explicit scale contract only. No world generation or scene mutation.
export const MICRO_PER_METRE=16;
export const SIGNED_MICRO_MAX=2147483647;
export function planetScale({radiusMetres,minAltitudeMetres,maxAltitudeMetres,microLimit=SIGNED_MICRO_MAX}) {
 for(const v of [radiusMetres,minAltitudeMetres,maxAltitudeMetres])if(!Number.isFinite(v))throw Error('Explicit finite metre dimensions required');
 if(!Number.isSafeInteger(microLimit)||microLimit<1||microLimit>SIGNED_MICRO_MAX)throw Error('Invalid signed micro envelope');
 if(radiusMetres<=0||minAltitudeMetres>maxAltitudeMetres||radiusMetres+minAltitudeMetres<=0)throw Error('Invalid radial shell');
 const outerRadiusMetres=radiusMetres+maxAltitudeMetres;
 // Conservative closed shell: must fit positive AND negative Cartesian extremes.
 if(Math.ceil(outerRadiusMetres*MICRO_PER_METRE)>microLimit)throw Error('Planet plus relief exceeds signed32 subvoxel envelope');
 const faceMicroWidth=Math.ceil(Math.PI*radiusMetres/2*MICRO_PER_METRE);
 if(Math.ceil(faceMicroWidth/2)>microLimit)throw Error('Centered face micro coordinates exceed signed envelope');
 return Object.freeze({radiusMetres,minAltitudeMetres,maxAltitudeMetres,outerRadiusMetres,microLimit,microPerMetre:MICRO_PER_METRE,faceMicroWidth,faceIndexRequiresWideIntermediate:faceMicroWidth>SIGNED_MICRO_MAX,
   address:'planet stable ID + canonical face + centered face micro/chunk-local + radial micro altitude',physicalScaleAssigned:true});
}
export function chunkLocalMicro(signedMicro,chunkMicro=512) {
 if(!Number.isSafeInteger(signedMicro)||(signedMicro< -2147483648||signedMicro>SIGNED_MICRO_MAX)||!Number.isSafeInteger(chunkMicro)||chunkMicro<1)throw Error('Invalid exact micro address');
 const chunk=Math.floor(signedMicro/chunkMicro);return{chunk,local:signedMicro-chunk*chunkMicro};
}
/** Projected geometric ERROR, not patch width. Camera-relative inputs only. */
export function projectedErrorPixels(errorMetres,distanceMetres,viewportHeight,fovRadians) {
 if(![errorMetres,distanceMetres,viewportHeight,fovRadians].every(Number.isFinite)||errorMetres<0||distanceMetres<=0||viewportHeight<=0||fovRadians<=0||fovRadians>=Math.PI)throw Error('Invalid view/error inputs');
 return errorMetres*viewportHeight/(2*Math.tan(fovRadians/2)*distanceMetres);
}

