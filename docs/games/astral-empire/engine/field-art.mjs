import * as T from "../vendor/three.module.js";
import { GLTFLoader } from "../vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../vendor/meshopt_decoder.module.js";
import { clone } from "../vendor/SkeletonUtils.js";
import { CHUNK_SIZE, fieldNoise } from "./chunks.mjs";
import { FIELD_ANIMALS, localWildlife } from "./ecology.mjs";
import { walk } from "./navigation.mjs";
import { createLumiMotion, updateLumiMotion } from "./creature-motion.mjs";

const templates = new Map();
let loading;
export function loadFieldArt() {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return (loading ??= Promise.allSettled(
    ["grass", "boulder", "fibre-plant", "fenstag", "brackhide", "shearjaw", "orbi"].map(
      async (id) => {
        const { scene, animations } = await loader.loadAsync(
          new URL(id === "fenstag" ? "../assets/creatures/lumi-deer-lod1.glb" : id === "orbi" ? "../assets/creatures/orbi-runtime.glb" : "../assets/field/" + id + ".glb", import.meta.url).href,
        );
        if (id === "fenstag") scene.rotation.y = -Math.PI / 2; // authored +X -> movement +Z
        scene.updateMatrixWorld(true);
        const bounds = new T.Box3().setFromObject(scene, true);
        if (bounds.isEmpty()) throw Error("Empty field asset " + id);
        scene.traverse((mesh) => {
          if (mesh.isMesh) mesh.userData.sharedFieldAsset = true;
        });
        let skinned = false;
        scene.traverse((node) => { if (node.isSkinnedMesh) skinned = true; });
        templates.set(id, { scene, bounds, animations, skinned });
      },
    ),
  ));
}

export function fieldProp(id, height, tint) {
  const template = templates.get(id);
  if (!template) return null;
  const { scene, bounds, animations, skinned } = template;
  const root = new T.Group();
  const object = animations.length || skinned ? clone(scene) : scene.clone();
  const center = bounds.getCenter(new T.Vector3());
  const scale = height / (bounds.max.y - bounds.min.y);
  object.scale.multiplyScalar(scale);
  object.position.addScaledVector(
    new T.Vector3(-center.x, -bounds.min.y, -center.z),
    scale,
  );
  root.add(object);
  if (id === "fenstag") root.userData.lumiMotion = createLumiMotion(object);
  if (tint)
    object.traverse((mesh) => {
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      mesh.material = mesh.material.clone();
      mesh.material.color.multiply(new T.Color(tint));
      mesh.userData.ownedFieldMaterial = true;
    });
  if (animations.length) {
    const mixer = new T.AnimationMixer(object);
    const clips = new Map(
      animations.map((clip) => [clip.name, mixer.clipAction(clip)]),
    );
    root.userData.fieldAnimation = { mixer, clips, current: null };
  }
  return root;
}

export function animateFieldProp(root, name, dt) {
  if (root?.userData.lumiMotion) { updateLumiMotion(root.userData.lumiMotion, name, dt); return; }
  const animation = root?.userData.fieldAnimation;
  const action = animation?.clips.get(name);
  if (!action) return;
  if (action !== animation.current) {
    animation.current?.fadeOut(0.18);
    action.reset().fadeIn(0.18).play();
    animation.current = action;
  }
  animation.mixer.update(dt);
}

