import * as T from "../vendor/three.module.js";

// Original, code-authored art. No downloaded models, textures or hidden CDN assets.
const PALETTES = {
  bastion: {
    zenith: "#536fa1",
    horizon: "#f1cfb0",
    mist: "#adbfc0",
    grass: "#8ba27a",
    leaf: "#477b69",
    blossom: "#d897ad",
    water: "#3c919d",
  },
  moon: {
    zenith: "#1b214f",
    horizon: "#8a83a7",
    mist: "#777c9e",
    grass: "#72728f",
    leaf: "#8b80ac",
    blossom: "#b6b8e2",
    water: "#626fb2",
  },
  cinder: {
    zenith: "#48324d",
    horizon: "#df9470",
    mist: "#b08583",
    grass: "#786064",
    leaf: "#975e63",
    blossom: "#e0a26a",
    water: "#bd663f",
  },
  frost: {
    zenith: "#4d739d",
    horizon: "#cee4e6",
    mist: "#b0cad3",
    grass: "#93b3b9",
    leaf: "#66929d",
    blossom: "#d2dfed",
    water: "#568fba",
  },
};
export const GRAPHICS = {
  low: {
    label: "Performance",
    pixelRatio: 1,
    shadow: 0,
    grass: 600,
    particles: 36,
  },
  balanced: {
    label: "Balanced",
    pixelRatio: 1.5,
    shadow: 1024,
    grass: 2400,
    particles: 90,
  },
  high: {
    label: "High fidelity",
    pixelRatio: 2,
    shadow: 2048,
    grass: 4800,
    particles: 150,
  },
};
export function readVisualSettings(storage, small = false, reduced = false) {
  try {
    const saved = JSON.parse(
      storage.getItem("astral_empire_visuals_v1") || "{}",
    );
    return {
      quality: GRAPHICS[saved.quality]
        ? saved.quality
        : small
          ? "low"
          : "balanced",
      reducedMotion:
        typeof saved.reducedMotion === "boolean"
          ? saved.reducedMotion
          : reduced,
    };
  } catch {
    return { quality: small ? "low" : "balanced", reducedMotion: reduced };
  }
}

