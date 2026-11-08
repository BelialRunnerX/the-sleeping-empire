import * as T from "../vendor/three.module.js";
import { hash, roll } from "./simulation.mjs";
import { HEROES, REALMS } from "./content.mjs";
import { ArtDirector, GRAPHICS } from "./art.mjs";
import { IllustratedArt } from "./illustrated.mjs";
const color = (hex) => new T.Color(hex);
export function ground(x, z, realm = "bastion") {
  if (Math.hypot(x, z) < 13) return 0;
  const hill =
    (Math.sin(x * 0.028) * Math.cos(z * 0.035) * 2 +
      Math.sin(z * 0.08 + x * 0.02) * 0.7) *
    Math.min(1, (Math.hypot(x, z) - 13) / 20);
  const elevation = realm === "moon" ? hill * 0.6 : hill;
  // Shallow riverbed keeps the water surface above the land. The crossing
  // shares the visible deck height so characters walk on its planks.
  if (Math.abs(x - 30) < 5.8 && Math.abs(z - 6) < 1.25) return 0.05;
  const bank = Math.max(0, Math.min(1, (5.8 - Math.abs(x - 30)) / 1.8));
  const smoothBank = bank * bank * (3 - 2 * bank);
  return elevation * (1 - smoothBank) - 0.72 * smoothBank;
}
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
  ) {
    this.canvas = canvas;
    this.state = state;
    this.sim = sim;
    this.scene = new T.Scene();
    const realm = REALMS.find((r) => r.id === state.realm) || REALMS[0];
    this.realm = realm;
    this.illustrated = visuals.style !== "model";
    const Art = this.illustrated ? IllustratedArt : ArtDirector;
    this.art = new Art(this.scene, state.realm, state.seed, ground, roll);
    this.scene.background = color(this.art.palette.mist);
    this.scene.fog = new T.Fog(this.art.palette.mist, 65, 195);
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
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.distance = this.illustrated ? 13 : 8.5;
    this.yaw = this.illustrated ? Math.PI / 4 : 0;
    this.pitch = this.illustrated ? 0.5 : 0.12;
    this.camera = this.illustrated
      ? new T.OrthographicCamera(-20, 20, 12, -12, 0.1, 300)
      : new T.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 250);
    this.updateFrustum();
    this.nodes = [];
    this.foes = new Map();
    this.projectileMeshes = new Map();
    this.effects = [];
    this.moving = false;
    this.scene.add(new T.HemisphereLight(0xb9cee9, 0x445b50, 1.65));
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
    this.createTerrain();
    if (this.illustrated) Object.assign(this, this.art.sanctuary());
    else {
      this.createSanctuary();
      this.art.sanctuary();
    }
    this.createScenery();
    this.createNodes();
    this.character = this.avatar(HEROES.find((h) => h.id === state.hero));
    this.scene.add(this.character);
    this.createEnemies();
    this.applyVisualSettings(visuals);
    this.camera.position.set(0, 7, 16);
    this.resize = () => {
      this.updateFrustum();
      this.renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener("resize", this.resize);
  }
  updateFrustum() {
    if (this.illustrated) {
      const height = this.distance * 0.72,
        aspect = innerWidth / innerHeight;
      this.camera.left = -height * aspect;
      this.camera.right = height * aspect;
      this.camera.top = height;
      this.camera.bottom = -height;
    } else this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  createTerrain() {
    const plane = new T.PlaneGeometry(320, 320, 100, 100);
    plane.rotateX(-Math.PI / 2);
    const positions = plane.attributes.position,
      colors = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i);
      positions.setY(i, ground(x, z, this.state.realm) - 0.08);
      const c = color(this.realm.color);
      const path = Math.abs(x + Math.sin(z * 0.03) * 3) < 3.7;
      const plaza = Math.hypot(x, z) < 10;
      if (plaza) c.set(0xa2a5a0);
      else if (path) c.set(0xb9b7a0);
      else
        c.multiplyScalar(
          0.88 + roll(this.state.seed, Math.round(x), Math.round(z)) * 0.18,
        );
      colors.push(c.r, c.g, c.b);
    }
    plane.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    const terrain = new T.Mesh(
      plane,
      this.illustrated
        ? this.art.groundMaterial()
        : new T.MeshStandardMaterial({
            vertexColors: true,
            roughness: 1,
            map: this.art.groundTexture(),
          }),
    );
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.art.water();
    this.art.sky();
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
    return this.art.avatar(hero);
  }
  createScenery() {
    this.art.landscape();
  }
  applyVisualSettings(settings) {
    this.visuals = { ...settings };
    const preset = GRAPHICS[settings.quality] || GRAPHICS.balanced;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, preset.pixelRatio));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = this.sun.castShadow = !!preset.shadow;
    if (this.sun.shadow.mapSize.x !== preset.shadow && this.sun.shadow.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
    this.sun.shadow.mapSize.set(preset.shadow || 512, preset.shadow || 512);
    this.art.quality(settings);
    this.canvas.dataset.artStyle = this.illustrated ? "illustrated" : "model";
    this.canvas.dataset.quality = settings.quality;
    this.canvas.dataset.shadows = String(!!preset.shadow);
    document.body.classList.toggle("reduced-motion", settings.reducedMotion);
  }
  createNodes() {
    const definitions = [
      { kind: "ore", x: -7, z: 1 },
      { kind: "tree", x: -7, z: 7 },
      { kind: "herb", x: 6, z: 5 },
      { kind: "fish", x: 25, z: 6 },
    ];
    for (let i = 0; i < 50; i++) {
      let x = roll(this.state.seed, i, 41) * 170 - 85,
        z = roll(this.state.seed, i, 42) * 170 - 85;
      if (Math.hypot(x, z) < 15) continue;
      definitions.push({
        kind: ["ore", "tree", "herb", "fish"][i % 4],
        x: i % 4 === 3 ? 25 : x,
        z,
      });
    }
    definitions.forEach((d, index) => {
      const id = this.state.realm + "-node-" + index,
        g = new T.Group(),
        y = ground(d.x, d.z, this.state.realm);
      g.position.set(d.x, y, d.z);
      if (this.illustrated && d.kind !== "fish")
        g.add(this.art.resource(d.kind));
      else if (d.kind === "ore") {
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
      } else if (d.kind === "herb") {
        for (let i = 0; i < 5; i++) {
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
            0xd0b6f2,
            Math.sin(i) * 0.3,
            0.6,
            Math.cos(i) * 0.3,
            0.16,
          );
        }
      } else if (d.kind === "tree") {
        mesh(g, "cylinder", 0x8b7565, 0, 0.7, 0, 0.22, 1.4, 6);
        const leaf = mesh(g, "sphere", 0x7aa88d, 0, 2.1, 0, 1.3);
        leaf.scale.y = 1.2;
      } else {
        const ring = new T.Mesh(
          new T.TorusGeometry(0.6, 0.03, 4, 24),
          new T.MeshBasicMaterial({ color: 0xc0f2fa }),
        );
        ring.rotation.x = -Math.PI / 2;
        g.add(ring);
        mesh(g, "sphere", 0xbde8ee, 0, 0.3, 0, 0.1);
      }
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
      this.nodes.push({ ...d, id, mesh: g, glow });
    });
  }
  createEnemies() {
    const points = [
      [1, -18],
      [-10, -24],
      [12, -23],
      [-18, -37],
      [14, -42],
      [-6, -55],
      [24, -60],
      [-27, -61],
      [5, -75],
      [34, -28],
    ];
    points.forEach(([x, z], i) =>
      this.sim.spawn(
        this.state.realm + "-hollow-" + i,
        x,
        z,
        false,
        ["stalker", "sentinel", "archer", "oracle"][i % 4],
      ),
    );
    this.sim.spawn(this.state.realm + "-warden", 0, -48, true);
    this.sim.spawn(this.state.realm + "-training", -4, -3, false, "training");
    for (const e of this.sim.enemies) {
      const g = this.illustrated ? this.art.enemy(e) : new T.Group();
      if (!this.illustrated) {
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
        if (e.training) {
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
      if (this.illustrated && e.boss) g.scale.setScalar(1.7);
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
    this.scene.add(this.character);
  }
  nearestNode() {
    let nearest = null,
      distance = 4;
    for (const node of this.nodes) {
      if (this.state.depleted[node.id] > Date.now()) continue;
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
      x: ((v.x + 1) / 2) * innerWidth,
      y: ((-v.y + 1) / 2) * innerHeight,
      visible: v.z < 1,
    };
  }
  skillFX(event) {
    this.character.userData.attack = 0.35;
    if (event.projectile) return;
    const g = new T.Group();
    g.position.set(
      event.x,
      ground(event.x, event.z, this.state.realm) + 0.3,
      event.z,
    );
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
    g.position.set(
      event.x,
      ground(event.x, event.z, this.state.realm) + 1.25,
      event.z,
    );
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
    const p = this.sim.player,
      c = this.character,
      terrainY = ground(p.x, p.z, this.state.realm);
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
    const weapon = HEROES.find((h) => h.id === this.state.hero).weapon;
    if (c.userData.attack > 0 && weapon === "bow") {
      c.arms[0].rotation.x = -1.3;
      c.arms[1].rotation.x = -1.1;
    }
    if (c.userData.attack > 0 && weapon === "staff")
      c.arms[1].rotation.x = -1.4;
    c.userData.facing = p.facing;
    c.userData.cameraYaw = this.yaw;
    this.art.animateAvatar(
      c,
      stride,
      animationTime,
      this.moving,
      this.visuals.reducedMotion,
    );
    c.rotation.z = p.dodge > 0 ? 0.22 : 0;
    this.art.update(time, this.visuals.reducedMotion);
    this.sun.position.set(p.x - 30, terrainY + 48, p.z - 22);
    this.sun.target.position.set(p.x, terrainY, p.z);
    this.sun.target.updateMatrixWorld();
    const target = new T.Vector3(
      p.x,
      terrainY + (this.illustrated ? 0.7 : 1.4),
      p.z,
    );
    if (this.illustrated) this.updateFrustum();
    const offset = new T.Vector3(
      Math.sin(this.yaw) * this.distance,
      this.illustrated
        ? this.distance * (0.7 + this.pitch * 0.3)
        : 1.8 + this.pitch * 4,
      Math.cos(this.yaw) * this.distance,
    );
    this.camera.position.lerp(
      target.clone().add(offset),
      1 - Math.exp(-9 * dt),
    );
    this.camera.lookAt(target);
    if (this.gateRing)
      this.gateRing.rotation.z += this.visuals.reducedMotion ? 0 : dt * 0.22;
    if (this.gateCrystal)
      this.gateCrystal.position.y = 2.8 + Math.sin(animationTime) * 0.14;
    this.npc.rotation.y = Math.atan2(p.x - 6, p.z + 1);
    for (const node of this.nodes) {
      node.mesh.visible = !(this.state.depleted[node.id] > Date.now());
      node.glow.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;
    }
    for (const e of this.sim.enemies) {
      const v = this.foes.get(e.id);
      v.mesh.visible = e.hp > 0;
      v.mesh.position.set(
        e.x,
        ground(e.x, e.z, this.state.realm) +
          (e.boss ? 0 : 0.06 * Math.sin(time * 3)),
        e.z,
      );
      v.mesh.rotation.y = Math.atan2(p.x - e.x, p.z - e.z);
      const aimed = e.move === "eruption",
        tx = aimed ? e.aimX : e.x,
        tz = aimed ? e.aimZ : e.z;
      v.telegraph.position.set(tx, ground(tx, tz, this.state.realm) + 0.08, tz);
      v.telegraph.visible =
        e.phase === "windup" && e.hp > 0 && e.move !== "arrow";
      v.telegraph.scale.setScalar(aimed ? 3.5 / 3.3 : 1);
      v.telegraph.material.opacity =
        0.15 + (1 - e.timer / (e.windupDuration || 1)) * 0.45;
      v.aim.visible = e.phase === "windup" && e.move === "arrow" && e.hp > 0;
      if (v.aim.visible) {
        const d = Math.hypot(e.aimX - e.x, e.aimZ - e.z);
        v.aim.position.set(
          (e.x + e.aimX) / 2,
          ground(e.x, e.z, this.state.realm) + 0.1,
          (e.z + e.aimZ) / 2,
        );
        v.aim.scale.z = d;
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
      g.position.set(
        shot.x,
        ground(shot.x, shot.z, this.state.realm) + 1.35,
        shot.z,
      );
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
    const shared = new Set(this.art.geometries.values());
    object.traverse((o) => {
      if (o.geometry && !o.isSprite && !shared.has(o.geometry))
        o.geometry.dispose();
      if (o.userData.ownedTexture) {
        o.material.map.dispose();
        this.art.textures.delete(o.material.map);
      }
      if (o.material && ![...this.art.materials.values()].includes(o.material))
        o.material.dispose();
    });
  }
  dispose() {
    removeEventListener("resize", this.resize);
    const geometrySet = new Set(),
      materialSet = new Set();
    this.scene.traverse((o) => {
      if (o.geometry && !o.isSprite) geometrySet.add(o.geometry);
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          materialSet.add(m);
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
