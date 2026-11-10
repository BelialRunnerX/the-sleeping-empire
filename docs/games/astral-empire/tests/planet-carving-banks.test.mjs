import assert from 'node:assert/strict';
import {createPlanetSurface} from '../engine/universe/planet-surface.mjs';
import {createMacroCarving} from '../engine/universe/planet-carving.mjs';
const R=6371000,s=createPlanetSurface({universalSeed:'1701',planetId:'banks',radiusMetres:R,macroResolution:32}),c=createMacroCarving(s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
let tests=0,maxEditAtBank=0;
for(const e of c.edges){
 const mid=norm(e.a.map((x,i)=>x+e.b[i])),normal=norm(cross(e.a,e.b));
 for(const sign of [-1,1]){
 const d=norm(mid.map((x,i)=>x*Math.cos(40/R)+sign*normal[i]*Math.sin(40/R))),v=c.sample(d);
 const edit=Math.abs(v.heightMetres-v.baseHeightMetres);maxEditAtBank=Math.max(maxEditAtBank,edit);
 assert.ok(edit<1e-5);tests++;
 }
}
console.log({bankChecks:tests,maxEditAtBank});
