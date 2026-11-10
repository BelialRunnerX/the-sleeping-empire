import {createTerrainField} from './terrain-field.mjs';
import {TerrainVolume} from './terrain-volume.mjs';
import {buildWaterTile} from './terrain-water-mesh.mjs';
let identity='',field;
self.onmessage=({data:j})=>{try{const key=JSON.stringify([j.seed,j.realm,j.generation]);if(key!==identity){field=createTerrainField(j.seed,j.realm,j.generation);identity=key;}const volume=new TerrainVolume(j.store,j.realm,field),start=performance.now();const result=buildWaterTile({sample:field.landform,minX:j.minX,minZ:j.minZ,size:j.size,step:j.step,maxCells:70000,allowCoarse:j.step>2,isSolid:(x,y,z)=>volume.material([Math.floor(x*16),Math.floor(y*16),Math.floor(z*16)])>0});self.postMessage({token:j.token,kind:j.kind,rect:[j.minX,j.minZ,j.minX+j.size,j.minZ+j.size],...result,milliseconds:performance.now()-start},[result.positions.buffer,result.indices.buffer]);}catch(e){self.postMessage({token:j.token,error:String(e.message||e)});}};

