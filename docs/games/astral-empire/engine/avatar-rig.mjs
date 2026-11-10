import {loadPistolModel} from './pistol-model.mjs';
import { PLAYER_HEIGHT } from './world-scale.mjs';
import * as T from "../vendor/three.module.js";
import { GLTFLoader } from "../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../vendor/meshopt_decoder.module.js";
import { clone } from "../vendor/SkeletonUtils.js";
import { mergeGeometries } from "../vendor/BufferGeometryUtils.js";
import { surface } from "./surfaces.mjs";

const templates = new Map();
let loading;
const customLoading=new Map();
export function loadCustomBody(body){
 if(!['male','female'].includes(body))return Promise.reject(Error('Unknown body choice'));
 if(!customLoading.has(body))customLoading.set(body,(async()=>{
  const {scene}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('../assets/characters/custom-'+body+'.glb',import.meta.url).href);
  consolidateSkin(scene);scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new T.Box3().setFromObject(scene,true);
  if(box.isEmpty()||!joints.every(j=>scene.getObjectByName('J_Bip_'+j)))throw Error('Custom '+body+' rig incomplete');
  templates.set('custom-'+body,{scene,floor:box.min.y,height:box.max.y-box.min.y,authored:true,body});
 })().catch(e=>{customLoading.delete(body);throw e;}));
 return customLoading.get(body);
}
export const loadCustomFemale=()=>loadCustomBody('female');
export const loadCustomMale=()=>loadCustomBody('male');

const joints = [
  "L_UpperArm",
  "R_UpperArm",
  "L_LowerArm",
  "R_LowerArm",
  "L_UpperLeg",
  "R_UpperLeg",
  "L_LowerLeg",
  "R_LowerLeg",
  "L_Hand",
  "R_Hand",
  "C_Spine",
];
function consolidateSkin(scene) {
  const batches = new Map();
  scene.traverse((mesh) => {
    if (!mesh.isSkinnedMesh || Array.isArray(mesh.material)) return;
    const attributes = Object.entries(mesh.geometry.attributes)
      .map(
        ([key, a]) =>
          key +
          ":" +
          (a.isInterleavedBufferAttribute ? a.data.array : a.array).constructor
            .name +
          ":" +
          a.itemSize +
          ":" +
          a.normalized,
      )
      .sort();
    const key = [
      mesh.parent.uuid,
      mesh.material.uuid,
      mesh.skeleton.uuid,
      mesh.bindMatrix.elements,
      mesh.position.toArray(),
      mesh.quaternion.toArray(),
      mesh.scale.toArray(),
      attributes,
      !!mesh.geometry.index,
    ].join("|");
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const merged = mergeGeometries(meshes.map((mesh) => mesh.geometry));
    if (!merged) continue;
    meshes[0].geometry = merged;
    for (const mesh of meshes.slice(1)) mesh.removeFromParent();
  }
  // Unlit VRoid export omitted normals. Reconstruct them once for the new
  // lit materials, before any character clones share the geometry.
  const prepared = new Set();
  scene.traverse((mesh) => {
    if (mesh.isMesh && !prepared.has(mesh.geometry)) {
      if (!mesh.geometry.getAttribute("normal"))
        mesh.geometry.computeVertexNormals();
      prepared.add(mesh.geometry);
    }
  });
}
export function loadAvatarRigs() {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return (loading ??= Promise.allSettled(
    [loadPistolModel(), ...["kael", "mira"].map(async (id) => {
      const { scene } = await loader.loadAsync(
        new URL("../assets/characters/" + id + ".glb", import.meta.url).href,
      );
      consolidateSkin(scene);
      scene.updateMatrixWorld(true);
      const box = new T.Box3().setFromObject(scene, true);
      if (
        !joints.every((j) => scene.getObjectByName("J_Bip_" + j)) ||
        box.isEmpty()
      )
        throw Error("Avatar rig is incomplete: " + id);
      templates.set(id, {
        scene,
        floor: box.min.y,
        height: box.max.y - box.min.y,
      });
    })],
  ));
}
function reskin(source, hero) {
  const isHair = source.name.includes("HAIR");
  const isCoat = source.name.includes("Tops");
  const isCloth = source.name.includes("CLOTH");
  const tint = new T.Color(
    isHair ? hero.color : hero.armorForm === "heavy" ? "#57667b" : hero.coat,
  );
  const material = new T.MeshStandardMaterial({
    color: source.color,
    map: source.map,
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    depthWrite: source.depthWrite,
    normalMap: isCloth ? surface("cloth").normalMap || null : null,
    normalScale: new T.Vector2(0.18, 0.18),
    roughness: isHair ? 0.51 : 0.76,
    metalness: 0,
  });
  material.name = source.name;
  if ((isHair || isCoat) && source.map) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.avatarTint = { value: tint };
      shader.fragmentShader =
        "uniform vec3 avatarTint;\n" +
        shader.fragmentShader
          .replace(
            "#include <map_fragment>",
            `
        #include <map_fragment>
        float tone = pow(dot(diffuseColor.rgb, vec3(.2126,.7152,.0722)),.54);
        vec3 recolor = avatarTint * (.39 + tone * 1.55);
        vec3 bright = mix(recolor,vec3(.86,.75,.56),smoothstep(.65,1.,tone)*${isHair ? "0.12" : "0.49"});
        diffuseColor.rgb = mix(diffuseColor.rgb, bright, ${isHair ? "0.92" : "0.82"});
      `,
          )
          .replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*.16;",
          );
    };
    material.customProgramCacheKey = () =>
      isHair ? "avatar-hair-v1" : "avatar-coat-v1";
  }
  return material;
}

