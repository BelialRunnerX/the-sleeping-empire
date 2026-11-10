import{globalField}from'./galaxy-fields.mjs';
// Exact values transcribed from Elysium-mono SpaceWorld.java ALL; source IDs kept.
export const SOURCE_WORLDS=Object.freeze({
 high_orbit:{gravity:.07,air:'NONE',hazards:{vacuum:1,radiological:.5},hostileSpawns:false},
 pale_moon:{gravity:.165,air:'NONE',hazards:{vacuum:1,cryogenic:.6},hostileSpawns:true},
 cinderveil:{gravity:.9,air:'TOXIC',hazards:{thermal:1,corrosive:1,pressure:.5},hostileSpawns:true},
 frostfall:{gravity:.38,air:'THIN',hazards:{cryogenic:1,radiological:1,vacuum:.5},hostileSpawns:true},
 emerald_bastion:{gravity:1,air:'BREATHABLE',hazards:{},hostileSpawns:false}
});
export function atmosphericHazards(sourceId,oxygenated=false){const p=SOURCE_WORLDS[sourceId];if(!p)throw Error('Unknown source world');return Object.fromEntries(Object.entries(p.hazards).map(([k,v])=>[k,oxygenated&&(k==='vacuum'||(p.air==='TOXIC'&&k==='corrosive'))?0:v]));}
/** Threshold mapping is NEW browser design, not source procedural planet selector. */
export function planetEnvironmentFields(universalSeed,cell,offset){
 const gas=globalField(universalSeed,'planet-type:gas',cell,offset),temperature=globalField(universalSeed,'planet-temperature',cell,offset),air=globalField(universalSeed,'planet-atmosphere',cell,offset),radiation=globalField(universalSeed,'planet-radiation',cell,offset);
 const fields={gas,temperature,air,radiation};
 if(gas>.75)return{fields,type:'gaseous',surfaceTerrainEligible:false,sourcePreset:null,hazards:null,provenance:'new requested gas-world design; no corresponding mod preset verified'};
 const sourcePreset=temperature>.65?'cinderveil':temperature<.3?(air<.45?'pale_moon':'frostfall'):'emerald_bastion';
 return{fields,type:'rocky',surfaceTerrainEligible:true,sourcePreset,preset:SOURCE_WORLDS[sourcePreset],hazards:atmosphericHazards(sourcePreset),provenance:'source preset values; procedural selector thresholds are adaptation, normalized temperature not degrees'};
}
