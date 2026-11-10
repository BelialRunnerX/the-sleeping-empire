import { TerrainWaterView } from './terrain-water-view.mjs';
import { HorizonView } from './terrain-horizon.mjs';
import {sanctuaryTreeClearance} from "./voxel-trees/tree-placement.mjs";
import {createCoarseHeightSampler,buildSurfaceSeams} from "./terrain-seams.mjs";
import {parseTerrainBlockKey} from "./terrain-volume.mjs";
import { treeEcology } from "./voxel-trees/tree-ecology.mjs";
import { treeBoxCollision } from "./voxel-trees/tree-gameplay.mjs";
import { VoxelTreeRenderer } from "./voxel-trees/tree-renderer.mjs";
import { terrainProfile } from "./terrain-profiles.mjs";
import { isVoxelFrontier } from "./terrain-field.mjs";
import * as T from "../vendor/three.module.js";
import { hash, roll, skillStats } from "./simulation.mjs";
import { HEROES, REALMS } from "./content.mjs";
import { ArtDirector, GRAPHICS } from "./art.mjs";
import { WorkstationView } from "./workstations.mjs";
import { CameraRig } from "./camera.mjs";
import { enemySites } from "./frontier.mjs";
import { CHUNK_SIZE, fieldNoise } from "./chunks.mjs";
import { GEODE_MATERIALS, geodeStage } from "./geodes.mjs";
import { surface } from "./surfaces.mjs";
import { equippedForm } from "./arsenal.mjs";
import { FIBRE_PLANTS } from "./ecology.mjs";
import { animateFieldProp, FieldDressing, fieldProp } from "./field-art.mjs";
import { createCoreDrillView } from "./geology-ui.mjs";
import { subtractAABBUnion } from "./terrain-clip.mjs";
import { TerrainRenderer } from "./terrain-view.mjs";
import { createNurseryView } from "./nursery-view.mjs";
import { createMicrovoxelView } from "./microvoxel-view.mjs";
const color = (hex) => new T.Color(hex);
const materials = new Map(),
  geometries = new Map();