export class ArtDirector {
  constructor(scene, realm, seed, ground, random) {
    Object.assign(this, { scene, realm, seed, ground, random });
    this.palette = PALETTES[realm] || PALETTES.bastion;
    this.materials = new Map();
    this.geometries = new Map();
    this.textures = new Set();
    this.wind = { value: 0 };
    this.ramp = new T.DataTexture(
      new Uint8Array([70, 125, 193, 250]),
      4,
      1,
      T.RedFormat,
    );
    this.ramp.minFilter = this.ramp.magFilter = T.NearestFilter;
    this.ramp.needsUpdate = true;
    this.textures.add(this.ramp);
  }
  material(c, glow = 0) {
    const key = c + ":" + glow;
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new T.MeshToonMaterial({
          color: c,
          gradientMap: this.ramp,
          emissive: c,
          emissiveIntensity: glow,
        }),
      );
    return this.materials.get(key);
  }
  shape(group, kind, c, x, y, z, sx = 1, sy = 1, sz = 1) {
    if (!this.geometries.has(kind))
      this.geometries.set(
        kind,
        kind === "orb"
          ? new T.SphereGeometry(1, 16, 12)
          : kind === "gem"
            ? new T.IcosahedronGeometry(1, 0)
            : kind === "cone"
              ? new T.ConeGeometry(1, 1, 8)
              : kind === "tube"
                ? new T.CylinderGeometry(1, 1, 1, 12)
                : new T.BoxGeometry(1, 1, 1),
      );
    const m = new T.Mesh(this.geometries.get(kind), this.material(c));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  }
  outline(m, scale = 1.035) {
    const shell = new T.Mesh(
      m.geometry,
      new T.MeshBasicMaterial({ color: 0x252c40, side: T.BackSide }),
    );
    shell.scale.setScalar(scale);
    m.add(shell);
  }
  ring(group, radius, width, c, y = 0, vertical = false) {
    const m = new T.Mesh(
      new T.TorusGeometry(radius, width, 6, 64),
      this.material(c, 0.2),
    );
    m.position.y = y;
    if (!vertical) m.rotation.x = -Math.PI / 2;
    group.add(m);
    return m;
  }
  stoneTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#c9c2ab";
    ctx.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++)
      for (let col = -1; col < 5; col++) {
        const x = col * 64 + (row % 2) * 32,
          y = row * 32;
        ctx.fillStyle = ["#b8b5a8", "#d1cab6", "#c2c0b2", "#bfc1b5"][
          (row * 7 + col + 9) % 4
        ];
        ctx.fillRect(x + 1, y + 1, 62, 30);
        ctx.strokeStyle = "#ddd7c0";
        ctx.strokeRect(x + 3, y + 3, 58, 26);
      }
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(5, 5);
    texture.colorSpace = T.SRGBColorSpace;
    this.textures.add(texture);
    return texture;
  }
  groundTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#d9d9c9";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2200; i++) {
      const x = this.random(39, i, 1) * 256,
        y = this.random(39, i, 2) * 256;
      ctx.fillStyle = i % 3 ? "#b9bfab35" : "#f1e9c343";
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        1 + this.random(39, i, 3) * 4,
        0.6 + this.random(39, i, 4) * 1.2,
        i,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(42, 42);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.add(texture);
    return texture;
  }
  sky() {
    const p = this.palette;
    const sky = new T.Mesh(
      new T.SphereGeometry(220, 32, 20),
      new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new T.Color(p.zenith) },
          bottom: { value: new T.Color(p.horizon) },
        },
        vertexShader:
          "varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `varying vec3 vSky; uniform vec3 top; uniform vec3 bottom;
        void main(){float h=normalize(vSky).y; vec3 c=mix(bottom,top,smoothstep(-.04,.25,h));
          float cloud=sin(vSky.x*.028+sin(vSky.z*.035)*2.)*.5+.5;
          cloud*=smoothstep(.03,.17,h)*(1.-smoothstep(.19,.44,h));
          c=mix(c,vec3(.95,.87,.82),cloud*.27);gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      }),
    );
    this.scene.add(sky);
    const sun = this.shape(this.scene, "orb", 0xffe9c4, -70, 47, -130, 6, 6, 6);
    sun.material = new T.MeshBasicMaterial({ color: 0xffe7bd });
    sun.castShadow = false;
    // Layered ridgelines sit outside the playable region and create a distant horizon.
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < 13; i++) {
        const a = (i / 13) * Math.PI * 2,
          radius = 145 + layer * 20;
        const peak = this.shape(
          this.scene,
          "cone",
          [0x71868e, 0x8897a0, 0xa5acb5][layer],
          Math.sin(a) * radius,
          4 + layer * 3,
          Math.cos(a) * radius,
          18 + this.random(8, i, 3) * 12,
          35 + this.random(8, i, 4) * 35,
          18 + this.random(8, i, 5) * 15,
        );
        const ridge = new T.ConeGeometry(1, 1, 12, 5);
        const vertices = ridge.attributes.position;
        for (let v = 0; v < vertices.count; v++) {
          const x = vertices.getX(v),
            y = vertices.getY(v),
            z = vertices.getZ(v);
          const noise = Math.sin(x * 17 + z * 13 + y * 33 + i) * 0.16;
          vertices.setXYZ(
            v,
            x * (1 + noise),
            y + Math.sin(x * 9 + z * 11 + i) * 0.04 * (0.5 - y),
            z * (1 + noise),
          );
        }
        ridge.computeVertexNormals();
        peak.geometry = ridge;
        peak.rotation.y = i * 2.4;
        peak.castShadow = false;
      }
  }
  avatar(hero) {
    const g = new T.Group(),
      coat = hero.coat || "#536c7b",
      hair = hero.color || "#d1c2ec",
      skin = 0xf4d3bf,
      gold = 0xd9bc7c,
      dark = 0x253345;
    // A lightweight joint hierarchy drives hips, knees, shoulders and elbows.
    g.legs = [];
    g.arms = [];
    g.knees = [];
    g.elbows = [];
    const torso = this.shape(g, "orb", coat, 0, 1.55, 0, 0.32, 0.47, 0.21);
    this.outline(torso);
    this.shape(g, "box", 0xe8e0ce, 0, 1.65, 0.19, 0.26, 0.52, 0.035);
    for (const s of [-1, 1]) {
      const lapel = this.shape(
        g,
        "box",
        coat,
        s * 0.14,
        1.7,
        0.23,
        0.12,
        0.51,
        0.05,
      );
      lapel.rotation.z = s * -0.2;
      const trim = this.shape(
        g,
        "box",
        gold,
        s * 0.21,
        1.57,
        0.22,
        0.025,
        0.49,
        0.025,
      );
      trim.rotation.z = s * -0.12;
      const tail = this.shape(
        g,
        "cone",
        coat,
        s * 0.22,
        1.02,
        -0.04,
        0.29,
        0.66,
        0.22,
      );
      tail.rotation.z = s * -0.14;
      const leg = new T.Group();
      leg.position.set(s * 0.17, 1.15, 0);
      g.add(leg);
      g.legs.push(leg);
      this.shape(leg, "orb", dark, 0, -0.21, 0, 0.12, 0.29, 0.13);
      const knee = new T.Group();
      knee.position.y = -0.48;
      leg.add(knee);
      g.knees.push(knee);
      this.shape(knee, "tube", 0x343346, 0, -0.24, 0, 0.12, 0.48, 0.12);
      this.shape(knee, "box", gold, 0, -0.05, 0.11, 0.17, 0.07, 0.04);
      this.shape(knee, "box", 0x262637, 0, -0.47, 0.07, 0.25, 0.17, 0.4);
      this.shape(knee, "box", 0xa7a7b2, 0, -0.46, 0.26, 0.24, 0.07, 0.04);
      const arm = new T.Group();
      arm.position.set(s * 0.36, 1.88, 0);
      g.add(arm);
      g.arms.push(arm);
      this.shape(arm, "orb", coat, 0, -0.14, 0, 0.14, 0.24, 0.15);
      const shoulder = this.shape(
        arm,
        "gem",
        0xb4bdc5,
        s * 0.025,
        0.01,
        0,
        0.18,
        0.13,
        0.2,
      );
      shoulder.rotation.z = s * 0.2;
      this.shape(arm, "box", gold, 0, 0.02, 0.17, 0.22, 0.035, 0.04);
      const elbow = new T.Group();
      elbow.position.y = -0.37;
      arm.add(elbow);
      g.elbows.push(elbow);
      this.shape(elbow, "tube", coat, 0, -0.12, 0, 0.095, 0.3, 0.095);
      this.shape(elbow, "tube", gold, 0, -0.25, 0, 0.105, 0.06, 0.105);
      this.shape(elbow, "orb", skin, 0, -0.35, 0.01, 0.085, 0.115, 0.08);
    }
    this.shape(g, "tube", 0x343445, 0, 1.23, 0, 0.32, 0.12, 0.22);
    this.shape(g, "gem", gold, 0, 1.23, 0.24, 0.1, 0.1, 0.04);
    this.shape(g, "tube", skin, 0, 2.03, 0, 0.1, 0.2, 0.1);
    const head = this.shape(g, "orb", skin, 0, 2.28, 0.015, 0.285, 0.34, 0.26);
    this.outline(head, 1.02);
    // Hair cap, overlapping swept locks, side strands and a rear tied section.
    const cap = this.shape(g, "orb", hair, 0, 2.44, -0.055, 0.31, 0.24, 0.29);
    this.outline(cap);
    for (let i = 0; i < 9; i++) {
      const lock = this.shape(
        g,
        "cone",
        hair,
        (i - 4) * 0.055,
        2.4 + Math.abs(i - 4) * 0.008,
        0.23,
        0.065,
        0.29 + (i % 3) * 0.03,
        0.07,
      );
      lock.rotation.z = Math.PI + (i - 4) * -0.075;
      lock.rotation.x = -0.2;
    }
    for (const s of [-1, 1]) {
      const strand = this.shape(
        g,
        "cone",
        hair,
        s * 0.27,
        2.24,
        -0.02,
        0.09,
        0.43,
        0.12,
      );
      strand.rotation.z = Math.PI + s * 0.12;
      // Almond-shaped eyes, iris, pupil, upper lash and specular glint.
      this.shape(
        g,
        "orb",
        0xfff9f0,
        s * 0.108,
        2.285,
        0.254,
        0.081,
        0.058,
        0.018,
      );
      this.shape(
        g,
        "orb",
        hero.weapon === "staff" ? 0x8e69bd : 0x4196a7,
        s * 0.108,
        2.282,
        0.272,
        0.037,
        0.051,
        0.009,
      );
      this.shape(
        g,
        "orb",
        0x29334c,
        s * 0.108,
        2.286,
        0.281,
        0.016,
        0.033,
        0.004,
      );
      this.shape(
        g,
        "orb",
        0xffffff,
        s * 0.108 - 0.009,
        2.303,
        0.286,
        0.012,
        0.014,
        0.003,
      );
      const lash = this.shape(
        g,
        "box",
        0x493c51,
        s * 0.108,
        2.337,
        0.265,
        0.13,
        0.015,
        0.018,
      );
      lash.rotation.z = s * -0.08;
    }
    this.shape(g, "orb", 0xd8a292, 0, 2.15, 0.249, 0.034, 0.009, 0.007);
    this.shape(g, "gem", gold, 0, 1.89, 0.23, 0.07, 0.1, 0.04);
    if (hero.weapon !== "blade") {
      const pony = this.shape(
        g,
        "orb",
        hair,
        0.1,
        2.13,
        -0.3,
        0.18,
        0.49,
        0.16,
      );
      pony.rotation.x = -0.2;
      this.shape(g, "tube", gold, 0.1, 2.38, -0.3, 0.19, 0.05, 0.16);
    }
    const capeGeometry = new T.PlaneGeometry(0.72, 0.99, 6, 10);
    const cape = new T.Mesh(
      capeGeometry,
      new T.MeshToonMaterial({
        color: coat,
        gradientMap: this.ramp,
        side: T.DoubleSide,
      }),
    );
    cape.position.set(0, 1.36, -0.26);
    cape.rotation.x = 0.08;
    cape.castShadow = true;
    g.add(cape);
    g.cape = cape;
    // Gold embroidered crest on the back reads clearly from the play camera.
    const crest = this.shape(g, "gem", gold, 0, 1.53, -0.3, 0.12, 0.22, 0.015);
    this.shape(
      g,
      "gem",
      hero.color || "#cbb7ff",
      0,
      1.53,
      -0.32,
      0.055,
      0.12,
      0.01,
    );
    const weapon = new T.Group();
    g.elbows[1].add(weapon);
    weapon.position.y = -0.35;
    if (hero.weapon === "staff") {
      this.shape(weapon, "tube", 0x737e97, 0, 0.1, 0, 0.029, 1.8, 0.029);
      for (const y of [-0.6, -0.2, 0.4, 0.8])
        this.shape(weapon, "tube", gold, 0, y, 0, 0.043, 0.06, 0.043);
      this.ring(weapon, 0.22, 0.035, gold, 1.08, true);
      const crystal = this.shape(
        weapon,
        "gem",
        hair,
        0,
        1.08,
        0,
        0.13,
        0.23,
        0.13,
      );
      crystal.material = this.material(hair, 0.65);
    } else if (hero.weapon === "bow") {
      const curve = new T.EllipseCurve(0, 0, 0.28, 0.64, -0.9, Math.PI + 0.9);
      const points = curve.getPoints(28).map((v) => new T.Vector3(v.x, v.y, 0));
      const bow = new T.Mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 32, 0.04, 6, false),
        this.material(gold),
      );
      bow.rotation.z = -Math.PI / 2;
      weapon.add(bow);
      const string = new T.Line(
        new T.BufferGeometry().setFromPoints([points[0], points.at(-1)]),
        new T.LineBasicMaterial({ color: 0xe5eadf }),
      );
      string.rotation.z = bow.rotation.z;
      weapon.add(string);
    } else {
      const blade = this.shape(
        weapon,
        "gem",
        0xcbdde6,
        0,
        -0.57,
        0.06,
        0.1,
        0.69,
        0.035,
      );
      this.outline(blade, 1.025);
      this.shape(
        weapon,
        "box",
        0xeff6f4,
        -0.027,
        -0.55,
        0.095,
        0.017,
        1,
        0.008,
      );
      this.shape(weapon, "box", gold, 0, 0.04, 0.06, 0.43, 0.07, 0.1);
      this.shape(weapon, "tube", dark, 0, 0.18, 0.06, 0.045, 0.23, 0.045);
      this.shape(weapon, "gem", hair, 0, 0.34, 0.06, 0.07, 0.09, 0.06);
    }
    g.userData = { attack: 0, crest };
    return g;
  }
  animateAvatar(g, stride, time, moving, reduced) {
    g.knees.forEach(
      (k, i) =>
        (k.rotation.x = moving
          ? Math.max(0, i ? stride : -stride) * 0.8
          : 0.03),
    );
    g.elbows[0].rotation.x = -0.12;
    g.elbows[1].rotation.x = g.userData.attack > 0 ? -0.5 : -0.12;
    const a = g.cape.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const t = (0.495 - a.getY(i)) / 0.99;
      a.setZ(
        i,
        -t * 0.13 +
          (reduced
            ? 0
            : Math.sin(time * 3 + a.getX(i) * 5 - t * 3) *
              t *
              (moving ? 0.14 : 0.045)),
      );
    }
    a.needsUpdate = true;
  }
  building(x, z, wall, roof) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    this.scene.add(g);
    this.shape(g, "box", 0x646e77, 0, 0.2, 0, 5.5, 0.4, 5.5);
    this.shape(g, "box", wall, 0, 2, 0, 5, 3.7, 5);
    for (const sx of [-2.35, 2.35])
      for (const sz of [-2.35, 2.35])
        this.shape(g, "box", 0x505360, sx, 2, sz, 0.2, 3.8, 0.2);
    for (const y of [0.5, 3.55])
      this.shape(g, "box", 0xe1cda7, 0, y, 2.54, 5.1, 0.12, 0.12);
    const r = this.shape(g, "cone", roof, 0, 4.7, 0, 4.35, 2.7, 4.35);
    r.geometry = new T.ConeGeometry(1, 1, 4);
    r.rotation.y = Math.PI / 4;
    for (let i = 0; i < 5; i++) {
      const rim = this.shape(
        g,
        "cone",
        roof,
        0,
        3.52 + i * 0.43,
        0,
        4.48 - i * 0.64,
        0.16,
        4.48 - i * 0.64,
      );
      rim.geometry = r.geometry;
      rim.rotation.y = r.rotation.y;
    }
    this.shape(g, "box", 0x343e50, 0, 1.3, 2.55, 1.35, 2.3, 0.12);
    for (const sx of [-1.65, 1.65]) {
      const w = this.shape(g, "box", 0xf4d19b, sx, 2.05, 2.56, 0.8, 1.15, 0.07);
      w.material = this.material(0xf4d19b, 0.24);
      for (const dx of [-0.43, 0, 0.43])
        this.shape(g, "box", 0x535464, sx + dx, 2.05, 2.63, 0.065, 1.3, 0.08);
      this.shape(g, "box", 0x535464, sx, 2.05, 2.63, 0.92, 0.065, 0.08);
      this.shape(g, "box", 0x687e69, sx, 1.38, 2.75, 1.1, 0.2, 0.4);
      for (let i = 0; i < 5; i++)
        this.shape(
          g,
          "orb",
          this.palette.blossom,
          sx - 0.4 + i * 0.2,
          1.58,
          2.8,
          0.15,
          0.13,
          0.14,
        );
    }
    this.shape(g, "box", 0x4c5362, 1.1, 5.4, -0.9, 0.65, 2, 0.65);
    const banner = this.shape(
      g,
      "box",
      0x596581,
      0,
      2.1,
      2.65,
      0.47,
      1.5,
      0.03,
    );
    banner.position.x = -2.5;
    this.shape(g, "gem", 0xe7c889, -2.5, 2.2, 2.69, 0.15, 0.26, 0.02);
  }
  sanctuary() {
    const floor = new T.Mesh(
      new T.CircleGeometry(9.9, 96),
      new T.MeshStandardMaterial({
        map: this.stoneTexture(),
        roughness: 0.93,
        color: 0xf0e9d1,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.09;
    floor.receiveShadow = true;
    this.scene.add(floor);
    for (const r of [4.8, 8.5, 9.8])
      this.ring(this.scene, r, 0.025, 0xd3bd88, 0.1);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tile = this.shape(
        this.scene,
        "gem",
        0xb7a87f,
        Math.sin(a) * 6.9,
        0.105,
        Math.cos(a) * 6.9,
        0.18,
        0.012,
        0.38,
      );
      tile.rotation.y = a;
    }
    const gate = new T.Group();
    gate.position.z = -6;
    this.scene.add(gate);
    for (const s of [-1, 1]) {
      for (const y of [0.6, 4.6, 5.5])
        this.shape(gate, "box", 0xd8c49b, s * 2.4, y, 0, 0.9, 0.13, 1);
      for (const z of [-0.44, 0.44])
        this.shape(gate, "box", 0xb9b6a7, s * 2.4, 2.7, z, 0.18, 3.7, 0.09);
      const wing = this.shape(
        gate,
        "gem",
        0xd5bd85,
        s * 3,
        4.9,
        0,
        0.6,
        0.7,
        0.18,
      );
      wing.rotation.z = s * -0.5;
    }
    this.ring(gate, 2.12, 0.027, 0xc9b6ed, 2.8, true);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rune = this.shape(
        gate,
        "gem",
        0xffe6ad,
        Math.sin(a) * 2.12,
        2.8 + Math.cos(a) * 2.12,
        0.05,
        0.07,
        0.12,
        0.04,
      );
      rune.rotation.z = -a;
      rune.material = this.material(0xffe6ad, 0.5);
    }
    const veil = new T.Mesh(
      new T.CircleGeometry(1.75, 64),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        uniforms: { time: this.wind },
        vertexShader:
          "varying vec2 v;void main(){v=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `varying vec2 v;uniform float time;void main(){float r=length(v);float bands=pow(.5+.5*sin(r*65.-time*1.3+atan(v.y,v.x)*3.),5.);gl_FragColor=vec4(.63,.67,1.,(1.-smoothstep(.3,.5,r))*(.08+bands*.18));}`,
      }),
    );
    veil.position.set(0, 2.8, -0.06);
    gate.add(veil);
    // Sanctuary cherry trees frame the gateway without covering the walking lane.
    for (const s of [-1, 1]) this.tree(s * 8.8, -9.5, 1.15, true);
    for (const s of [-1, 1])
      for (const z of [-5, 4]) {
        const g = new T.Group();
        g.position.set(s * 8, 0, z);
        this.scene.add(g);
        this.shape(g, "tube", 0x536575, 0, 1.45, 0, 0.09, 2.9, 0.09);
        this.shape(g, "box", 0xd5bf8b, 0, 2.95, 0, 0.5, 0.07, 0.5);
        const lamp = this.shape(
          g,
          "box",
          0xffdeac,
          0,
          2.65,
          0,
          0.32,
          0.5,
          0.32,
        );
        lamp.material = this.material(0xffdeac, 0.75);
        this.shape(g, "cone", 0x526077, 0, 3.05, 0, 0.4, 0.28, 0.4);
      }
  }
  tree(x, z, scale, blossom = false) {
    const g = new T.Group();
    g.position.set(x, this.ground(x, z, this.realm), z);
    g.scale.setScalar(scale);
    this.scene.add(g);
    const trunk = this.shape(g, "tube", 0x665e59, 0, 1.5, 0, 0.18, 3, 0.2);
    trunk.rotation.z = -0.08;
    for (let i = 0; i < 3; i++) {
      const a = i * 2.4;
      const branch = this.shape(
        g,
        "tube",
        0x665e59,
        Math.sin(a) * 0.45,
        2.5,
        Math.cos(a) * 0.45,
        0.085,
        1.9,
        0.085,
      );
      branch.rotation.z = Math.sin(a) * -0.65;
      branch.rotation.x = Math.cos(a) * 0.65;
    }
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4,
        tint = new T.Color(
          blossom ? this.palette.blossom : this.palette.leaf,
        ).multiplyScalar(0.85 + (i % 3) * 0.13);
      this.shape(
        g,
        "orb",
        tint.getHex(),
        Math.sin(a) * 1.1,
        3.4 + (i % 3) * 0.5,
        Math.cos(a) * 1.1,
        1.2,
        0.8,
        1.2,
      );
    }
  }
  landscape() {
    // Instanced foliage limits draw calls while retaining a layered canopy.
    const trunkGeo = new T.CylinderGeometry(0.17, 0.3, 3.4, 7),
      leafGeo = new T.IcosahedronGeometry(1, 1);
    const trunks = new T.InstancedMesh(trunkGeo, this.material(0x655e5a), 130);
    const leaves = new T.InstancedMesh(
      leafGeo,
      this.material(this.palette.leaf),
      520,
    );
    const d = new T.Object3D();
    let n = 0;
    for (let i = 0; i < 270 && n < 130; i++) {
      const x = this.random(this.seed, i, 22) * 220 - 110,
        z = this.random(this.seed, i, 23) * 220 - 110;
      if (Math.abs(x) < 8 || Math.hypot(x, z) < 19 || Math.abs(x - 30) < 9)
        continue;
      const y = this.ground(x, z, this.realm),
        s = 0.8 + this.random(1, i, 5) * 0.9;
      d.position.set(x, y + 1.7 * s, z);
      d.scale.set(s, s, s);
      d.rotation.set(0, 0, 0.07);
      d.updateMatrix();
      trunks.setMatrixAt(n, d.matrix);
      for (let j = 0; j < 4; j++) {
        d.position.set(
          x + Math.sin(j * 2.4) * s,
          y + (3.9 + (j % 2) * 0.8) * s,
          z + Math.cos(j * 2.4) * s,
        );
        d.scale.set(1.8 * s, 1.15 * s, 1.8 * s);
        d.updateMatrix();
        leaves.setMatrixAt(n * 4 + j, d.matrix);
        leaves.setColorAt(
          n * 4 + j,
          new T.Color().setScalar(0.8 + this.random(i, j, 2) * 0.35),
        );
      }
      n++;
    }
    trunks.count = n;
    leaves.count = n * 4;
    trunks.castShadow = leaves.castShadow = true;
    leaves.receiveShadow = true;
    this.scene.add(trunks, leaves);
    for (let i = 0; i < 48; i++) {
      const x = this.random(this.seed, i, 30) * 180 - 90,
        z = this.random(this.seed, i, 31) * 180 - 90;
      if (Math.hypot(x, z) < 18 || Math.abs(x) < 4) continue;
      const rock = this.shape(
        this.scene,
        "gem",
        0x7d8c8c,
        x,
        this.ground(x, z, this.realm),
        z,
        1.1 + this.random(1, i, 1) * 2,
        0.8 + this.random(1, i, 2),
        1.2,
      );
      rock.rotation.set(0.2, i, 0.1);
    }
    // Visible ruins and broken arches around the Warden's arena.
    const ruins = new T.Group();
    ruins.position.set(0, this.ground(0, -49, this.realm), -49);
    this.scene.add(ruins);
    this.shape(ruins, "tube", 0x8a9599, 0, 0.1, 0, 11, 0.3, 9);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2,
        x = Math.sin(a) * 10,
        z = Math.cos(a) * 8;
      this.shape(ruins, "tube", 0x88979c, x, 2.1, z, 0.5, 4.2 + (i % 3), 0.5);
      this.shape(ruins, "box", 0xb0b5ae, x, 4.3, z, 1.4, 0.3, 1.4);
      this.shape(ruins, "tube", 0x68777c, x, 0.3, z, 0.8, 0.5, 0.8);
    }
    this.ring(ruins, 7, 0.045, 0x9588b2, 0.31);
    this.createGrass();
    this.createMotes();
  }
  createGrass() {
    // Three bent ribbons read as a soft tuft instead of a solid cone.
    const vertices = [];
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1,
        w = 0.055,
        h = 0.3 + i * 0.075;
      const point = (x, y, z) => [
        Math.cos(a) * x - Math.sin(a) * z,
        y,
        Math.sin(a) * x + Math.cos(a) * z,
      ];
      const left = point(-w, 0, 0),
        right = point(w, 0, 0),
        midLeft = point(-w * 0.5, h * 0.6, 0.035),
        midRight = point(w * 0.5, h * 0.6, 0.035),
        tip = point(0, h, 0.12);
      vertices.push(
        ...left,
        ...right,
        ...midLeft,
        ...right,
        ...midRight,
        ...midLeft,
        ...midLeft,
        ...midRight,
        ...tip,
      );
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(vertices, 3),
    );
    geometry.computeVertexNormals();
    const material = new T.MeshStandardMaterial({
      color: this.palette.grass,
      roughness: 1,
      side: T.DoubleSide,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.windTime = this.wind;
      shader.vertexShader =
        "uniform float windTime;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        vec4 wp=instanceMatrix*vec4(position,1.);transformed.x+=sin(windTime*1.5+wp.x*.4+wp.z*.2)*position.y*.18;`,
        );
    };
    this.grass = new T.InstancedMesh(geometry, material, 4800);
    const d = new T.Object3D();
    let n = 0;
    for (let i = 0; i < 16000 && n < 4800; i++) {
      const x = this.random(this.seed, i, 82) * 140 - 70,
        z = this.random(this.seed, i, 83) * 140 - 70;
      if (
        Math.hypot(x, z) < 10.5 ||
        Math.abs(x + Math.sin(z * 0.03) * 3) < 4.5 ||
        Math.abs(x - 30) < 6 ||
        (Math.abs(x) > 10 && Math.abs(x) < 16 && Math.abs(z + 4) < 4)
      )
        continue;
      const s = 0.5 + this.random(2, i, 5) * 1.2;
      d.position.set(x, this.ground(x, z, this.realm) - 0.02, z);
      d.scale.set(s, s, s);
      d.rotation.y = i * 2.4;
      d.updateMatrix();
      this.grass.setMatrixAt(n, d.matrix);
      this.grass.setColorAt(
        n,
        new T.Color(n % 17 === 0 ? 0xe7c3be : 0xffffff).multiplyScalar(
          0.85 + this.random(2, i, 7) * 0.5,
        ),
      );
      n++;
    }
    this.grass.receiveShadow = true;
    this.scene.add(this.grass);
  }
  createMotes() {
    const positions = [],
      phases = [];
    for (let i = 0; i < 150; i++) {
      positions.push(
        this.random(11, i, 1) * 70 - 35,
        this.random(11, i, 2) * 9 + 1,
        this.random(11, i, 3) * 70 - 35,
      );
      phases.push(i);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setAttribute("phase", new T.Float32BufferAttribute(phases, 1));
    this.motes = new T.Points(
      g,
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        uniforms: { time: this.wind },
        vertexShader:
          "uniform float time;attribute float phase;varying float alpha;void main(){vec3 p=position;p.x+=sin(time*.2+phase)*1.5;p.y+=sin(time*.4+phase)*.4;vec4 mv=modelViewMatrix*vec4(p,1.);alpha=.25+.5*pow(sin(time*.6+phase),2.);gl_PointSize=clamp(35./-mv.z,1.,4.);gl_Position=projectionMatrix*mv;}",
        fragmentShader:
          "varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.84,.6,alpha*(1.-d*2.));}",
      }),
    );
    this.scene.add(this.motes);
  }
  water() {
    const g = new T.PlaneGeometry(10.5, 270, 1, 1);
    g.rotateX(-Math.PI / 2);
    this.river = new T.Mesh(
      g,
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          time: this.wind,
          tint: { value: new T.Color(this.palette.water) },
          sky: { value: new T.Color(this.palette.horizon) },
        },
        vertexShader:
          "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `varying vec2 v;uniform float time;uniform vec3 tint;uniform vec3 sky;
        void main(){float wave=sin(v.y*600.+time*1.1+sin(v.x*28.+time*.3)*2.);float ripple=pow(max(0.,wave),30.)*(.5+.5*sin(v.x*55.+v.y*39.));
          float edge=smoothstep(.44,.5,abs(v.x-.5));vec3 c=mix(tint,sky,.15+sin(v.y*35.)*.05)+ripple*.09;
          c=mix(c,vec3(.83,.91,.85),edge*.75);gl_FragColor=vec4(c,.86);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      }),
    );
    this.river.position.set(30, -0.12, -10);
    this.scene.add(this.river);
    // Low wooden crossing; decoration only, following the existing traversable terrain.
    const bridge = new T.Group();
    bridge.position.set(30, 0.05, 6);
    this.scene.add(bridge);
    for (let i = 0; i < 18; i++)
      this.shape(
        bridge,
        "box",
        i % 2 ? 0x8b8070 : 0x9f927b,
        (i - 8.5) * 0.64,
        0,
        0,
        0.6,
        0.14,
        2.4,
      );
    for (const x of [-5.5, 5.5])
      for (const z of [-1.3, 1.3])
        this.shape(bridge, "tube", 0x6d685e, x, 0.6, z, 0.1, 1.4, 0.1);
  }
  quality(settings) {
    const preset = GRAPHICS[settings.quality] || GRAPHICS.balanced;
    this.grass.count = preset.grass;
    this.motes.geometry.setDrawRange(0, preset.particles);
    this.motes.visible = !settings.reducedMotion;
  }
  update(time, reduced) {
    this.wind.value = reduced ? 0 : time;
  }
  dispose() {
    for (const texture of this.textures) texture.dispose();
  }
}
