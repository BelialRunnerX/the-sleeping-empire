/** Canonical material identity/provenance layer. No world generation or inventory side effects. */
const ID = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;
export function isCanonicalId(value) { return typeof value === 'string' && ID.test(value); }
function deepFreeze(x) { if(x && typeof x==='object' && !Object.isFrozen(x)){Object.freeze(x);for(const v of Object.values(x))deepFreeze(v);} return x; }
const clone = x => JSON.parse(JSON.stringify(x));

export function createMaterialRegistry(input, {aliases={}, tagMembers={}}={}) {
 if(input?.schemaVersion!==1 || !Array.isArray(input.items) || !Array.isArray(input.tags))throw new TypeError('Unsupported material manifest');
 const data=deepFreeze(clone(input));
 const items=new Map(), tags=new Map(), aliasMap=new Map();
 for(const item of data.items){
  if(!isCanonicalId(item.id)||items.has(item.id))throw new TypeError('Invalid or duplicate item ID: '+item.id);
  items.set(item.id,item);
 }
 for(const tag of data.tags){
  if(!isCanonicalId(tag.id)||tags.has(tag.id))throw new TypeError('Invalid or duplicate tag ID: '+tag.id);
  tags.set(tag.id,tag);
 }
 for(const [from,to] of Object.entries({...data.aliases,...aliases})){
  if(!from || typeof to!=='string' || items.has(from))throw new TypeError('Alias shadows item or is invalid: '+from);
  aliasMap.set(from,to);
 }
 function canonicalId(id){
  if(typeof id!=='string')return null;
  const seen=new Set();
  while(aliasMap.has(id)){
   if(seen.has(id))throw new TypeError('Alias cycle: '+id);
   seen.add(id);id=aliasMap.get(id);
  }
  return items.has(id)?id:null;
 }
 for(const from of aliasMap.keys())if(!canonicalId(from))throw new TypeError('Unresolved alias: '+from);
 const memberMap=new Map();
 for(const [id,members] of Object.entries(tagMembers)){
  if(!tags.has(id)||!Array.isArray(members))throw new TypeError('Invalid tag definition: '+id);
  const resolved=members.map(canonicalId);
  if(resolved.some(x=>!x))throw new TypeError('Unknown tag member: '+id);
  memberMap.set(id,Object.freeze([...new Set(resolved)].sort()));
 }
 return Object.freeze({
  source:data.source,
  itemCount:items.size,
  tagCount:tags.size,
  canonicalId,
  get(id){const key=canonicalId(id);return key?items.get(key):null;},
  list({origin,family,form}={}){return Object.freeze([...items.values()].filter(x=>(!origin||x.origin===origin)&&(!family||x.family===family)&&(!form||x.form===form)));},
  resolveIngredient(ingredient){
   if(ingredient?.kind==='item'){
    const id=canonicalId(ingredient.id);
    return Object.freeze({status:id?'resolved':'unknown',kind:'item',id:ingredient.id,members:Object.freeze(id?[id]:[])});
   }
   if(ingredient?.kind==='tag'){
    const id=ingredient.id, members=memberMap.get(id);
    return Object.freeze({status:!tags.has(id)?'unknown':members?'resolved':'unresolved',kind:'tag',id,members:members??Object.freeze([])});
   }
   throw new TypeError('Ingredient must explicitly identify item or tag');
  },
  /** Migration is lossless for unknown IDs; invalid amounts are reported, never silently credited. */
  normalizeInventory(input){
   if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Inventory must be an object');
   const known=Object.create(null),unknown=Object.create(null),rejected=[];
   for(const [id,amount] of Object.entries(input)){
    if(!Number.isSafeInteger(amount)||amount<0){rejected.push({id,amount,reason:'invalid-amount'});continue;}
    const canonical=canonicalId(id),target=canonical?known:unknown,key=canonical??id;
    const total=(target[key]??0)+amount;
    if(!Number.isSafeInteger(total)){rejected.push({id,amount,reason:'overflow'});continue;}
    target[key]=total;
   }
   return {known,unknown,rejected};
  }
 });
}