function mat(c, emissive = 0) {
  const key = c + ":" + emissive;
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshToonMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: emissive,
      }),
    );
  return materials.get(key);
}
function geo(type, a = 1, b = 1, c = 1) {
  const key = [type, a, b, c].join(":");
  if (!geometries.has(key))
    geometries.set(
      key,
      type === "box"
        ? new T.BoxGeometry(a, b, c)
        : type === "sphere"
          ? new T.SphereGeometry(a, 12, 8)
          : type === "cone"
            ? new T.ConeGeometry(a, b, c || 6)
            : new T.CylinderGeometry(a, a, b, c || 8),
    );
  return geometries.get(key);
}
function mesh(group, type, c, x, y, z, a = 1, b = 1, d = 1) {
  const m = new T.Mesh(geo(type, a, b, d), mat(c));
  m.castShadow = m.receiveShadow = true;
  m.position.set(x, y, z);
  group.add(m);
  return m;
}
export class WorldView {
  constructor(
    canvas,
    state,
    sim,
    visuals = { quality: "balanced", reducedMotion: false },
    cameraPreferences,
  ) {
    this.canvas = canvas;
    this.state = state;
    this.sim = sim;
    this.scene = new T.Scene();
    const realm = REALMS.find((r) => r.id === state.realm) || REALMS[0];
    this.realm = realm;
    this.height = sim.layout.height;
    this.farHeightCache=new Map();
    this.art = new ArtDirector(
      this.scene,
      state.realm,
      state.seed,
      this.height,
      roll,
      sim.layout.structures,
    );
    this.scene.background = color(this.art.palette.mist);
    this.scene.fog = new T.Fog(this.art.palette.mist, 85, 165);
    this.visuals = visuals;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, GRAPHICS[visuals.quality].pixelRatio),
    );
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight, false);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.rig = new CameraRig(cameraPreferences);
    this.camera = new T.PerspectiveCamera(
      49,
      innerWidth / innerHeight,
      0.065,
      280,
    );
    this.ray = new T.Raycaster();
    this.boomRay = new T.Raycaster();
    this.updateFrustum();
    this.nodes = [];
    this.foes = new Map();
    this.projectileMeshes = new Map();
    this.effects = [];
    this.moving = false;
    this.scene.add(new T.HemisphereLight(0xcadbf4, 0x576265, 1.78));
    const fill = new T.DirectionalLight(0xa3d5fa, 0.58);
    fill.position.set(14, 13, 20);
    this.scene.add(fill);
    const sun = new T.DirectionalLight(0xffdfb0, 2.65);
    sun.position.set(-30, 48, -22);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -24;
    sun.shadow.camera.right = sun.shadow.camera.top = 24;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 110;
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.16;
    this.sun = sun;
    this.scene.add(sun, sun.target);
    this.chunkMeshes = new Map();
    this.farTerrain=new Map();
    this.field = new FieldDressing(this.scene, state, this.height, this.art.palette,
      (object) => this.releaseObject(object));
    const ground = surface("ground");
    const groundTexture = ground.map || this.art.groundTexture();
    this.groundMaterial = new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      map: groundTexture,
      normalMap: ground.normalMap || null,
      normalScale: new T.Vector2(0.66, 0.66),
      bumpMap: ground.normalMap ? null : groundTexture,
      bumpScale: 0.12,
    });
    if (ground.map)
      this.groundMaterial.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72),.27);",
        );
      };
    if(this.sim.terrainVolume.field.generation.version!==2)this.art.water();
    else {this.waterView=new TerrainWaterView(T,this.scene,state,this.sim.terrainVolume,canvas);this.horizon=new HorizonView(T,this.scene,this.sim.terrainVolume.field,this.groundMaterial,terrainProfile(state.realm).surface);this.camera.far=2600;this.camera.updateProjectionMatrix();}
    this.art.sky();
    this.createSanctuary();
    this.art.sanctuary();
    this.createScenery();
    canvas.dataset.worldSurfaces=String(this.art.surfaceBindings);
    this.workstations = new WorkstationView(this.scene, state, this.art);
    this.coreDrill = state.realm === "bastion" ? createCoreDrillView(this.scene, this.art, this.height) : null;
    this.nursery = state.realm === "bastion"
      ? createNurseryView(this.scene, this.art, this.height) : null;
    this.microvoxels = state.realm === "bastion"
      ? createMicrovoxelView(this.scene, state, this.height, canvas) : null;
    if (!this.microvoxels) {
      canvas.dataset.microFineReady = "false";
      canvas.dataset.microCoarseVisible = "false";
      canvas.dataset.microQuads = "0";
    }
    this.voxelTrees = new VoxelTreeRenderer(T,{seed:this.state.seed,realm:this.state.realm,maxNear:12,maxDistance:40,canPublish:(entry,result)=>{
      const t=result.tree;
      if(!entry.publishCollision){
        const bounds={min:new T.Vector3(...t.bounds.min.map((v,i)=>(v-t.anchorMicro[i])/16)),max:new T.Vector3(...t.bounds.max.map((v,i)=>(v-t.anchorMicro[i])/16))};
        entry.publishCollision={...entry,tree:t,mesh:{geometry:{boundingBox:bounds}}};
      }
      const proxy=entry.publishCollision;
      const p=this.sim.player,y=(p.terrainY??this.height(p.x,p.z))+(p.y||0);
      return !treeBoxCollision(new Map([[entry.id,proxy]]),this.state.trees,[p.x-.3,y+.000001,p.z-.3],[p.x+.3,y+3,p.z+.3]);
    },onReady:()=>{this.canvas.dataset.voxelTrees=String([...this.voxelTrees.entries.values()].filter(e=>e.mesh).length);}});
    this.sim.treeOccupied=(min,max)=>treeBoxCollision(this.voxelTrees.entries,this.state.trees,min,max);
    this.sim.isVoxelTree=id=>!!this.voxelTrees.entries.get(String(id))?.mesh;
    this.treeClearance=sanctuaryTreeClearance(this.sim.terrainVolume.field);
    this.voxelTrees.player={x:this.sim.player.x,z:this.sim.player.z};
    this.coreNodes = this.createNodes();
    this.createFeatures();
    this.syncWorld();
    this.voxelTerrain = new TerrainRenderer(this.scene, state, sim.terrainVolume, canvas, (key,refreshOnly) => this.maskTerrain(key,refreshOnly), this.groundMaterial);
    this.sim.terrainReady=(x,y,z)=>{
      // Coarse surface remains a safe visual fallback; underground needs a published volume band.
      if(y>=this.sim.terrainVolume.field.surfaceHeight(x,z)-.5)return true;
      for(const tx of new Set([Math.floor((x-.3)/8),Math.floor((x+.3)/8)]))for(const tz of new Set([Math.floor((z-.3)/8),Math.floor((z+.3)/8)])){
        const r=this.voxelTerrain.records.get(tx+':'+tz);
        if(!r?.mesh||!r.residentBands?.some(b=>y-1/16>=b.min[1]&&y+3<=b.max[1]))return false;
      }return true;
    };
    this.character = this.avatar(HEROES.find((h) => h.id === state.hero));
    this.canvas.dataset.avatarModel = this.character.userData.rig
      ? "rigged"
      : "procedural";
    this.scene.add(this.character);
    this.createEnemies();
    this.applyVisualSettings(visuals);
    this.scene.updateMatrixWorld(true);
    this.updateCamera(0, {});
    this.resize = () => {
      this.updateFrustum();
      this.renderer.setSize(this.canvas.clientWidth || innerWidth, this.canvas.clientHeight || innerHeight, false);
    };
    addEventListener("resize", this.resize);
    this.viewportObserver = new ResizeObserver(this.resize);
    this.viewportObserver.observe(this.canvas);
    globalThis.visualViewport?.addEventListener("resize", this.resize);
  }
  get yaw() {
    return this.rig.yaw;
  }
  meshClearance(focus, offset) {
    const direction = new T.Vector3(offset.x, offset.y, offset.z);
    const length = direction.length();
    this.boomRay.set(
      new T.Vector3(focus.x, focus.y, focus.z),
      direction.normalize(),
    );
    this.boomRay.far = length + 0.24;
    const occluders = this.art.cameraOccluders.filter(
      (o) =>
        Math.hypot(o.position.x - focus.x, o.position.z - focus.z) < length + 5,
    );
    for (const n of this.nodes)
      if (
        n.mesh.visible &&
        (n.kind === "tree" || n.kind === "rock" || n.kind === "wreck") &&
        Math.hypot(n.x - focus.x, n.z - focus.z) < length + 4
      )
        occluders.push(n.mesh);
    occluders.push(...(this.voxelTerrain?.meshes || []));
    const hit = this.boomRay.intersectObjects(occluders, true)[0];
    return hit
      ? Math.max(0.075, Math.min(1, (hit.distance - 0.36) / length))
      : 1;
  }
  updateCamera(dt, input) {
    const { focus, eye } = this.rig.update(
      dt,
      this.sim.player,
      input,
      (x,z) => this.sim.player.terrainY ?? this.height(x,z),
      this.sim.blockers,
      this.visuals.reducedMotion,
      (pivot, offset) => this.meshClearance(pivot, offset),
    );
    this.camera.position.set(eye.x, eye.y, eye.z);
    this.camera.lookAt(focus.x, focus.y, focus.z);
    this.camera.updateMatrixWorld();
  }
  updateFrustum() {
    this.camera.aspect = (this.canvas.clientWidth || innerWidth) / (this.canvas.clientHeight || innerHeight);
    this.camera.updateProjectionMatrix();
  }
  fallbackHeight(x,z) {
    if(!isVoxelFrontier(x,z))return this.height(x,z);
    const span=8,gx=Math.floor(x/span),gz=Math.floor(z/span),tx=x/span-gx,tz=z/span-gz;
    const at=(a,b)=>{const key=a+':'+b;if(!this.farHeightCache.has(key)){if(this.farHeightCache.size>=4096)this.farHeightCache.clear();this.farHeightCache.set(key,this.sim.terrainVolume.field.surfaceHeight(a*span,b*span));}return this.farHeightCache.get(key);};
    const a=at(gx,gz)*(1-tx)+at(gx+1,gz)*tx,b=at(gx,gz+1)*(1-tx)+at(gx+1,gz+1)*tx;return a*(1-tz)+b*tz;
  }
  createTerrain(tile) {
    const segments=tile.distant?10:20;
    const plane = new T.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
    plane.rotateX(-Math.PI / 2);
    const originX = (tile.cx + 0.5) * CHUNK_SIZE,
      originZ = (tile.cz + 0.5) * CHUNK_SIZE;
    const positions = plane.attributes.position,
      normals = plane.attributes.normal,
      colors = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + originX,
        z = positions.getZ(i) + originZ;
      const height = this.fallbackHeight(x, z);
      plane.attributes.uv.setXY(i, x / 320, -z / 320);
      positions.setY(i, height - 0.08);
      const c = color(this.realm.color);
      const slope = new T.Vector3(
        this.height(x - 0.5, z) - this.height(x + 0.5, z),
        1,
        this.height(x, z - 0.5) - this.height(x, z + 0.5),
      ).normalize();
      normals.setXYZ(i, slope.x, slope.y, slope.z);
      const path =
        Math.hypot(x, z) < 118 && Math.abs(x + Math.sin(z * 0.03) * 3) < 3.7;
      const plaza = Math.hypot(x, z) < 10;
      if (plaza) c.set(0xa2a5a0);
      else if (path) c.set(0xb9b7a0);
      else {
        const patch =
          0.5 + Math.sin(x * 0.13 + z * 0.062) * Math.cos(z * 0.111) * 0.5;
        c.lerp(color(this.art.palette.grass), patch * 0.42);
        c.lerp(color(0xa9a7a2), Math.max(0, height - 2.5) * 0.105);
        if (Math.hypot(x, z) > 110) {
          const blend = Math.min(1, (Math.hypot(x, z) - 110) / 60);
          const geology = fieldNoise(this.state.seed, x, z, 155);
          c.lerp(
            color(geology < 0.33 ? 0xa49288 : this.art.palette.leaf),
            blend * 0.32,
          );
          c.lerp(color(0x898d9a), Math.max(0, 1 - slope.y) * 0.9 * blend);
        }
        if (this.state.realm === "orbit") {
          const grid = Math.abs(x % 15) < 2 || Math.abs(z % 15) < 2;
          c.lerp(color(grid ? 0x8da8bd : 0x3c475f), 0.35);
        }
        c.multiplyScalar(
          0.88 + roll(this.state.seed, Math.round(x), Math.round(z)) * 0.18,
        );
      }
      const frontierBlend=Math.max(0,Math.min(1,(Math.max(Math.abs(x),Math.abs(z))-112)/48));
      if(frontierBlend)c.lerp(color(terrainProfile(this.state.realm).surface),frontierBlend*frontierBlend*(3-2*frontierBlend));
      colors.push(c.r, c.g, c.b);
    }
    plane.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    plane.userData.fullIndex = Array.from(plane.index.array);
    const terrain = new T.Mesh(plane, this.groundMaterial);
    terrain.receiveShadow = true;
    // Retain immutable original coarse triangles, never clip already clipped data.
    terrain.userData.coarseSource = {
      index:Array.from(plane.index.array),
      position:Array.from(plane.attributes.position.array),
      normal:Array.from(plane.attributes.normal.array),
      color:Array.from(plane.attributes.color.array),
      uv:Array.from(plane.attributes.uv.array)
    };
    terrain.position.set(originX, 0, originZ);
    this.scene.add(terrain);
    return terrain;
  }
  maskTerrain(changedKey=null,refreshOnly=false) {
    if(!this.voxelTerrain)return;
    const changed=changedKey?.split(':').map(n=>Math.floor(Number(n)*8/CHUNK_SIZE)).join(':');
    const touched=[];if(changed){const [cx,cz]=changed.split(':').map(Number);for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){const r=this.chunkMeshes.get((cx+x)+':'+(cz+z));if(r)touched.push(r);}}
    const records=refreshOnly?[]:changed?touched:this.chunkMeshes.values();
    for(const record of records){
      const mesh=record.terrain,source=mesh.userData.coarseSource;
      if(!source)throw new Error('Missing immutable coarse geometry');
      const ox=mesh.position.x,oz=mesh.position.z,half=CHUNK_SIZE/2;
      const boxes=[...this.voxelTerrain.records.values()].filter(r=>r.mesh).map(r=>{
        const [x,z]=r.key.split(':').map(Number);
        return {min:[x*8,-1e6,z*8],max:[x*8+8,1e6,z*8+8]};
      }).filter(b=>b.max[0]>ox-half&&b.min[0]<ox+half&&b.max[2]>oz-half&&b.min[2]<oz+half);
      const signature=boxes.map(b=>b.min[0]+':'+b.min[2]).sort().join('|');
      if(mesh.userData.coarseCoverage===signature)continue;
      const triangles=[];
      for(let i=0;i<source.index.length;i+=3){const triangle=[];for(let k=0;k<3;k++){
        const v=source.index[i+k],p=v*3,u=v*2;
        triangle.push([source.position[p]+ox,source.position[p+1],source.position[p+2]+oz,
          ...source.normal.slice(p,p+3),...source.color.slice(p,p+3),...source.uv.slice(u,u+2)]);
      }triangles.push(triangle);}
      const clipped=subtractAABBUnion(triangles,boxes),positions=[],normals=[],colors=[],uv=[];
      for(const triangle of clipped)for(const v of triangle){positions.push(v[0]-ox,v[1],v[2]-oz);normals.push(...v.slice(3,6));colors.push(...v.slice(6,9));uv.push(...v.slice(9,11));}
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
      geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      geometry.computeBoundingSphere();const old=mesh.geometry;mesh.geometry=geometry;old.dispose();mesh.userData.coarseCoverage=signature;
    }
    this.refreshTerrainSeams();
    this.terrainTiles=[...Array.from(this.chunkMeshes.values(),r=>r.terrain),...this.voxelTerrain.meshes,...(this.terrainSeams?[this.terrainSeams]:[])];
  }
  refreshTerrainSeams() {
    const sampler=(x,z)=>{
      const cx=Math.floor(x/CHUNK_SIZE),cz=Math.floor(z/CHUNK_SIZE);
      for(const dx of [0,-1])for(const dz of [0,-1]){
        const mesh=this.chunkMeshes.get((cx+dx)+':'+(cz+dz))?.terrain;if(!mesh)continue;
        const sample=mesh.userData.coarseSampler||(mesh.userData.coarseSampler=createCoarseHeightSampler(mesh.userData.coarseSource,mesh.position.x,mesh.position.z));
        const y=sample(x,z);if(y!==null)return y;
      }return null;
    };
    const edited=new Map();for(const key of Object.keys(this.sim.terrainVolume.data.blocks)){const p=parseTerrainBlockKey(key);if(p){const k=p[0]+':'+p[2];if(!edited.has(k))edited.set(k,[]);edited.get(k).push(p[1]);}}
    const allow=(x,y,z,axis,side,minY,maxY)=>{
      if(Math.abs(y-this.sim.terrainVolume.field.baseHeight(x,z))>5)return false;
      for(const bx of [Math.floor(x-1/16),Math.floor(x+1/16)])for(const bz of [Math.floor(z-1/16),Math.floor(z+1/16)])for(const by of edited.get(bx+':'+bz)||[])if(by+1>minY-1/16&&by<maxY+1/16)return false;
      return true;
    };
    const data=buildSurfaceSeams(this.voxelTerrain.records,sampler,allow),mesh=this.voxelTerrain.makeMesh(data);
    if(!this.seamMaterial){this.seamMaterial=this.voxelTerrain.material.clone();this.seamMaterial.onBeforeCompile=this.voxelTerrain.material.onBeforeCompile;this.seamMaterial.side=T.DoubleSide;}
    mesh.material=this.seamMaterial;this.scene.add(mesh);const old=this.terrainSeams;this.terrainSeams=mesh;if(old){this.scene.remove(old);old.geometry.dispose();}
    this.canvas.dataset.terrainSeamSkipped=String(data.skipped);this.canvas.dataset.terrainSeamSegments=String(data.segments);this.canvas.dataset.terrainSeamGap=data.maxGap.toFixed(4);
  }
  createSanctuary() {
    const plaza = new T.Group();
    this.scene.add(plaza);
    mesh(plaza, "cylinder", 0xb3b8b1, 0, -0.16, 0, 10, 0.3, 40);
    mesh(plaza, "cylinder", 0xd6d2bb, 0, 0.02, 0, 5, 0.12, 40);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      mesh(
        plaza,
        "box",
        0x817f80,
        Math.sin(angle) * 9.5,
        0.2,
        Math.cos(angle) * 9.5,
        0.8,
        0.5,
        0.8,
      );
    }
    const gate = new T.Group();
    gate.position.set(0, 0, -6);
    this.scene.add(gate);
    for (const x of [-2.4, 2.4]) {
      mesh(gate, "box", 0xe1ddd0, x, 2.8, 0, 0.65, 5.6, 0.8);
      mesh(gate, "box", 0xc2b9aa, x, 0.25, 0, 1.1, 0.5, 1.2);
      mesh(gate, "cone", 0x545570, x, 6.4, 0, 0.8, 2, 4);
    }
    mesh(gate, "box", 0xe5dfca, 0, 5.2, 0, 5.3, 0.8, 0.9);
    const ring = new T.Mesh(
      new T.TorusGeometry(1.8, 0.055, 8, 64),
      new T.MeshBasicMaterial({ color: 0xb6a1f1 }),
    );
    ring.position.set(0, 2.8, 0.1);
    gate.add(ring);
    this.gateRing = ring;
    const crystal = mesh(gate, "sphere", 0xae99e8, 0, 2.8, 0, 0.58);
    crystal.scale.set(0.7, 1.7, 0.7);
    crystal.material = mat(0xc2b4ff, 0.6);
    this.gateCrystal = crystal;
    this.building(-13, -4, 0x737e87, 0x525b76);
    this.building(13, -5, 0x9f9385, 0x795974);
    const forge = new T.Group();
    forge.position.set(-10, 0, 5);
    this.scene.add(forge);
    mesh(forge, "box", 0x595a65, 0, 0.6, 0, 2, 1.2, 1.5);
    mesh(forge, "box", 0xe6b071, 0, 1.25, 0, 1.4, 0.1, 1);
    mesh(forge, "cone", 0x7899a4, 0, 1.5, 0, 0.7, 0.8, 4);
    this.forge = forge;
    for (const x of [-7, 7]) {
      mesh(plaza, "cylinder", 0x73737a, x, 1.2, 5, 0.12, 2.4, 8);
      const flame = mesh(plaza, "sphere", 0xf7d9a2, x, 2.6, 5, 0.3);
      flame.material = mat(0xffdd9b, 0.9);
    }
    const npc = this.avatar({
      color: "#d1c2ec",
      coat: "#536c7b",
      weapon: "staff",
    });
    npc.position.set(6, 0, -1);
    npc.rotation.y = 2;
    this.scene.add(npc);
    this.npc = npc;
  }
  building(x, z, wall, roof) {
    this.art.building(x, z, wall, roof);
  }
  avatar(hero) {
    if (!hero.id) return this.art.avatar(hero);
    const { items, equipped } = this.state;
    return this.art.avatar({
      ...hero,
      weapon: skillStats(this.state, "strike").weapon,
      form: equippedForm(this.state),
      armorForm: items.find((i) => i.id === equipped.armor)?.form,
      shield: items.some((i) => i.id === equipped.offhand),
    });
  }
  createScenery() {
    this.art.landscape();
  }
  applyVisualSettings(settings) {
    this.visuals = { ...settings };
    const preset = GRAPHICS[settings.quality] || GRAPHICS.balanced;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, preset.pixelRatio));
    this.renderer.setSize(this.canvas.clientWidth || innerWidth, this.canvas.clientHeight || innerHeight, false);
    this.renderer.shadowMap.enabled = this.sun.castShadow = !!preset.shadow;
    if (this.sun.shadow.mapSize.x !== preset.shadow && this.sun.shadow.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
    this.sun.shadow.mapSize.set(preset.shadow || 512, preset.shadow || 512);
    this.art.quality(settings);
    if (this.field.grass) this.art.grass.count = Math.floor(this.art.grass.count * .36);
    this.canvas.dataset.artStyle = "model";
    this.canvas.dataset.surfaces = surface("ground").map
      ? "scanned"
      : "procedural";
    this.canvas.dataset.quality = settings.quality;
    this.canvas.dataset.shadows = String(!!preset.shadow);
    document.body.classList.toggle("reduced-motion", settings.reducedMotion);
  }
  createNodes(definitions = this.sim.layout.nodes) {
    return definitions.map((d) => {
      const { id } = d,
        g = new T.Group(),
        y = d.kind === "tree" ? this.sim.terrainVolume.field.surfaceHeight(d.x,d.z) : this.sim.groundHeight(d.x, d.z);
      g.position.set(d.x, y, d.z);
      let crystal;
      const rock = ["rock", "ore", "geode"].includes(d.kind)
        ? fieldProp("boulder", (d.kind === "rock" ? .89 : .61) * (d.scale || 1))
        : null;
      if (rock) {
        rock.rotation.y = d.x * 1.7 + d.z * .2;
        g.add(rock);
      }
      if (d.kind === "geode") {
        const tint = GEODE_MATERIALS[d.material].color;
        if (!rock) this.art.shape(g, "stone", 0x4c566c, 0, 0.15, 0, 0.93, 0.64, 0.72);
        crystal = new T.Group();
        crystal.position.y = 0.41;
        g.add(crystal);
        for (let i = 0; i < 7; i++) {
          const a = i * 2.399,
            h = i === 0 ? 1.22 : 0.57 + (i % 3) * 0.16;
          const shard = this.art.shape(
            crystal,
            "gem",
            tint,
            Math.sin(a) * i * 0.066,
            h * 0.48,
            Math.cos(a) * i * 0.07,
            0.16,
            h,
            0.21,
          );
          shard.rotation.z = Math.cos(a) * 0.33;
          shard.material = this.art.material(tint, 0.22);
        }
      } else if (d.kind === "ore") {
        for (let i = 0; i < 4; i++) {
          const c = mesh(
            g,
            "cone",
            0x88c4dc,
            (i - 1.5) * 0.25,
            0.4 + (i % 2) * 0.2,
            Math.sin(i) * 0.3,
            0.25,
            1.2,
            5,
          );
          c.rotation.z = (i - 1.5) * 0.15;
        }
      } else if (d.kind === "rock") {
        if (!rock) {
          const fallback = this.art.shape(
            g, "stone", 0x819199, 0, 0.41, 0, 1.36, 0.91, 1.09,
          );
          fallback.rotation.set(0.18, d.x, 0.12);
          this.art.shape(g, "gem", 0xb9bcc1, 0.32, 0.75, 0.12, 0.6, 0.42, 0.64);
        }
      } else if (d.kind === "wreck") {
        const hull = this.art.shape(
          g,
          "panel",
          0x506374,
          0,
          0.46,
          0,
          2.15,
          0.64,
          1.25,
        );
        hull.rotation.z = 0.22;
        this.art.shape(g, "box", 0x9eb8c4, -0.2, 0.74, 0.12, 1.14, 0.18, 0.78);
        this.art.shape(
          g,
          "box",
          0x7af8ed,
          -0.2,
          0.85,
          0.16,
          0.78,
          0.07,
          0.19,
        ).material = this.art.material(0x7af8ed, 0.8);
        for (const x of [-0.82, 0.82])
          this.art.shape(
            g,
            "tube",
            0x2f394b,
            x,
            0.31,
            -0.11,
            0.26,
            0.59,
            0.26,
          ).rotation.x = Math.PI / 2;
      } else if (d.kind === "herb") {
        const fibre = FIBRE_PLANTS[d.species];
        const plant = fibre && fieldProp("fibre-plant", 0.74, fibre.color);
        if (plant) g.add(plant);
        else for (let i = 0; i < 5; i++) {
          mesh(
            g,
            "cylinder",
            0x6a9c78,
            Math.sin(i) * 0.3,
            0.25,
            Math.cos(i) * 0.3,
            0.03,
            0.5,
            5,
          );
          mesh(
            g,
            "sphere",
            fibre?.color ?? 0xd0b6f2,
            Math.sin(i) * 0.3,
            0.6,
            Math.cos(i) * 0.3,
            0.16,
          );
        }
      } else if (d.kind === "tree") {
        const s = d.scale || 0.78;
        this.art.shape(
          g,
          "tube",
          0x796458,
          0,
          1.62 * s,
          0,
          0.31 * s,
          3.24 * s,
          0.28 * s,
        );
        for (let j = 0; j < 2; j++) {
          const branch = this.art.shape(
            g,
            "tube",
            0x6b544c,
            (j ? 0.42 : -0.39) * s,
            2.59 * s,
            0.12 * s,
            0.15 * s,
            1.7 * s,
            0.13 * s,
          );
          branch.rotation.z = j ? -0.55 : 0.6;
        }
        for (let i = 0; i < 4; i++)
          this.art.shape(
            g,
            "crown",
            d.blossom || i === 3
              ? this.art.palette.blossom
              : this.art.palette.leaf,
            Math.cos(i * 2.4) * 1.03 * s,
            (3.16 + i * 0.42) * s,
            Math.sin(i * 2.4) * 0.91 * s,
            (1.55 - i * 0.19) * s,
            0.86 * s,
            (1.43 - i * 0.18) * s,
          );
      } else {
        const ring = new T.Mesh(
          new T.TorusGeometry(0.6, 0.03, 4, 24),
          new T.MeshBasicMaterial({ color: 0xc0f2fa }),
        );
        ring.rotation.x = -Math.PI / 2;
        g.add(ring);
        mesh(g, "sphere", 0xbde8ee, 0, 0.3, 0, 0.1);
      }
      if(d.kind === "tree") this.voxelTrees.attach(g,d,{...treeEcology(this.state.seed,this.state.realm,d.x,d.z),protectedBoxes:Math.max(Math.abs(d.x),Math.abs(d.z))<40?this.treeClearance:undefined,felled:!!this.state.trees?.felled[d.id]});
      const glow = new T.Mesh(
        new T.RingGeometry(0.8, 0.85, 24),
        new T.MeshBasicMaterial({
          color: d.kind === "ore" ? 0xb3dcff : 0xd9d1ff,
          side: T.DoubleSide,
          transparent: true,
          opacity: 0.5,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.06;
      g.add(glow);
      this.scene.add(g);
      const node={ ...d, type: "node", mesh: g, glow, crystal,voxelManaged:d.kind==="tree" };
      if(d.kind==="tree")Object.defineProperty(node,"voxelTree",{get:()=>this.voxelTrees.entries.get(String(id))?.tree});
      return node;
    });
  }
  buildFeatures(definitions) {
    return definitions.map((f) => {
      const group = new T.Group();
      group.position.set(f.x, this.height(f.x, f.z), f.z);
      this.scene.add(group);
      const shape = (kind, color, ...args) =>
        this.art.shape(group, kind, color, ...args);
      let moving;
      if (f.kind === "cache") {
        const bronze = 0x9cafc3,
          wood = 0x344e65;
        shape("panel", wood, 0, 0.37, 0, 1.58, 0.7, 1.12);
        shape("box", 0x211c33, 0, 0.73, 0, 1.43, 0.06, 0.97);
        for (const x of [-0.65, 0.65]) {
          shape("box", bronze, x, 0.42, 0.57, 0.12, 0.65, 0.05);
          shape("box", bronze, x, 0.42, -0.57, 0.12, 0.65, 0.05);
        }
        moving = new T.Group();
        moving.position.set(0, 0.76, -0.56);
        group.add(moving);
        this.art.shape(
          moving,
          "box",
          0x666187,
          0,
          0.11,
          0.56,
          1.65,
          0.25,
          1.15,
        );
        for (const x of [-0.65, 0.65])
          this.art.shape(
            moving,
            "box",
            bronze,
            x,
            0.24,
            0.56,
            0.14,
            0.045,
            1.16,
          );
        shape("box", 0x8df0e8, 0, 0.53, 0.61, 0.43, 0.09, 0.06).material =
          this.art.material(0x8df0e8, 0.8);
      } else if (f.kind === "beacon") {
        shape("tube", 0x657384, 0, 0.14, 0, 1.7, 0.28, 1.7);
        shape("gem", 0x9eafcb, 0, 1.12, 0, 0.59, 1.15, 0.56);
        for (const x of [-0.62, 0.62]) {
          shape("box", 0x405b79, x, 1.65, 0, 0.16, 2.48, 0.36);
          shape("box", 0x8ae1f1, x, 1.62, 0.2, 0.07, 1.53, 0.026).material =
            this.art.material(0x8ae1f1, 0.63);
        }
        this.art.ring(group, 0.6, 0.018, 0xb0d6ff, 2.44);
        this.art.ring(group, 0.67, 0.024, 0xb0d6ff, 2.69, true);
        moving = shape("gem", 0xdab6ff, 0, 2.65, 0, 0.44, 0.76, 0.44);
        moving.material = this.art.material(0xdab6ff, 0.8);
        this.art.ring(group, 0.94, 0.038, 0xae9ce2, 0.33);
      } else {
        for (let i = 0; i < 6; i++) {
          const a = i * 2.399;
          const rock = shape(
            "gem",
            i % 2 ? 0x657887 : 0x86949b,
            Math.sin(a) * 0.72,
            0.32,
            Math.cos(a) * 0.74,
            0.67,
            0.62,
            0.66,
          );
          rock.rotation.set(a, i, 0.5);
        }
        shape("gem", 0x87d9eb, 0.2, 0.82, 0.14, 0.24, 0.62, 0.22).material =
          this.art.material(0x87d9eb, 0.35);
      }
      const tint =
        f.kind === "cache"
          ? 0xffd28b
          : f.kind === "beacon"
            ? 0xd0acff
            : 0x9cdded;
      this.art.ring(group, f.radius + 0.22, 0.028, tint, 0.12);
      return { ...f, type: "feature", mesh: group, moving };
    });
  }
  createFeatures() {
    this.coreFeatures = this.buildFeatures(this.sim.layout.features);
    this.waypoint = new T.Group();
    this.art.ring(this.waypoint, 0.54, 0.045, 0xffdaa0, 0.08);
    const pin = this.art.shape(
      this.waypoint,
      "gem",
      0xffe9b5,
      0,
      0.56,
      0,
      0.15,
      0.32,
      0.15,
    );
    pin.material = this.art.material(0xffdaa0, 0.8);
    this.waypoint.visible = false;
    this.scene.add(this.waypoint);
  }
  syncWorld() {
    this.sim.syncChunks();
    const tiles = this.sim.chunks.tiles;
    if (this.visibleTiles === tiles) return;
    this.visibleTiles = tiles;
    for (const [key, record] of this.chunkMeshes)
      if (!tiles.has(key)) {
        this.scene.remove(record.terrain);
        record.terrain.geometry.dispose();
        for (const object of [...record.nodes, ...record.features]) {
          if(object.kind === "tree") this.voxelTrees.detach(object.id);
          this.scene.remove(object.mesh);
          this.releaseObject(object.mesh);
        }
        this.chunkMeshes.delete(key);
      }
    for (const [key, tile] of tiles)
      if (!this.chunkMeshes.has(key))
        this.chunkMeshes.set(key, {
          terrain: this.createTerrain(tile),
          nodes: this.createNodes(tile.nodes),
          features: this.buildFeatures(tile.features),
        });
    const farWanted=new Set(),cx=Math.floor(this.sim.player.x/CHUNK_SIZE),cz=Math.floor(this.sim.player.z/CHUNK_SIZE);
    for(let dz=-5;dz<=5;dz++)for(let dx=-5;dx<=5;dx++){const key=(cx+dx)+':'+(cz+dz);if(tiles.has(key))continue;farWanted.add(key);if(!this.farTerrain.has(key))this.farTerrain.set(key,this.createTerrain({cx:cx+dx,cz:cz+dz,distant:true}));}
    for(const [key,mesh] of this.farTerrain)if(!farWanted.has(key)){this.scene.remove(mesh);mesh.geometry.dispose();this.farTerrain.delete(key);}
    this.nodes = [
      ...this.coreNodes,
      ...Array.from(this.chunkMeshes.values()).flatMap((c) => c.nodes),
    ];
    this.features = [
      ...this.coreFeatures,
      ...Array.from(this.chunkMeshes.values()).flatMap((c) => c.features),
    ];
    this.terrainTiles = Array.from(this.chunkMeshes.values(), (c) => c.terrain);
    this.maskTerrain();
    this.syncEnemyMeshes();
    this.scene.updateMatrixWorld(true);
  }
  markDestination(point) {
    this.waypoint.visible = !!point;
    if (point)
      this.waypoint.position.set(
        point.x,
        this.height(point.x, point.z),
        point.z,
      );
  }
  interactables() {
    const now = Date.now();
    return [
      ...(this.coreDrill ? [this.coreDrill] : []),
      ...(this.nursery ? [this.nursery.target] : []),
      ...(this.microvoxels ? [this.microvoxels.target] : []),
      ...this.features.filter(
        (f) =>
          f.kind === "beacon" || !this.state.exploration.changed.includes(f.id),
      ),
      ...this.nodes.filter(
        (n) => !this.state.trees?.felled[n.id] && (n.kind === "geode" || !(this.state.depleted[n.id] > now)),
      ),
      ...this.workstations.entries.map(({ def, group }) => ({
        ...def,
        type: "station",
        mesh: group,
      })),
    ];
  }
  pickEnemy(clientX, clientY) {
    const rect=this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);
    let best=this.ray.intersectObjects(this.terrainTiles,false)[0]?.distance??Infinity,target=null;
    for(const e of this.sim.enemies){const mesh=this.foes.get(e.id)?.mesh;if(e.hp<=0||!mesh?.visible||Math.hypot(e.x-this.sim.player.x,e.z-this.sim.player.z)>30)continue;
      const hit=this.ray.intersectObject(mesh,true)[0];if(hit&&hit.distance<best){best=hit.distance;target=e;}}
    return target;
  }
  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(
      new T.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((clientY - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    const terrainHit = this.ray.intersectObjects(this.terrainTiles, false)[0];
    const visible = this.interactables().filter(
      (o) => Math.hypot(o.x - this.sim.player.x, o.z - this.sim.player.z) < 65,
    );
    let nearest = terrainHit ? terrainHit.distance + 0.25 : 65,
      target;
    for (const object of visible) {
      const hit = this.ray
        .intersectObject(object.mesh, true)
        .find(({ object: mesh }) => {
          for (let parent = mesh; parent; parent = parent.parent)
            if (!parent.visible) return false;
          return true;
        });
      if (hit && hit.distance < nearest) {
        nearest = hit.distance;
        target = object;
      }
    }
    if (target) return target;
    if (terrainHit && terrainHit.distance < 85)
      return { x: terrainHit.point.x, z: terrainHit.point.z };
    return null;
  }
  createEnemies() {
    enemySites.forEach(([x, z], i) =>
      this.sim.spawn(
        this.state.realm + "-hollow-" + i,
        x,
        z,
        false,
        ["stalker", "sentinel", "archer", "oracle"][i % 4],
      ),
    );
    this.sim.layout.wilds.forEach(({ id, x, z }, i) =>
      this.sim.spawn(
        id,
        x,
        z,
        false,
        ["drone", "sentinel", "oracle", "drone", "stalker"][i % 5],
      ),
    );
    this.sim.spawn(this.state.realm + "-warden", 0, -48, true);
    this.sim.spawn(this.state.realm + "-training", -4, -3, false, "training");
    this.syncEnemyMeshes();
  }
  syncEnemyMeshes() {
    const active = new Set(this.sim.enemies.map((e) => e.id));
    for (const [id, parts] of this.foes)
      if (!active.has(id)) {
        for (const object of Object.values(parts)) {
          this.scene.remove(object);
          this.releaseObject(object);
        }
        this.foes.delete(id);
      }
    for (const e of this.sim.enemies) {
      if (this.foes.has(e.id)) continue;
      const g = new T.Group();
      const beast = e.archetype === "shearjaw" ? fieldProp("shearjaw", 1.4, 0xa8c8e0) : null;
      {
        const dark = e.training
            ? 0x92775b
            : e.boss
              ? 0x454866
              : e.archetype === "sentinel"
                ? 0x506b7b
                : e.archetype === "archer"
                  ? 0x527868
                  : e.archetype === "oracle"
                    ? 0x875167
                    : 0x666379,
          glow = e.boss
            ? 0xe5b76b
            : e.archetype === "oracle"
              ? 0xffb080
              : 0xc6a3ed;
        const shape = (...args) => this.art.shape(g, ...args);
        if (beast) g.add(beast);
        else if (e.archetype === "drone") {
          shape("gem", 0x607f92, 0, 1.9, 0, 0.73, 0.43, 0.48);
          shape("gem", 0x9bf5ec, 0, 1.92, 0.36, 0.24, 0.16, 0.15).material =
            this.art.material(0x9bf5ec, 0.8);
          for (const x of [-0.64, 0.64]) {
            shape("box", 0x354361, x, 1.77, 0, 0.24, 0.16, 0.71);
            shape("tube", 0x91add0, x, 1.68, 0, 0.28, 0.13, 0.28);
            this.art.ring(g, 0.16, 0.027, 0x98eaf9, 1.52).position.x = x;
          }
        } else if (e.training) {
          shape("tube", 0x7a624b, 0, 0.9, 0, 0.1, 1.8, 0.1);
          shape("box", 0x8b7152, 0, 1.5, 0, 1.4, 0.16, 0.16);
          shape("orb", 0xb6a17b, 0, 1.3, 0, 0.38, 0.52, 0.26);
          shape("orb", 0xc6b18a, 0, 2.02, 0, 0.28, 0.29, 0.26);
          for (const x of [-0.1, 0.1])
            shape("box", 0x423d36, x, 2.05, 0.24, 0.045, 0.05, 0.025);
          for (const y of [1, 1.3, 1.6])
            shape("tube", 0x685b54, 0, y, 0, 0.39, 0.055, 0.27);
          shape("gem", 0x728e91, 0, 1.35, 0.29, 0.18, 0.25, 0.04);
        } else {
          shape("orb", dark, 0, 1.3, 0, 0.42, 0.57, 0.28);
          for (const sign of [-1, 1]) {
            const plate = shape(
              "gem",
              dark,
              sign * 0.23,
              0.78,
              -0.04,
              0.26,
              0.65,
              0.26,
            );
            plate.rotation.z = sign * -0.2;
            shape("gem", 0x4b5066, sign * 0.17, 0.32, 0.02, 0.13, 0.35, 0.17);
            shape("gem", dark, sign * 0.49, 1.67, 0, 0.25, 0.21, 0.28);
            const claw = shape(
              "gem",
              0x8e9ca5,
              sign * 0.51,
              1.05,
              0.15,
              0.09,
              0.42,
              0.12,
            );
            claw.rotation.z = sign * -0.18;
            const horn = shape(
              "cone",
              0xa6a5ac,
              sign * 0.25,
              2.42,
              -0.03,
              0.1,
              0.65,
              0.1,
            );
            horn.rotation.z = sign * -0.3;
          }
          shape("orb", 0x2c3448, 0, 2.02, 0, 0.3, 0.35, 0.25);
          shape("gem", 0xa4b1b7, 0, 2.02, 0.2, 0.25, 0.28, 0.08);
          for (const x of [-0.12, 0.12]) {
            const eye = shape("box", glow, x, 2.07, 0.28, 0.12, 0.035, 0.025);
            eye.material = this.art.material(glow, 0.9);
          }
          const core = shape("gem", glow, 0, 1.55, 0.29, 0.13, 0.2, 0.06);
          core.material = this.art.material(glow, 0.65);
          this.art.ring(g, 0.34, 0.025, glow, 2.61);
          if (e.boss) {
            for (const sign of [-1, 1]) {
              const wing = shape(
                "gem",
                dark,
                sign * 0.82,
                1.95,
                -0.23,
                0.28,
                0.86,
                0.19,
              );
              wing.rotation.z = sign * -0.55;
              shape("gem", glow, sign * 0.64, 1.8, 0.09, 0.12, 0.32, 0.07);
            }
          }
        }
        if (e.boss) g.scale.setScalar(1.7);
        if (e.archetype === "sentinel")
          mesh(g, "box", 0x8ca7b2, -0.65, 1.2, 0.3, 0.75, 1.3, 0.18);
        if (e.archetype === "archer") {
          const bow = new T.Mesh(
            new T.TorusGeometry(0.65, 0.05, 6, 24, Math.PI),
            mat(0xc6b685),
          );
          bow.position.set(0.6, 1.4, 0.2);
          bow.rotation.z = Math.PI / 2;
          g.add(bow);
        }
        if (e.archetype === "oracle") {
          const orb = mesh(g, "sphere", 0xfbb28b, 0.7, 1.7, 0.3, 0.23);
          orb.material = mat(0xfbb28b, 0.7);
        }
      }
      const telegraph = new T.Mesh(
        new T.RingGeometry(0.1, e.boss ? 6 : 3.3, 48),
        new T.MeshBasicMaterial({
          color: 0xf4a293,
          transparent: true,
          opacity: 0.3,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      telegraph.rotation.x = -Math.PI / 2;
      const aim = new T.Mesh(
        new T.BoxGeometry(0.35, 0.025, 1),
        new T.MeshBasicMaterial({
          color: 0xffbd8c,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      this.scene.add(aim);
      this.scene.add(telegraph);
      this.scene.add(g);
      this.foes.set(e.id, { mesh: g, telegraph, aim });
    }
  }
  setHero() {
    this.scene.remove(this.character);
    this.releaseObject(this.character);
    this.character = this.avatar(HEROES.find((h) => h.id === this.state.hero));
    this.canvas.dataset.avatarModel = this.character.userData.rig
      ? "rigged"
      : "procedural";
    this.scene.add(this.character);
  }
  nearestNode() {
    let nearest = null,
      distance = 4;
    for (const node of this.nodes) {
      if (this.state.depleted[node.id] > Date.now() || this.state.trees?.felled[node.id]) continue;
      const d = Math.hypot(
        node.x - this.sim.player.x,
        node.z - this.sim.player.z,
      );
      if (d < distance) {
        nearest = node;
        distance = d;
      }
    }
    return nearest;
  }
  project(x, y, z) {
    const v = new T.Vector3(x, y, z).project(this.camera);
    return {
      x: ((v.x + 1) / 2) * this.canvas.clientWidth,
      y: ((-v.y + 1) / 2) * this.canvas.clientHeight,
      visible: v.z > -1 && v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1,
    };
  }
  skillFX(event) {
    this.character.userData.attack = 0.35;
    if (event.projectile) return;
    const g = new T.Group();
    g.position.set(event.x, this.height(event.x, event.z) + 0.3, event.z);
    const c = event.echo
      ? 0x96dfea
      : event.id === "strike"
        ? 0xffdcad
        : 0xc7b1ff;
    const ring = new T.Mesh(
      new T.RingGeometry(
        event.id === "strike" ? 1.6 : event.radius * 0.85,
        event.id === "strike" ? 2.3 : event.radius,
        64,
        1,
        event.id === "strike" ? -0.7 : 0,
        event.id === "strike" ? Math.PI * 1.3 : Math.PI * 2,
      ),
      new T.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        side: T.DoubleSide,
        blending: T.AdditiveBlending,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);
    if (!this.visuals.reducedMotion) {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const shard = new T.Mesh(
          new T.OctahedronGeometry(0.12),
          new T.MeshBasicMaterial({
            color: c,
            transparent: true,
            opacity: 0.8,
            blending: T.AdditiveBlending,
            depthWrite: false,
          }),
        );
        shard.position.set(
          Math.sin(a) * (event.radius || 2) * 0.8,
          0.2 + (i % 3) * 0.15,
          Math.cos(a) * (event.radius || 2) * 0.8,
        );
        shard.scale.y = 3;
        g.add(shard);
      }
    }
    g.rotation.y = event.facing;
    this.scene.add(g);
    this.effects.push({ mesh: g, life: 0.5, max: 0.5 });
    this.character.userData.attack = 0.35;
  }
  impactFX(event) {
    // Bounded, short-lived additive sparks; these never alter hit resolution.
    if (this.visuals.reducedMotion || this.effects.length >= 24) return;
    const tint =
      {
        Flame: 0xffad68,
        Tide: 0x82dbff,
        Volt: 0xffe58e,
        Astral: 0xc3a0ff,
        Gale: 0x95e6bd,
        Void: 0xce8bdb,
        Solar: 0xffe4ab,
      }[event.element] || 0xe6eaff;
    const g = new T.Group();
    g.position.set(event.x, this.height(event.x, event.z) + 1.25, event.z);
    for (let i = 0; i < (event.critical ? 10 : 6); i++) {
      const a = i * 2.399;
      const spark = new T.Mesh(
        new T.OctahedronGeometry(0.06),
        new T.MeshBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.95,
          blending: T.AdditiveBlending,
          depthWrite: false,
        }),
      );
      spark.position.set(
        Math.sin(a) * 0.2,
        Math.cos(i) * 0.15,
        Math.cos(a) * 0.2,
      );
      spark.userData.velocity = new T.Vector3(
        Math.sin(a) * 2,
        1.4 + Math.cos(i) * 1.3,
        Math.cos(a) * 2,
      );
      spark.scale.y = 2.7;
      g.add(spark);
    }
    this.scene.add(g);
    this.effects.push({ mesh: g, life: 0.38, max: 0.38, sparks: true });
  }
  update(dt, input, time) {
    this.canvas.dataset.waterContact=this.sim.player.swimming?"swimming":this.sim.player.wading?"wading":"dry";
    this.waterView?.update(this.sim.player.x,this.sim.player.z);
    if(this.horizon?.update(this.sim.player.x,this.sim.player.z)){this.scene.fog.near=1100;this.scene.fog.far=1900;this.canvas.dataset.horizonReady='true';this.canvas.dataset.horizonTriangles=String(this.horizon.triangles);}
    this.syncWorld();
    const p = this.sim.player,
      c = this.character,
      terrainY = p.terrainY ?? this.height(p.x, p.z);
    c.position.set(p.x, terrainY + p.y, p.z);
    c.rotation.y = p.facing;
    this.moving = !!(input.x || input.z);
    const animationTime = this.visuals.reducedMotion ? 0 : time;
    const stride = this.moving
      ? Math.sin(time * 12) * 0.55
      : Math.sin(animationTime * 2) * 0.025;
    c.legs[0].rotation.x = stride;
    c.legs[1].rotation.x = -stride;
    c.arms[0].rotation.x = -stride * 0.6;
    c.userData.attack = Math.max(0, c.userData.attack - dt);
    c.arms[1].rotation.x =
      c.userData.attack > 0
        ? -1.4 + Math.sin(c.userData.attack * 14) * 1.6
        : stride * 0.6;
    const weapon = skillStats(this.state, "strike").weapon;
    if (c.userData.attack > 0 && weapon === "bow") {
      c.arms[0].rotation.x = -1.3;
      c.arms[1].rotation.x = -1.1;
    }
    if (c.userData.attack > 0 && weapon === "staff")
      c.arms[1].rotation.x = -1.4;
    if (this.gathering && !this.visuals.reducedMotion) {
      c.arms[1].rotation.x = -0.68 + Math.sin(time * 9) * 0.5;
      c.arms[0].rotation.x = -0.42;
    }
    c.userData.facing = p.facing;
    c.userData.guarding = p.guard;
    c.userData.weapon = weapon;
    c.userData.cameraYaw = this.yaw;
    this.art.animateAvatar(
      c,
      stride,
      animationTime,
      this.moving,
      this.visuals.reducedMotion,
    );
    if (p.guard) {
      c.arms[0].rotation.x = -1.19;
      c.arms[0].rotation.z = -0.27;
    } else c.arms[0].rotation.z = 0;
    c.rotation.z = p.dodge > 0 ? 0.22 : 0;
    this.art.skyGroup.position.set(p.x, terrainY, p.z);
    this.art.update(time, this.visuals.reducedMotion);
    this.field.sync(this.sim.chunks.tiles, p, this.visuals.quality);
    this.field.update(p, this.sim.blockers, dt, time, this.visuals.reducedMotion);
    this.workstations.update(time, this.visuals.reducedMotion);
    this.nursery?.update(this.state.nursery, Date.now());
    this.voxelTerrain?.sync(p);
    this.voxelTrees?.update(p.x,p.z);
    for(const entry of this.voxelTrees.entries.values())if(!entry.mesh&&!entry.deferred)entry.publishCollision=null;
    this.sun.position.set(p.x - 30, terrainY + 48, p.z - 22);
    this.sun.target.position.set(p.x, terrainY, p.z);
    this.sun.target.updateMatrixWorld();
    this.updateCamera(dt, input);
    if (this.gateRing)
      this.gateRing.rotation.z += this.visuals.reducedMotion ? 0 : dt * 0.22;
    if (this.gateCrystal)
      this.gateCrystal.position.y = 2.8 + Math.sin(animationTime) * 0.14;
    this.npc.rotation.y = Math.atan2(p.x - 6, p.z + 1);
    for (const node of this.nodes) {
      node.mesh.visible =
        (node.kind === "geode" || !(this.state.depleted[node.id] > Date.now())) && !this.state.trees?.felled[node.id];
      if (node.crystal)
        node.crystal.scale.setScalar(
          [0.24, 0.44, 0.72, 1][geodeStage(this.state.depleted[node.id])],
        );
      node.glow.visible = Math.hypot(node.x - p.x, node.z - p.z) < 12;
      node.glow.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;
    }
    for (const f of this.features) {
      const changed = this.state.exploration.changed.includes(f.id);
      if (f.kind === "rubble") f.mesh.visible = !changed;
      if (f.kind === "cache")
        f.moving.rotation.x +=
          ((changed ? -1.3 : 0) - f.moving.rotation.x) *
          (this.visuals.reducedMotion ? 1 : 1 - Math.exp(-12 * dt));
      if (f.kind === "beacon") {
        f.moving.position.y =
          2.65 + (changed ? 0.24 : 0) + Math.sin(animationTime * 1.8) * 0.15;
        f.moving.rotation.y = animationTime * 0.63;
      }
    }
    for (const e of this.sim.enemies) {
      const v = this.foes.get(e.id);
      v.mesh.visible = e.hp > 0;
      v.mesh.position.set(
        e.x,
        this.sim.groundHeight(e.x, e.z) +
          (e.boss
            ? 0
            : (e.archetype === "drone" ? 0.22 : 0.06) *
              Math.sin(animationTime * 3)),
        e.z,
      );
      v.mesh.rotation.y = Math.atan2(p.x - e.x, p.z - e.z);
      if (e.archetype === "shearjaw" && e.hp > 0 && Math.hypot(p.x - e.x, p.z - e.z) < 52)
        animateFieldProp(v.mesh.children[0], e.phase === "windup" ? "Attack" : e.phase === "chase" ? "Walk" : "Idle", dt);
      const aimed = e.move === "eruption" || e.move === "pounce",
        tx = aimed ? e.aimX : e.x,
        tz = aimed ? e.aimZ : e.z;
      v.telegraph.position.set(tx, this.height(tx, tz) + 0.08, tz);
      const ranged = e.move === "arrow" || e.move === "volley";
      v.telegraph.visible = e.phase === "windup" && e.hp > 0 && !ranged;
      v.telegraph.scale.setScalar(e.move === "pounce" ? 2.2 / 3.3 : aimed ? 3.5 / 3.3 : 1);
      v.telegraph.material.opacity =
        0.15 + (1 - e.timer / (e.windupDuration || 1)) * 0.45;
      v.aim.visible = e.phase === "windup" && ranged && e.hp > 0;
      if (v.aim.visible) {
        const d = Math.hypot(e.aimX - e.x, e.aimZ - e.z);
        v.aim.position.set(
          (e.x + e.aimX) / 2,
          this.sim.groundHeight(e.x, e.z) + 0.1,
          (e.z + e.aimZ) / 2,
        );
        v.aim.scale.z = d;
        v.aim.scale.x = e.move === "volley" ? 2.4 : 1;
        v.aim.rotation.y = Math.atan2(e.aimX - e.x, e.aimZ - e.z);
      }
      if (e.boss) v.mesh.scale.setScalar(e.enraged ? 1.85 : 1.7);
    }
    const activeShots = new Set();
    for (const shot of this.sim.projectiles) {
      activeShots.add(shot.id);
      let g = this.projectileMeshes.get(shot.id);
      if (!g) {
        g = new T.Group();
        const enemy = shot.faction === "enemy",
          arrow = enemy
            ? shot.element === "Physical"
            : shot.cast.skill.weapon === "bow",
          tint = enemy ? 0xff9c7f : arrow ? 0xffe0ad : 0xc0b4ff;
        if (arrow) {
          mesh(g, "box", tint, 0, 0, 0, 0.06, 0.06, 0.9);
          const tip = mesh(g, "cone", tint, 0, 0, 0.55, 0.15, 0.4, 4);
          tip.rotation.x = Math.PI / 2;
        } else {
          const orb = mesh(g, "sphere", tint, 0, 0, 0, 0.18);
          orb.material = mat(tint, 0.8);
          mesh(g, "cone", tint, 0, 0, -0.35, 0.12, 0.7, 6).rotation.x =
            Math.PI / 2;
        }
        for (let i = 0; i < 4; i++) {
          const trail = new T.Mesh(
            new T.OctahedronGeometry(1),
            new T.MeshBasicMaterial({
              color: tint,
              transparent: true,
              opacity: 0.35 - i * 0.065,
              depthWrite: false,
              blending: T.AdditiveBlending,
            }),
          );
          trail.position.z = -0.3 - i * 0.35;
          trail.scale.set(0.1 - i * 0.015, 0.1 - i * 0.015, 0.45);
          g.add(trail);
        }
        this.projectileMeshes.set(shot.id, g);
        this.scene.add(g);
      }
      g.position.set(shot.x, this.height(shot.x, shot.z) + 1.35, shot.z);
      g.rotation.y = Math.atan2(shot.dx, shot.dz);
    }
    for (const [id, g] of this.projectileMeshes)
      if (!activeShots.has(id)) {
        this.scene.remove(g);
        // Only trails have unique geometry/materials; core meshes are cached.
        for (const ch of g.children)
          if (ch.material.blending === T.AdditiveBlending) {
            ch.geometry.dispose();
            ch.material.dispose();
          }
        this.projectileMeshes.delete(id);
      }
    this.effects = this.effects.filter((e) => {
      e.life -= dt;
      e.mesh.scale.multiplyScalar(1 + dt * 0.6);
      for (const child of e.mesh.children)
        child.material.opacity = Math.max(0, e.life / e.max);
      if (e.sparks)
        for (const child of e.mesh.children) {
          child.position.addScaledVector(child.userData.velocity, dt);
          child.userData.velocity.y -= dt * 5;
        }
      if (e.life <= 0) {
        this.scene.remove(e.mesh);
        for (const ch of e.mesh.children) {
          ch.geometry.dispose();
          ch.material.dispose();
        }
        return false;
      }
      return true;
    });
    this.renderer.render(this.scene, this.camera);
  }
  releaseObject(object) {
    // Retire unique avatar geometry while keeping shared art materials alive.
    const shared = new Set([
      ...this.art.geometries.values(),
      ...geometries.values(),
    ]);
    object.traverse((o) => {
      if (o.userData.sharedFieldAsset) {
        if (o.isSkinnedMesh) o.skeleton.dispose();
        if (o.userData.ownedFieldMaterial) o.material.dispose();
        return;
      }
      if (o.userData.sharedRigGeometry && o.isSkinnedMesh) o.skeleton.dispose();
      if (
        o.geometry &&
        !o.isSprite &&
        !o.userData.sharedRigGeometry &&
        !shared.has(o.geometry)
      )
        o.geometry.dispose();
      if (o.userData.ownedTexture) {
        o.material.map.dispose();
        this.art.textures.delete(o.material.map);
      }
      if (o.material)
        for (const material of Array.isArray(o.material)
          ? o.material
          : [o.material])
          if (
            ![...this.art.materials.values(), ...materials.values()].includes(
              material,
            )
          )
            material.dispose();
    });
  }
  dispose() {
    this.sim.treeOccupied=null;this.sim.isVoxelTree=null;this.sim.terrainReady=null;
    this.waterView?.dispose();
    this.horizon?.dispose();
    this.voxelTrees?.dispose();
    this.microvoxels?.dispose();
    this.voxelTerrain?.dispose();
    removeEventListener("resize", this.resize);
    this.viewportObserver?.disconnect();
    globalThis.visualViewport?.removeEventListener("resize", this.resize);
    const geometrySet = new Set(),
      materialSet = new Set();
    this.scene.traverse((o) => {
      if (o.userData.sharedFieldAsset) {
        if (o.isSkinnedMesh) o.skeleton.dispose();
        if (o.userData.ownedFieldMaterial) materialSet.add(o.material);
        return;
      }
      if (o.userData.sharedRigGeometry && o.isSkinnedMesh) o.skeleton.dispose();
      if (o.geometry && !o.isSprite && !o.userData.sharedRigGeometry)
        geometrySet.add(o.geometry);
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if(!m.userData.worldSurfaceKit)materialSet.add(m);
    });
    for (const g of geometrySet) g.dispose();
    for (const m of materialSet) m.dispose();
    this.art.dispose();
    this.sun.shadow.dispose();
    materials.clear();
    geometries.clear();
    this.renderer.dispose();
  }
}
