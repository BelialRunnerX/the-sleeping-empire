import {meshTree} from './tree-mesh.mjs';
self.onmessage=({data})=>{try{const result=meshTree(data.input,data.saved);self.postMessage({job:data.job,result},[result.position.buffer,result.normal.buffer,result.color.buffer,result.index.buffer]);}catch(e){self.postMessage({job:data.job,error:String(e.stack||e)});}};
