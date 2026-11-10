import {fieldNoise} from '../chunks.mjs';
// Browser habitat adapter. Canonical species materials come from the source registry;
// these climate fields/densities are not a claim of Minecraft/mod biome placement parity.
export const TREE_HABITATS={bastion:{temperature:.62,moisture:.58},moon:{temperature:.3,moisture:.22},cinder:{temperature:.9,moisture:.18},frost:{temperature:.12,moisture:.45},orbit:{temperature:.5,moisture:.5}};
export function treeEcology(seed,realm,x,z){
 const p=TREE_HABITATS[realm]||TREE_HABITATS.bastion,clamp=n=>Math.max(0,Math.min(1,n));
 const temperature=clamp(p.temperature+(fieldNoise(seed^731,x,z,240)-.5)*.6),moisture=clamp(p.moisture+(fieldNoise(seed^177,x,z,180)-.5)*.8),wind=fieldNoise(seed^193,x,z,300)*.5;
 const species=realm==='cinder'?'emberwood':realm==='frost'||temperature<.32?'spruce':temperature>.62&&moisture<.5?'acacia':'oak';
 return {species,environment:{temperature,moisture,wind,season:0}};
}
