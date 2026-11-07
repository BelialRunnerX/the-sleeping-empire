import * as T from "../vendor/three.module.js";
import { hash, roll } from "./simulation.mjs";
import { HEROES, REALMS } from "./content.mjs";
const color = (hex) => new T.Color(hex);
export function ground(x, z, realm = "bastion") {
  if (Math.hypot(x, z) < 13) return 0;
  const hill =
    (Math.sin(x * 0.028) * Math.cos(z * 0.035) * 2 +
      Math.sin(z * 0.08 + x * 0.02) * 0.7) *
    Math.min(1, (Math.hypot(x, z) - 13) / 20);
  return realm === "moon" ? hill * 0.6 : hill;
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
  m.position.set(x, y, z);
  group.add(m);
  return m;
}
export class WorldView {
  constructor(canvas, state, sim) {
    this.canvas = canvas;
    this.state = state;
    this.sim = sim;
    this.scene = new T.Scene();
    const realm = REALMS.find((r) => r.id === state.realm) || REALMS[0];
    this.realm = realm;
    this.scene.background = color(realm.sky);
    this.scene.fog = new T.Fog(realm.sky, 48, 160);
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.camera = new T.PerspectiveCamera(
      52,
      innerWidth / innerHeight,
      0.1,
      250,
    );
    this.yaw = 0;
    this.pitch = 0.12;
    this.distance = 9;
    this.nodes = [];
    this.foes = new Map();
    this.effects = [];
    this.moving = false;
    this.scene.add(new T.HemisphereLight(0xf1efff, 0x344d46, 2.6));
    const sun = new T.DirectionalLight(0xffebd7, 3.2);
    sun.position.set(-35, 70, 30);
    this.scene.add(sun);
    this.createTerrain();
    this.createSanctuary();
    this.createScenery();
    this.createNodes();
    this.character = this.avatar(HEROES.find((h) => h.id === state.hero));
    this.scene.add(this.character);
    this.createEnemies();
    this.camera.position.set(0, 7, 16);
    this.resize = () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener("resize", this.resize);
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
      new T.MeshToonMaterial({ vertexColors: true }),
    );
    this.scene.add(terrain);
    const water = new T.Mesh(
      new T.PlaneGeometry(11, 250),
      new T.MeshPhongMaterial({
        color: this.state.realm === "cinder" ? 0xeb7540 : 0x66b7c6,
        transparent: true,
        opacity: 0.8,
        shininess: 80,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(30, -0.15, -10);
    this.scene.add(water);
    this.water = water;
    for (let i = 0; i < 7; i++) {
      const mountain = new T.Mesh(
        new T.ConeGeometry(22 + roll(9, i, 1) * 18, 42 + roll(9, i, 2) * 25, 5),
        mat(0x748d91),
      );
      mountain.position.set((i - 3) * 47, -6, -135 - Math.abs(i - 3) * 6);
      this.scene.add(mountain);
    }
    const moon = new T.Mesh(
      new T.SphereGeometry(7, 24, 16),
      new T.MeshBasicMaterial({ color: 0xf6e8df }),
    );
    moon.position.set(65, 65, -110);
    this.scene.add(moon);
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
    const g = new T.Group();
    g.position.set(x, 0, z);
    this.scene.add(g);
    mesh(g, "box", wall, 0, 2, 0, 5, 4, 5);
    const r = mesh(g, "cone", roof, 0, 5.2, 0, 4.5, 3.4, 4);
    r.rotation.y = Math.PI / 4;
    mesh(g, "box", 0x414557, 0, 1.2, 2.52, 1.2, 2.4, 0.08);
    for (const a of [-1.6, 1.6])
      mesh(g, "box", 0xdbc9a0, a, 2.3, 2.53, 0.7, 0.9, 0.08);
  }
  avatar(hero) {
    const g = new T.Group(),
      skin = 0xf8ddcb,
      hair = hero.color || "#ccc3ee",
      coat = hero.coat || "#536071";
    const body = mesh(g, "cone", coat, 0, 1.13, 0, 0.39, 0.83, 6);
    body.rotation.z = Math.PI;
    mesh(g, "box", 0xe8dfcf, 0, 1.25, 0.22, 0.22, 0.45, 0.07);
    mesh(g, "cylinder", 0xd1b77e, 0, 0.83, 0, 0.29, 0.09, 10);
    const head = mesh(g, "sphere", skin, 0, 1.91, 0, 0.32);
    head.scale.set(0.92, 1.09, 0.9);
    const cap = mesh(g, "sphere", hair, 0, 2.05, -0.035, 0.34);
    cap.scale.set(1, 0.85, 1);
    for (let i = 0; i < 6; i++) {
      const bang = mesh(
        g,
        "cone",
        hair,
        (i - 2.5) * 0.095,
        1.99,
        0.25,
        0.09,
        0.32,
        3,
      );
      bang.rotation.z = 0.2 + (i - 2) * 0.12;
    }
    for (const x of [-0.115, 0.115]) {
      mesh(g, "sphere", 0xffffff, x, 1.92, 0.27, 0.065).scale.set(1, 1.3, 0.3);
      mesh(g, "sphere", 0x637a9f, x, 1.92, 0.29, 0.034).scale.set(1, 1.5, 0.3);
    }
    const cape = mesh(g, "cone", coat, 0, 1.1, -0.2, 0.42, 1.15, 4);
    cape.rotation.x = -0.15;
    cape.scale.z = 0.4;
    g.legs = [];
    g.arms = [];
    for (const sign of [-1, 1]) {
      const leg = new T.Group();
      leg.position.set(sign * 0.15, 0.8, 0);
      mesh(leg, "box", 0x283b4b, 0, -0.3, 0, 0.18, 0.65, 0.2);
      mesh(leg, "box", 0x2e293a, 0, -0.65, 0.07, 0.22, 0.22, 0.32);
      g.add(leg);
      g.legs.push(leg);
      const arm = new T.Group();
      arm.position.set(sign * 0.35, 1.52, 0);
      mesh(arm, "cylinder", coat, 0, -0.19, 0, 0.105, 0.4, 8);
      mesh(arm, "sphere", skin, 0, -0.43, 0, 0.105);
      g.add(arm);
      g.arms.push(arm);
    }
    const weapon = new T.Group();
    g.arms[1].add(weapon);
    weapon.position.set(0, -0.5, 0);
    if (hero.weapon === "staff") {
      mesh(weapon, "cylinder", 0xa7a1b3, 0, 0.1, 0, 0.035, 1.9, 6);
      const orb = mesh(weapon, "sphere", 0xcab5f3, 0, 1.2, 0, 0.18);
      orb.material = mat(0xc3abff, 0.6);
    } else if (hero.weapon === "bow") {
      const b = new T.Mesh(
        new T.TorusGeometry(0.5, 0.035, 6, 24, Math.PI),
        mat(0xc7aa75),
      );
      b.rotation.z = Math.PI / 2;
      weapon.add(b);
    } else {
      mesh(weapon, "box", 0xd8e4eb, 0, -0.35, 0.15, 0.12, 1.1, 0.055);
      mesh(weapon, "box", 0xcda869, 0, 0.15, 0.15, 0.4, 0.07, 0.08);
    }
    const shadow = new T.Mesh(
      new T.CircleGeometry(0.65, 20),
      new T.MeshBasicMaterial({
        color: 0x17272d,
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.035;
    g.add(shadow);
    g.userData = { attack: 0 };
    return g;
  }
  createScenery() {
    const trunkGeo = new T.CylinderGeometry(0.18, 0.3, 2.8, 5),
      leafGeo = new T.IcosahedronGeometry(2, 0),
      trunks = new T.InstancedMesh(trunkGeo, mat(0x605e5d), 150),
      leaves = new T.InstancedMesh(
        leafGeo,
        mat(
          this.state.realm === "bastion"
            ? 0x5d8b75
            : this.state.realm === "moon"
              ? 0x81769e
              : 0x9ba6b8,
        ),
        150,
      ),
      dummy = new T.Object3D();
    let count = 0;
    for (let i = 0; i < 250; i++) {
      const x = roll(this.state.seed, i, 22) * 220 - 110,
        z = roll(this.state.seed, i, 23) * 220 - 110;
      if (
        Math.abs(x) < 8 ||
        Math.hypot(x, z) < 18 ||
        Math.abs(x - 30) < 9 ||
        count >= 150
      )
        continue;
      const y = ground(x, z, this.state.realm),
        scale = 0.8 + roll(1, i, 5) * 0.8;
      dummy.position.set(x, y + 1.4 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(count, dummy.matrix);
      dummy.position.y = y + 4 * scale;
      dummy.scale.set(scale * 1.2, scale, scale);
      dummy.updateMatrix();
      leaves.setMatrixAt(count, dummy.matrix);
      count++;
    }
    trunks.count = leaves.count = count;
    this.scene.add(trunks, leaves);
    for (let i = 0; i < 22; i++) {
      const x = roll(this.state.seed, i, 30) * 140 - 70,
        z = roll(this.state.seed, i, 31) * 140 - 70;
      if (Math.hypot(x, z) < 18) continue;
      const rock = mesh(
        this.scene,
        "sphere",
        0x7e858d,
        x,
        ground(x, z, this.state.realm),
        z,
        1,
      );
      rock.scale.set(1.2 + roll(1, i, 1) * 2, 0.6 + roll(1, i, 2), 1.2);
    }
    const ruins = new T.Group();
    ruins.position.set(0, ground(0, -49, this.state.realm), -49);
    this.scene.add(ruins);
    for (const x of [-9, 9]) {
      mesh(ruins, "cylinder", 0x88939a, x, 2.5, 0, 0.65, 5, 8);
      mesh(ruins, "box", 0xb0a99f, x, 5, 0, 1.6, 0.35, 1.6);
    }
    mesh(ruins, "box", 0x91959a, 0, 0.2, 0, 22, 0.4, 16);
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
      if (d.kind === "ore") {
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
      this.sim.spawn(this.state.realm + "-hollow-" + i, x, z),
    );
    this.sim.spawn(this.state.realm + "-warden", 0, -48, true);
    for (const e of this.sim.enemies) {
      const g = new T.Group();
      const dark = e.boss ? 0x454866 : 0x666379,
        glow = e.boss ? 0xe5b76b : 0xc6a3ed;
      mesh(g, "cone", dark, 0, 1.05, 0, 0.55, 1.8, 6);
      mesh(g, "sphere", dark, 0, 2, 0, 0.4);
      for (const x of [-0.16, 0.16]) {
        const eye = mesh(g, "sphere", glow, x, 2.04, 0.36, 0.065);
        eye.material = mat(glow, 1);
      }
      for (const x of [-0.5, 0.5])
        mesh(g, "cone", dark, x, 1.3, 0, 0.2, 1.3, 4);
      const crown = mesh(g, "cone", glow, 0, 2.65, 0, 0.27, 0.6, 4);
      crown.material = mat(glow, 0.3);
      if (e.boss) g.scale.setScalar(1.7);
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
      this.scene.add(telegraph);
      this.scene.add(g);
      this.foes.set(e.id, { mesh: g, telegraph });
    }
  }
  setHero() {
    this.scene.remove(this.character);
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
    const g = new T.Group();
    g.position.set(
      event.x,
      ground(event.x, event.z, this.state.realm) + 0.3,
      event.z,
    );
    const c = event.id === "strike" ? 0xffdcad : 0xc7b1ff;
    const ring = new T.Mesh(
      new T.TorusGeometry(
        event.id === "strike" ? 2 : event.radius,
        0.06,
        5,
        64,
        event.id === "strike" ? Math.PI * 1.3 : Math.PI * 2,
      ),
      new T.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);
    if (event.id === "lance") {
      const beam = new T.Mesh(
        new T.ConeGeometry(0.3, 12, 6),
        new T.MeshBasicMaterial({
          color: 0xc4dbff,
          transparent: true,
          opacity: 0.7,
        }),
      );
      beam.rotation.x = Math.PI / 2;
      beam.position.z = 6;
      g.add(beam);
    }
    g.rotation.y = event.facing;
    this.scene.add(g);
    this.effects.push({ mesh: g, life: 0.5, max: 0.5 });
    this.character.userData.attack = 0.35;
  }
  update(dt, input, time) {
    const p = this.sim.player,
      c = this.character,
      terrainY = ground(p.x, p.z, this.state.realm);
    c.position.set(p.x, terrainY + p.y, p.z);
    c.rotation.y = p.facing;
    this.moving = !!(input.x || input.z);
    const stride = this.moving
      ? Math.sin(time * 12) * 0.5
      : Math.sin(time * 2) * 0.035;
    c.legs[0].rotation.x = stride;
    c.legs[1].rotation.x = -stride;
    c.arms[0].rotation.x = -stride * 0.6;
    c.userData.attack = Math.max(0, c.userData.attack - dt);
    c.arms[1].rotation.x =
      c.userData.attack > 0
        ? -1.4 + Math.sin(c.userData.attack * 14) * 1.6
        : stride * 0.6;
    c.rotation.z = p.dodge > 0 ? 0.22 : 0;
    const target = new T.Vector3(p.x, terrainY + 1.4, p.z);
    const offset = new T.Vector3(
      Math.sin(this.yaw) * this.distance,
      1.8 + this.pitch * 4,
      Math.cos(this.yaw) * this.distance,
    );
    this.camera.position.lerp(
      target.clone().add(offset),
      1 - Math.exp(-9 * dt),
    );
    this.camera.lookAt(target);
    this.gateRing.rotation.z += dt * 0.22;
    this.gateCrystal.position.y = 2.8 + Math.sin(time) * 0.14;
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
      v.telegraph.position.set(
        e.x,
        ground(e.x, e.z, this.state.realm) + 0.08,
        e.z,
      );
      v.telegraph.visible = e.phase === "windup" && e.hp > 0;
      v.telegraph.material.opacity = 0.15 + (0.8 - e.timer) * 0.3;
    }
    this.effects = this.effects.filter((e) => {
      e.life -= dt;
      e.mesh.scale.multiplyScalar(1 + dt * 0.6);
      for (const child of e.mesh.children)
        child.material.opacity = Math.max(0, e.life / e.max);
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
  dispose() {
    removeEventListener("resize", this.resize);
    const geometrySet = new Set(),
      materialSet = new Set();
    this.scene.traverse((o) => {
      if (o.geometry) geometrySet.add(o.geometry);
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          materialSet.add(m);
    });
    for (const g of geometrySet) g.dispose();
    for (const m of materialSet) m.dispose();
    this.renderer.dispose();
  }
}
