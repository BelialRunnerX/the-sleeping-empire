// Isolated animation-only prototype. Run after poseAvatarRig, never instead of gameplay validation.
export const HARVEST_CLIPS = Object.freeze({
  berries: {duration:1.25, contact:.60, tool:null, frames:[
    [0,{}], [.30,{C_Spine:[.18,0,0],R_UpperArm:[-.72,0,.28],R_LowerArm:[-.55,0,0]}],
    [.60,{C_Spine:[.22,0,0],R_UpperArm:[-.96,0,.32],R_LowerArm:[-.28,0,0],R_Hand:[.1,0,.12],grip:1}],
    [.85,{C_Spine:[.10,0,0],R_UpperArm:[-.38,0,.18],R_LowerArm:[-1.1,0,0],grip:1}], [1,{}]]},
  mine: {duration:1.50,contact:.58,tool:'pickaxe',frames:[
    [0,{}],[.32,{C_Spine:[-.12,-.12,0],R_UpperArm:[-2.2,0,.52],R_LowerArm:[-.85,0,0],L_UpperArm:[-.4,0,-.2],grip:1}],
    [.58,{C_Spine:[.30,.10,0],R_UpperArm:[-.85,0,.24],R_LowerArm:[-.20,0,0],R_Hand:[.20,0,0],grip:1}],
    [.70,{C_Spine:[.34,.12,0],R_UpperArm:[-.72,0,.20],R_LowerArm:[-.22,0,0],grip:1}],[1,{}]]},
  chop: {duration:1.35,contact:.56,tool:'axe',frames:[
    [0,{}],[.30,{C_Spine:[.02,-.38,0],R_UpperArm:[-.65,-.50,.48],R_LowerArm:[-1.10,0,0],grip:1}],
    [.56,{C_Spine:[.12,.28,0],R_UpperArm:[-1.05,.42,.30],R_LowerArm:[-.28,0,0],grip:1}],
    [.72,{C_Spine:[.13,.36,0],R_UpperArm:[-.82,.62,.22],R_LowerArm:[-.35,0,0],grip:1}],[1,{}]]}
});
const clamp=x=>Math.max(0,Math.min(1,x));
export function sampleHarvest(kind, phase){
 const clip=HARVEST_CLIPS[kind]; if(!clip)throw Error('Unknown harvest action: '+kind);
 if(!Number.isFinite(phase))throw Error('Nonfinite phase');
 const p=clamp(phase),f=clip.frames;let i=0;while(i<f.length-2&&p>f[i+1][0])i++;
 const [a,A]=f[i],[b,B]=f[i+1];const t=clamp((p-a)/(b-a)),w=t*t*(3-2*t),out={};
 for(const key of new Set([...Object.keys(A),...Object.keys(B)])){
  if(key==='grip'){out.grip=(A.grip||0)*(1-w)+(B.grip||0)*w;continue;}
  out[key]=[0,1,2].map(j=>(A[key]?.[j]||0)*(1-w)+(B[key]?.[j]||0)*w);
 }return out;
}
// Establish after the standard base pose. Optional finger channels are recovered from actual scene.
export function createHarvestAnimator(root,{onContact=()=>{}}={}){
 const rig=root.userData.rig;if(!rig)throw Error('A skinned avatar rig is required');
 const fingers=[];
 for(const digit of ['Index','Middle','Ring','Little'])for(let n=1;n<=3;n++){
  const b=rig.model.getObjectByName(`J_Bip_R_${digit}${n}`);if(b)fingers.push({b,rest:b.quaternion.clone()});
 }
 let action=null;let tool=null;let toolWasVisible=false;
 function release(){if(tool)tool.visible=toolWasVisible;tool=null;for(const {b,rest} of fingers)b.quaternion.copy(rest);}
 return {
  start(kind,{targetId=null,toolObject=null}={}){
   if(!HARVEST_CLIPS[kind])throw Error('Unknown harvest action');
   release();action={kind,targetId,elapsed:0,contact:false};tool=toolObject;
   if(tool){toolWasVisible=tool.visible;tool.visible=true;}
  },
  cancel(){release();action=null;},
  update(dt){
   if(!Number.isFinite(dt)||dt<0)throw Error('dt must be finite and nonnegative');
   if(!action)return false;const clip=HARVEST_CLIPS[action.kind];action.elapsed+=dt;
   const phase=clamp(action.elapsed/clip.duration),pose=sampleHarvest(action.kind,phase);
   for(const [key,v] of Object.entries(pose)){
    if(key==='grip')continue;const b=rig.bones[key];if(!b)continue;
    b.rotation.x+=v[0];b.rotation.y+=v[1];b.rotation.z+=v[2];
   }
   for(const {b,rest} of fingers){b.quaternion.copy(rest);b.rotateZ(-.65*(pose.grip||0));}
   if(!action.contact&&phase>=clip.contact){action.contact=true;onContact({kind:action.kind,targetId:action.targetId});}
   if(phase>=1){release();action=null;}return true;
  },
  get active(){return action!==null;},
  dispose(){this.cancel();}
 };
}
