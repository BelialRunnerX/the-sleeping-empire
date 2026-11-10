// Sparse global3D procedural fields. BigInt cell identity, finite local interpolation.
const MASK=(1n<<64n)-1n;
function h(s){let v=14695981039346656037n;for(let i=0;i<s.length;i++){v^=BigInt(s.charCodeAt(i));v=(v*1099511628211n)&MASK;}v^=v>>30n;v=(v*0xbf58476d1ce4e5b9n)&MASK;v^=v>>27n;v=(v*0x94d049bb133111ebn)&MASK;v^=v>>31n;return Number(v>>11n)/9007199254740992;}
const smooth=t=>t*t*(3-2*t);
export function globalField(seed,tag,cell,offset){if(cell.length!==3||offset.length!==3||offset.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Cell+normalized local3D required');const c=cell.map(BigInt),t=offset.map(smooth);let v=0;for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++){const q=[c[0]+BigInt(x),c[1]+BigInt(y),c[2]+BigInt(z)];v+=h(`${seed}|${tag}|${q.join(',')}`)*(x?t[0]:1-t[0])*(y?t[1]:1-t[1])*(z?t[2]:1-t[2]);}return v;}
export function richness(seed,resource,cell,offset){return globalField(seed,'richness',cell,offset)*globalField(seed,`resource:${resource}`,cell,offset);}
export function solarSystemCandidate(seed,cell,{threshold=.85,version='galaxy-fields-v1'}={}){const c=cell.map(BigInt),key=c.join(','),offset=[0,1,2].map(i=>.25+.5*h(`${seed}|anchor:${i}|${key}`)),planetness=globalField(seed,'system-material-density',c,offset);if(planetness<threshold)return null;
 const priority=h(`${seed}|system-priority|${key}`);
 // Sparse independent-set ownership: max candidate priority in neighboring cells.
 // Bodies must have radius<cellSize/4, with anchor jitter restricted to central half.
 for(let z=-1;z<=1;z++)for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){if(!x&&!y&&!z)continue;const q=[c[0]+BigInt(x),c[1]+BigInt(y),c[2]+BigInt(z)],k=q.join(',');const qo=[0,1,2].map(i=>.25+.5*h(`${seed}|anchor:${i}|${k}`)),density=globalField(seed,"system-material-density",q,qo);if(density>planetness||(density===planetness&&h(`${seed}|system-priority|${k}`)>priority))return null;}
 return{id:`${version}:${seed}:system:${key}`,cell:c.map(String),offset,materialDensity:planetness,priority};}
/** Sole authored entropy is universalSeed; each subsystem gets a named derivation. */
export function deriveSubsystemSeed(universalSeed,stableObjectId,tag,fieldVersion=1){return Math.floor(h(`${universalSeed}|derive-v${fieldVersion}|${stableObjectId}|${tag}`)*4294967296);}

/** Planet candidates belong ONLY inside a system's bounded local coordinate region. */
export function planetCandidateInSystem(universalSeed,system,cell,{radiusCells=8,threshold=.65}={}){
 if(!system?.id||!Number.isInteger(radiusCells)||radiusCells<1||radiusCells>1024||cell.length!==3||cell.some(x=>!Number.isSafeInteger(x)))throw Error('Bounded system local cell required');
 const key=cell.join(','),scope=`system:${system.id}`,offset=[0,1,2].map(i=>.25+.5*h(`${universalSeed}|${scope}|planet-anchor:${i}|${key}`)),position=cell.map((x,i)=>x+offset[i]);
 if(Math.hypot(...position)>radiusCells)return null;
 const value=globalField(universalSeed,`${scope}:planetness`,cell,offset);if(value<threshold)return null;
 const priority=h(`${universalSeed}|${scope}|planet-priority|${key}`);
 for(let z=-1;z<=1;z++)for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){if(!x&&!y&&!z)continue;const k=[cell[0]+x,cell[1]+y,cell[2]+z].join(',');if(h(`${universalSeed}|${scope}|planet-priority|${k}`)>priority)return null;}
 return{id:`${system.id}/planet:${key}`,systemId:system.id,localPosition:position,planetness:value,priority};
}

