import { globalField } from './galaxy-fields.mjs';
export const FIELD_PROGRAM_VERSION = 'field-program-v1';
const validName = s => typeof s === 'string' && s.length > 0 && s.length <= 256;
function integer(v) {
  if (typeof v === 'number' && !Number.isSafeInteger(v)) throw Error('Exact integer coordinates required');
  if (!['number','string','bigint'].includes(typeof v) || !/^-?\d{1,80}$/.test(String(v))) throw Error('Bounded exact integer coordinates required');
  return BigInt(v);
}
const floorDiv=(a,b)=>a>=0n?a/b:-((-a+b-1n)/b);
/** Immutable, bounded data-defined fields. No global random state or material-list coupling. */
export function compileFieldProgram(universalSeed, scope, definitions) {
  if (!validName(String(universalSeed)) || !validName(scope)) throw Error('Seed and scope required');
  const entries=Object.entries(definitions || {});
  if (!entries.length || entries.length>64) throw Error('Field count must be 1..64');
  const defs=new Map(entries.map(([id,d])=>{
    if (!validName(id) || !d || !validName(d.tag ?? id) || !Array.isArray(d.layers) || !d.layers.length || d.layers.length>8) throw Error('Invalid field definition');
    const layers=d.layers.map(l=>{
      if (!Number.isSafeInteger(l.scale) || l.scale<1 || l.scale>1048576 || !Number.isFinite(l.weight) || l.weight<=0 || l.weight>1e6) throw Error('Invalid field layer');
      return Object.freeze({scale:l.scale,weight:l.weight});
    });
    return [id,Object.freeze({tag:d.tag??id,layers:Object.freeze(layers),modulateBy:d.modulateBy??null})];
  }));
  const visited=new Set(),active=new Set();
  function visit(id){if(visited.has(id))return;if(active.has(id))throw Error('Field dependency cycle');const d=defs.get(id);if(!d)throw Error('Unknown field dependency');active.add(id);if(d.modulateBy!==null)visit(d.modulateBy);active.delete(id);visited.add(id);}
  for(const id of defs.keys())visit(id);
  const schema=JSON.stringify([...defs].sort(([a],[b])=>a<b?-1:a>b?1:0));
  // Full canonical descriptor, not a collision-prone short hash. Persist with generator version.
  const recipeId=JSON.stringify([FIELD_PROGRAM_VERSION,scope,JSON.parse(schema)]);
  const seed=JSON.stringify([FIELD_PROGRAM_VERSION,String(universalSeed),scope]);
  function sample(cell,offset=[0,0,0],requested=[...defs.keys()]) {
    if(!Array.isArray(cell)||cell.length!==3||!Array.isArray(offset)||offset.length!==3||offset.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Exact cell plus normalized offset required');
    if(!Array.isArray(requested)||requested.length>64||requested.some(id=>!defs.has(id)))throw Error('Unknown requested field');
    const c=cell.map(integer),cache=new Map();
    function evaluate(id){if(cache.has(id))return cache.get(id);const d=defs.get(id);let value=0,total=0;
      for(let i=0;i<d.layers.length;i++){const l=d.layers[i],scale=BigInt(l.scale),coarse=c.map(v=>floorDiv(v,scale)),local=c.map((v,a)=>(Number(v-coarse[a]*scale)+offset[a])/l.scale);
        value+=l.weight*globalField(seed,JSON.stringify([d.tag,i,l.scale]),coarse,local);total+=l.weight;}
      value/=total;if(d.modulateBy!==null)value*=evaluate(d.modulateBy);cache.set(id,value);return value;}
    return Object.fromEntries(requested.map(id=>[id,evaluate(id)]));
  }
  return Object.freeze({version:FIELD_PROGRAM_VERSION,recipeId,sample});
}
export const CORE_FIELD_DATA=Object.freeze({
  richness:{layers:[{scale:128,weight:3},{scale:16,weight:1}]},
  cobalt:{layers:[{scale:48,weight:2},{scale:4,weight:1}],modulateBy:'richness'}
});

/** Bounded region query; ownership uses a one-cell halo independent of query boundaries. */
export function sampleFieldCandidates(program, {field, min, size, threshold=.5, peaksOnly=true}) {
  if (!program?.sample || !validName(field) || !Array.isArray(min) || min.length!==3 || !Array.isArray(size) || size.length!==3 || size.some(v=>!Number.isSafeInteger(v)||v<1||v>8) || !Number.isFinite(threshold)||threshold<0||threshold>1) throw Error('Bounded 1..8 cell region required');
  const origin=min.map(integer),cache=new Map(),out=[];
  const value=c=>{const k=c.join(',');if(!cache.has(k))cache.set(k,program.sample(c,[.5,.5,.5],[field])[field]);return cache.get(k);};
  for(let z=0;z<size[2];z++)for(let y=0;y<size[1];y++)for(let x=0;x<size[0];x++){
    const c=origin.map((v,i)=>v+BigInt([x,y,z][i])),v=value(c);if(v<threshold)continue;let owned=true;
    if(peaksOnly)for(let dz=-1;dz<=1&&owned;dz++)for(let dy=-1;dy<=1&&owned;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy&&!dz)continue;const q=c.map((n,i)=>n+BigInt([dx,dy,dz][i])),other=value(q);
      const earlier=q[0]<c[0]||(q[0]===c[0]&&(q[1]<c[1]||(q[1]===c[1]&&q[2]<c[2])));
      if(other>v||(other===v&&earlier)){owned=false;break;}
    }
    if(owned)out.push({cell:c.map(String),potential:v});
  }
  return out;
}
