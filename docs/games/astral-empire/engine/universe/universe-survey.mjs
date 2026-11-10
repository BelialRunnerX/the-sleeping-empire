import { solarSystemCandidate, planetCandidateInSystem, globalField, richness, deriveSubsystemSeed } from './galaxy-fields.mjs';
import { planetEnvironmentFields } from './planet-environment.mjs';

export const SURVEY_VERSION = 'universe-survey-v1';
export const SOURCE_PROVENANCE = Object.freeze({
  sourceCommit: 'c0ebd4692c4e95964149a119bd5fff7a4f9d4ea4',
  sourcePath: 'elysium-space/src/main/java/com/elysium/space/world/SpaceWorld.java',
  authority: 'Preset air, gravity and hazard values from source; procedural placement/selector are adaptations.',
});
const MAX_QUERY_CELLS = 4096, MAX_PAGE_CELLS = 128;
function canonicalSeed(seed) {
  if (typeof seed === 'number' && !Number.isSafeInteger(seed)) throw Error('Seed number must be a safe integer; use text otherwise');
  if (!['string','number','bigint'].includes(typeof seed)) throw Error('Explicit universal seed required');
  const s=String(seed); if (!s || s.length>128 || /[\x00-\x1f]/.test(s)) throw Error('Invalid universal seed'); return s;
}
function coordinate(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw Error('Global coordinates require exact integers');
  if (!['string','number','bigint'].includes(typeof value) || !/^-?\d+$/.test(String(value)) || String(value).length>80) throw Error('Invalid global coordinate');
  return BigInt(value);
}
function vector(v) { if(!Array.isArray(v)||v.length!==3)throw Error('Three axes required'); return v.map(coordinate); }
function integer(n,min,max,label) { if(!Number.isInteger(n)||n<min||n>max)throw Error(`Invalid ${label}`);return n; }
function pageRange(total,cursor,limit) {integer(cursor,0,total,'cursor');integer(limit,1,MAX_PAGE_CELLS,'page budget');return Math.min(total,cursor+limit);}
function cellAt(min,size,i) {const x=i%size[0],y=Math.floor(i/size[0])%size[1],z=Math.floor(i/(size[0]*size[1]));return [min[0]+BigInt(x),min[1]+BigInt(y),min[2]+BigInt(z)];}

/** Read-only hierarchical survey. Never mutates profiles, terrain, ECS or world history. */
export function createUniverseSurvey(universalSeed, options={}) {
  const seed=canonicalSeed(universalSeed);
  const systemThreshold=options.systemThreshold??.85,planetThreshold=options.planetThreshold??.65,radiusCells=options.radiusCells??4;
  for(const n of [systemThreshold,planetThreshold])if(!Number.isFinite(n)||n<0||n>1)throw Error('Threshold must be normalized');
  integer(radiusCells,1,8,'system-local radius');
  const resources=[...(options.resources??['minecraft:raw_iron','minecraft:raw_copper','elysiumores:raw_cobalt'])];
  if(resources.length>16 || new Set(resources).size!==resources.length || resources.some(x=>typeof x!=='string'||!/^[-a-z0-9_:]{1,64}$/.test(x)))throw Error('Invalid resource tags');
  // Recipe tuning changes identity explicitly. Adding a resource does NOT move bodies.
  const recipeId=`${SURVEY_VERSION}:${systemThreshold}:${planetThreshold}:${radiusCells}`;
  const fieldSeed=JSON.stringify([seed,recipeId]);
  const manifest=Object.freeze({version:SURVEY_VERSION,universalSeed:seed,recipeId,systemThreshold,planetThreshold,radiusCells,resources:Object.freeze(resources),status:'read-only hierarchical survey; not navigable space',maxQueryCells:MAX_QUERY_CELLS,maxPageCells:MAX_PAGE_CELLS});
  function resolveSystem(cell) {
    const c=vector(cell),s=solarSystemCandidate(fieldSeed,c,{threshold:systemThreshold,version:recipeId});
    return s ? {...s,recipeId,coordinateUnits:'global coarse cells; physical scale not assigned',localRadiusCells:radiusCells}:null;
  }
  function checkedSystem(system) {
    const actual=resolveSystem(system?.cell);
    if(!actual||actual.id!==system.id)throw Error('System identity does not belong to this universe recipe');return actual;
  }
  function scanSystems({min,size,cursor=0,limit=128}) {
    const origin=vector(min);if(!Array.isArray(size)||size.length!==3)throw Error('Three extents required');
    const extents=size.map(n=>integer(n,1,MAX_QUERY_CELLS,'query extent')),total=extents.reduce((a,b)=>a*b,1);
    if(total>MAX_QUERY_CELLS)throw Error('Query exceeds bounded cell budget');
    const end=pageRange(total,cursor,limit),systems=[];
    for(let i=cursor;i<end;i++){const s=resolveSystem(cellAt(origin,extents,i));if(s)systems.push(s);}
    return {version:SURVEY_VERSION,recipeId,systems,scanned:end-cursor,total,nextCursor:end<total?end:null,complete:end===total};
  }
  function planetDetails(planet) {
    const cell=planet.localPosition.map(Math.floor),offset=planet.localPosition.map((v,i)=>v-cell[i]);
    const objectSeed=JSON.stringify([seed,recipeId,planet.id]);
    return {...planet,recipeId,environment:structuredClone(planetEnvironmentFields(objectSeed,cell,offset)),
      richness:globalField(objectSeed,'richness',cell,offset),resources:Object.fromEntries(resources.map(id=>[id,richness(objectSeed,id,cell,offset)])),
      terrainSeed:deriveSubsystemSeed(seed,planet.id,'terrain',3),
      provenance:SOURCE_PROVENANCE,notes:'Richness is a normalized field, not a deposit inventory. Terrain seed is a reserved derivation, not generated surface.'};
  }
  function scanPlanets(system,{cursor=0,limit=128}={}) {
    const parent=checkedSystem(system),size=[2*radiusCells,2*radiusCells,2*radiusCells],min=[-radiusCells,-radiusCells,-radiusCells].map(BigInt),total=size[0]**3,end=pageRange(total,cursor,limit),planets=[];
    for(let i=cursor;i<end;i++){const cell=cellAt(min,size,i).map(Number),p=planetCandidateInSystem(fieldSeed,parent,cell,{radiusCells,threshold:planetThreshold});if(p)planets.push(planetDetails(p));}
    return {version:SURVEY_VERSION,systemId:parent.id,planets,scanned:end-cursor,total,nextCursor:end<total?end:null,complete:end===total};
  }
  return Object.freeze({manifest,resolveSystem,scanSystems,scanPlanets});
}

/** Bounded cooperative collector; cancellation is checked before AND after yielding. */
export async function collectSurveyPages(page,{signal,onPage=()=>{},yieldControl=()=>new Promise(r=>setTimeout(r,0))}={}) {
  let cursor=0;const pages=[];
  do { if(signal?.aborted)throw new Error('Survey cancelled');const result=page(cursor);pages.push(result);onPage(result);cursor=result.nextCursor;
    if(cursor!==null){await yieldControl();if(signal?.aborted)throw new Error('Survey cancelled');}
  } while(cursor!==null);
  return pages;
}

