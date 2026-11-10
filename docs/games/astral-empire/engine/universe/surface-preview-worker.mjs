import {generateSurfacePreview} from './surface-preview-data.mjs';
self.onmessage=({data})=>{try{const result=generateSurfacePreview(data.parameters,data.resolution);self.postMessage({serial:data.serial,...result},[result.positions.buffer,result.normals.buffer,result.colors.buffer,result.indices.buffer]);}catch(error){self.postMessage({serial:data.serial,error:String(error.message||error)});}};
