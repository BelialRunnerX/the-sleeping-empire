import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {applyHarvestVisual,harvestKind} from '../engine/harvest-visual.mjs';
const root=new T.Group(),model=new T.Group(),bones={};root.add(model);
for(const k of ['R_Hand','R_UpperArm','R_LowerArm','L_UpperArm','C_Spine']){bones[k]=new T.Bone();model.add(bones[k]);}
root.userData.rig={model,bones};const gear=new T.Group();root.add(gear);root.userData.equipmentAttachments={left:[],right:[gear]};
for(const [kind,wanted] of [['tree','chop'],['rock','mine'],['ore','mine'],['herb','berries'],['fish',null]])assert.equal(harvestKind({kind}),wanted);
const rest=bones.R_Hand.quaternion.clone();applyHarvestVisual(root,{kind:'mine',phase:.58});const contact=bones.R_Hand.quaternion.clone();for(let i=0;i<240;i++)applyHarvestVisual(root,{kind:'mine',phase:.58});assert(contact.angleTo(bones.R_Hand.quaternion)<1e-6,'wrist offsets must not accumulate');assert(!gear.visible);assert(root.userData.harvestTools.mine.visible);
applyHarvestVisual(root,{kind:'chop',phase:.56});assert(root.userData.harvestTools.chop.visible);assert(!root.userData.harvestTools.mine.visible);
applyHarvestVisual(root,null);assert(rest.angleTo(bones.R_Hand.quaternion)<1e-6);assert(gear.visible);assert(!root.userData.harvestTools.chop.visible);assert(!root.userData.harvestVisual);
gear.visible=false;applyHarvestVisual(root,{kind:'berries',phase:.6});applyHarvestVisual(root,null);assert(!gear.visible);
console.log('PASS harvest mapping,240-frame wrist stability,tool switching,gear visibility and interruption reset');