export function applyAvatarRig(root, hero, attachments) {
  const template = templates.get(hero.rigId||hero.id);
  if (!template) return;
  const scene = clone(template.scene),
    materialCache = new Map(),
    skins = new Map();
  const model = new T.Group();
  const scale = PLAYER_HEIGHT / template.height;
  model.rotation.y = Math.PI; // VRM 0.x faces negative Z.
  model.scale.setScalar(scale);
  model.position.y = -template.floor * scale;
  model.add(scene);
  const bones = Object.fromEntries(
    joints.map((key) => [key, scene.getObjectByName("J_Bip_" + key)]),
  );
  for (const [key, bone] of Object.entries(bones))
    bone.userData.rest = bone.rotation.clone();
  const gear = new Set([...attachments.left, ...attachments.right]);
  root.traverse((o) => {
    if (o.isMesh || o.isLine) {
      for (let parent = o; parent; parent = parent.parent)
        if (gear.has(parent)) return;
      o.visible = false;
    }
  });
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    mesh.userData.sharedRigGeometry = true;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    if (mesh.isSkinnedMesh) {
      mesh.frustumCulled = false;
      const key = mesh.skeleton.boneInverses;
      if (skins.has(key)) mesh.skeleton = skins.get(key);
      else skins.set(key, mesh.skeleton);
    }
    const convert = (source) => {
      if (!materialCache.has(source))
        materialCache.set(source, template.authored ? source.clone() : reskin(source, hero));
      return materialCache.get(source);
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(convert)
      : convert(mesh.material);
  });
  root.add(model);
  root.userData.rig = { bones, model };
  root.userData.avatarBody = template.body || (hero.rigId==="kael"?"male":"legacy");
  poseAvatarRig(root, 0, false, false, false, 0);
  root.updateMatrixWorld(true);
  for (const [side, list] of [
    ["L", attachments.left],
    ["R", attachments.right],
  ]) {
    const hand = bones[side + "_Hand"],
      socket = new T.Group();
    const rotation = new T.Quaternion(),
      dimensions = new T.Vector3();
    hand.getWorldQuaternion(rotation);
    hand.getWorldScale(dimensions);
    socket.quaternion.copy(rotation.invert());
    socket.scale.set(1 / dimensions.x, 1 / dimensions.y, 1 / dimensions.z);
    hand.add(socket);
    for (const item of list) {
      socket.add(item);
      item.position.set(0, -0.025, 0.03);
    }
  }
}
export function poseAvatarRig(
  root,
  stride,
  moving,
  attacking,
  guarding,
  time,
  weapon,
) {
  const rig = root.userData.rig;
  if (!rig) return;
  const { bones } = rig;
  const rotate = (key, x = 0, y = 0, z = 0) => {
    const bone = bones[key],
      rest = bone.userData.rest;
    bone.rotation.set(rest.x + x, rest.y + y, rest.z + z, rest.order);
  };
  rotate("L_UpperLeg", stride);
  rotate("R_UpperLeg", -stride);
  rotate("L_LowerLeg", moving ? Math.max(0, -stride) * 0.88 : 0);
  rotate("R_LowerLeg", moving ? Math.max(0, stride) * 0.88 : 0);
  rotate(
    "L_UpperArm",
    guarding ? -0.92 : attacking && weapon === "bow" ? -0.83 : -stride * 0.45,
    0,
    1.24,
  );
  rotate(
    "R_UpperArm",
    weapon === "pistol" ? +.95+(attacking?Math.abs(Math.sin(time*32))*.12:0) : attacking ? -0.79 + Math.sin(time * 26) * 0.22 : stride * 0.45,
    0,
    -1.24,
  );
  rotate("L_LowerArm", guarding ? -0.55 : -0.12);
  rotate("R_LowerArm", weapon === "pistol" ? +.3 : attacking ? -0.58 : -0.1);
  rotate("C_Spine", moving ? 0.035 : 0, moving ? stride * 0.095 : 0);
  if(weapon === 'pistol'){
    root.updateMatrixWorld(true);
    const forward=root.getWorldQuaternion(new T.Quaternion());
    for(const item of root.userData.equipmentAttachments?.right||[]){
      if(item.parent){
        item.quaternion.copy(item.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(forward));
        const finger=root.getObjectByName('J_Bip_R_Middle1');
        if(finger){const palm=bones.R_Hand.getWorldPosition(new T.Vector3()).lerp(finger.getWorldPosition(new T.Vector3()),.7);item.position.copy(item.parent.worldToLocal(palm));}
      }
    }
  }

}
export function measureAvatarBody(root){
 const gear=new Set([...(root.userData.equipmentAttachments?.left||[]),...(root.userData.equipmentAttachments?.right||[])]),box=new T.Box3();root.updateMatrixWorld(true);root.traverse(o=>o.skeleton?.update());
 root.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible||gear.has(p))return;box.union(new T.Box3().setFromObject(o,true));});
 return {height:box.max.y-box.min.y,floor:box.min.y,top:box.max.y};
}
