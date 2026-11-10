import {generateRiverPreview} from './river-preview-data.mjs';
self.onmessage=({data})=>{try{const result=generateRiverPreview(data);self.postMessage(result,[result.terrain.positions.buffer,result.terrain.colors.buffer,result.terrain.indices.buffer,result.water.positions.buffer,result.water.indices.buffer]);}catch(error){self.postMessage({error:String(error.message||error)});}};