export class FieldDressing {
  constructor(scene, state, height, palette, release) {
    Object.assign(this, { scene, state, height, palette, release });
    this.animals = new Map();
    this.cell = "";
    this.anchor = new T.Object3D();
    this.wind = { value: 0 };
    const source = templates.get("grass");
    if (!source || state.realm === "orbit") return;
    source.scene.updateMatrixWorld(true);
    let mesh;
    source.scene.traverse((object) => {
      if (object.isMesh) mesh = object;
    });
    if (!mesh) return;
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geometry.translate(0, -source.bounds.min.y, 0);
    geometry.scale(2.5, 1.2, 2.5);
    const material = mesh.material.clone();
    material.side = T.DoubleSide;
    material.transparent = false;
    material.depthWrite = true;
    material.color.lerp(new T.Color(palette.grass), 0.36);
    material.onBeforeCompile = (shader) => {
      shader.uniforms.fieldWind = this.wind;
      shader.vertexShader =
        "uniform float fieldWind;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec4 origin=instanceMatrix[3]; transformed.x+=sin(fieldWind*1.8+origin.x*.41+origin.z*.2)*position.y*.16;",
        );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        "#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuse, .54);",
      );
    };
    this.grass = new T.InstancedMesh(geometry, material, 9 * 54);
    this.grass.receiveShadow = true;
    this.grass.count = 0;
    this.scene.add(this.grass);
  }
  sync(tiles, player, quality) {
    const cx = Math.floor(player.x / CHUNK_SIZE),
      cz = Math.floor(player.z / CHUNK_SIZE);
    const cell = cx + ":" + cz + ":" + quality;
    if (this.cell === cell) return;
    this.cell = cell;
    if (this.grass) {
      let count = 0;
      const perTile = { low: 14, balanced: 32, high: 54 }[quality] || 32;
      for (let a = cx - 1; a <= cx + 1; a++)
        for (let b = cz - 1; b <= cz + 1; b++) {
          for (let i = 0; i < perTile; i++) {
            const salt = this.state.seed ^ Math.imul(i + 1, 111869);
            const x = (a + fieldNoise(salt, a, b, 1)) * CHUNK_SIZE;
            const z = (b + fieldNoise(salt ^ 7087, a, b, 1)) * CHUNK_SIZE;
            if (
              Math.hypot(x, z) < 10.4 ||
              Math.abs(x - 25) < 4 ||
              (Math.abs(x) < 3.8 && z > -50 && z < 28)
            )
              continue;
            const scale = 0.76 + fieldNoise(salt ^ 1239, a, b, 1) * 1.1;
            this.anchor.position.set(x, this.height(x, z) - 0.018, z);
            this.anchor.scale.setScalar(scale);
            this.anchor.rotation.y = scale * 8;
            this.anchor.updateMatrix();
            this.grass.setMatrixAt(count++, this.anchor.matrix);
          }
        }
      this.grass.count = count;
      this.grass.instanceMatrix.needsUpdate = true;
      this.grass.computeBoundingSphere();
    }
    const nearby = [];
    for (let a = cx - 1; a <= cx + 1; a++)
      for (let b = cz - 1; b <= cz + 1; b++) {
        nearby.push(...(tiles.get(a + ":" + b)?.wildlife || []));
      }
    const local = localWildlife(this.state.realm).filter(
      (entry) =>
        Math.abs(entry.x - player.x) < 70 && Math.abs(entry.z - player.z) < 70,
    );
    const entries = [...local, ...nearby];
    const wanted = new Set(entries.map((entry) => entry.id));
    for (const [id, animal] of this.animals) {
      if (wanted.has(id)) continue;
      animal.mesh.removeFromParent();
      this.release(animal.mesh);
      this.animals.delete(id);
    }
    for (const entry of entries) {
      if (this.animals.has(entry.id)) continue;
      const profile = FIELD_ANIMALS[entry.species];
      const mesh = fieldProp(entry.species, profile.height, profile.tint);
      if (!mesh) continue;
      this.scene.add(mesh);
      this.animals.set(entry.id, {
        entry,
        profile,
        mesh,
        x: entry.x,
        z: entry.z,
        flee: 0,
      });
    }
  }
  update(player, blockers, dt, time, reduced) {
    this.wind.value = reduced ? 0 : time;
    for (const animal of this.animals.values()) {
      const { entry, profile, mesh } = animal;
      const distance = Math.hypot(player.x - animal.x, player.z - animal.z);
      mesh.visible = distance < 52;
      if (!mesh.visible) continue;
      if (distance < profile.flight && !animal.flee) {
        const heading = Math.atan2(animal.x - player.x, animal.z - player.z);
        animal.escape = { x: Math.sin(heading), z: Math.cos(heading) };
        animal.flee = 2.5;
      }
      const fleeing = animal.flee > 0;
      animal.flee = Math.max(0, animal.flee - dt);
      const phase = entry.phase + time * 0.38;
      const targetX = entry.x + Math.cos(phase) * 3.2;
      const targetZ = entry.z + Math.sin(phase) * 2.3;
      const dx = fleeing ? animal.escape.x : targetX - animal.x;
      const dz = fleeing ? animal.escape.z : targetZ - animal.z;
      const length = Math.hypot(dx, dz);
      const moving = length > 0.3;
      if (moving) {
        const step = Math.min(
          length,
          dt * profile.speed * (fleeing ? 1 : 0.42),
        );
        walk(animal, (dx / length) * step, (dz / length) * step, blockers);
        mesh.rotation.y = Math.atan2(dx, dz);
      }
      mesh.position.set(animal.x, this.height(animal.x, animal.z), animal.z);
      animateFieldProp(
        mesh,
        fleeing ? profile.run : moving ? "Walk" : "Idle",
        dt,
      );
    }
  }
}
