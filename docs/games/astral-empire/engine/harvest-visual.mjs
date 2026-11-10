import * as T from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt_decoder.module.js';
import {sampleHarvest} from './harvest-animation.mjs';
const templates=new Map();let loading;
export function loadHarvestTools(){return loading??=Promise.allSettled([['mine','pickaxe'],['chop','axe']].map(async([kind,id])=>{
 const {scene}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('../assets/tools/'+id+'.glb',import.meta.url).href);
 if(new T.Box3().setFromObject(scene,true).isEmpty())throw Error('Empty harvest tool: '+id);
 templates.set(kind,scene);
}));}
export function harvestKind(node){
 const k=node?.kind||node?.type;return ['tree','wood'].includes(k)?'chop':['ore','geode','rock','stone','microvoxel','terrain'].includes(k)?'mine':['berries','berry','shrub','bush','herb','plant','fiber'].includes(k)?'berries':null;
}
// Functional proxy tool geometry, NOT final art. One pair per avatar, owned/disposed with avatar.
function toolsFor(root){
 const rig=root.userData.rig;if(!rig)return null;if(root.userData.harvestTools)return root.userData.harvestTools;
 const hand=rig.bones.R_Hand;root.updateMatrixWorld(true);const size=new T.Vector3();hand.getWorldScale(size);
 const tools={};for(const kind of ['mine','chop']){
  const g=new T.Group();g.name='provisional-'+kind+'-tool';g.rotation.z=Math.PI;g.scale.set(1/size.x,1/size.y,1/size.z);
  const template=templates.get(kind);
  if(template){const model=template.clone(true);model.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=true;}});g.add(model);g.name='authored-'+kind+'-tool';g.userData.authoredHarvestTool=true;}else{
  const metal=new T.MeshStandardMaterial({color:0x7997a4,roughness:.35,metalness:.7}),grip=new T.MeshStandardMaterial({color:0x253e48,roughness:.8});
  const shaft=new T.Mesh(new T.CylinderGeometry(.035,.045,.85,8),grip);shaft.position.y=.25;g.add(shaft);
  const head=new T.Mesh(new T.BoxGeometry(kind==='mine'?.65:.32,.16,.10),metal);head.position.set(kind==='chop'?.12:0,.65,0);g.add(head);}
  g.visible=false;hand.add(g);tools[kind]=g;
 }root.userData.harvestTools=tools;return tools;
}
export function applyHarvestVisual(root,action){
 const rig=root.userData.rig;if(!rig)return false;
 // Base locomotion resets arms/spine but not the wrist. Restore it before
 // layering this frame so contact offsets never accumulate across frames.
 const wrist=rig.bones.R_Hand;
 if(wrist){root.userData.harvestWristRest ||= wrist.quaternion.clone();wrist.quaternion.copy(root.userData.harvestWristRest);}

 const fingers=root.userData.harvestFingers ||= (()=>{const a=[];for(const digit of ["Index","Middle","Ring","Little"])for(let n=1;n<=3;n++){const b=rig.model.getObjectByName(`J_Bip_R_${digit}${n}`);if(b)a.push({b,rest:b.quaternion.clone()});}return a;})();for(const {b,rest}of fingers)b.quaternion.copy(rest);
 const old=root.userData.harvestHiddenGear;if(old){for(const [o,v]of old)o.visible=v;root.userData.harvestHiddenGear=null;}
 const tools=action?toolsFor(root):root.userData.harvestTools;if(tools)for(const t of Object.values(tools))t.visible=false;
 if(!action){delete root.userData.harvestVisual;return false;}const kind=action.kind;if(!['mine','chop','berries'].includes(kind))return false;
 const hidden=[];for(const o of [...(root.userData.equipmentAttachments?.left||[]),...(root.userData.equipmentAttachments?.right||[])]){hidden.push([o,o.visible]);o.visible=false;}root.userData.harvestHiddenGear=hidden;
 if(tools?.[kind])tools[kind].visible=true;
 const pose=sampleHarvest(kind,action.phase);for(const [k,v]of Object.entries(pose)){if(k==='grip')continue;const b=rig.bones[k];if(b){b.rotation.x-=v[0];b.rotation.y+=v[1];b.rotation.z+=v[2];}}
 for(const {b}of fingers)b.rotateZ(-.65*(pose.grip||0));
 root.userData.harvestVisual={kind,phase:action.phase,provisionalTools:!!tools?.[kind]&&!tools[kind].userData.authoredHarvestTool};return true;
}




