import * as T from "../vendor/three.module.js";
import { ArtDirector } from "./art.mjs";
import { HEROES } from "./content.mjs";

let sheets, pending;
export function loadIllustrations() {
  return (pending ??= Promise.all(
    ["heroes-walk.webp", "props-anime.webp", "ground-anime.webp"].map((name) =>
      new T.TextureLoader().loadAsync(
        new URL("../assets/" + name, import.meta.url).href,
      ),
    ),
  ).then((textures) => {
    textures.forEach((texture) => {
      texture.colorSpace = T.SRGBColorSpace;
      texture.minFilter = T.LinearFilter;
      texture.magFilter = T.LinearFilter;
      texture.generateMipmaps = false;
    });
    sheets = { heroes: textures[0], props: textures[1], ground: textures[2] };
    sheets.ground.generateMipmaps = true;
    sheets.ground.minFilter = T.LinearMipmapLinearFilter;
    sheets.ground.anisotropy = 4;
    sheets.ground.needsUpdate = true;
  }));
}

// Painted sprites share the existing 3D terrain and combat coordinates. The
// orthographic camera, depth buffer and alpha cutouts provide a 2.5D world.
export class IllustratedArt extends ArtDirector {
  constructor(...args) {
    super(...args);
    if (!sheets) throw Error("Illustration atlases have not loaded");
    this.propMaterials = new Map();
    this.occluders = [];
  }
  cell(sheet, columns, rows, col, row) {
    const texture = sheets[sheet].clone();
    const insetX = 1 / texture.image.width,
      insetY = 1 / texture.image.height;
    texture.repeat.set(1 / columns - insetX * 2, 1 / rows - insetY * 2);
    texture.offset.set(col / columns + insetX, 1 - (row + 1) / rows + insetY);
    texture.needsUpdate = true;
    this.textures.add(texture);
    return texture;
  }
  prop(index, x = 0, y = 0, z = 0, width = 4, height = width, tint = 0xffffff) {
    const key = index + ":" + tint;
    if (!this.propMaterials.has(key))
      this.propMaterials.set(
        key,
        new T.SpriteMaterial({
          map: this.cell("props", 4, 4, index % 4, Math.floor(index / 4)),
          transparent: true,
          alphaTest: 0.28,
          depthWrite: true,
          color: tint,
        }),
      );
    const tall = index < 4 || index === 8;
    const sprite = new T.Sprite(
      tall ? this.propMaterials.get(key).clone() : this.propMaterials.get(key),
    );
    sprite.center.set(0.5, 0.04);
    sprite.scale.set(width, height, 1);
    sprite.position.set(x, y, z);
    sprite.userData.propIndex = index;
    if (tall) this.occluders.push(sprite);
    return sprite;
  }
  fadeOccluders(character, camera, dt) {
    const feet = character.position.clone().project(camera);
    const head = character.position
      .clone()
      .add(new T.Vector3(0, 1.6, 0))
      .project(camera);
    const blend = 1 - Math.exp(-10 * dt);
    for (const sprite of this.occluders) {
      const p = sprite.getWorldPosition(new T.Vector3()).project(camera);
      const halfWidth = Math.abs(sprite.scale.x) / (camera.right - camera.left);
      const height = (sprite.scale.y * 2) / (camera.top - camera.bottom);
      const obscures =
        p.z < feet.z - 0.0001 &&
        Math.abs(head.x - p.x) < halfWidth * 0.8 &&
        head.y > p.y - height * 0.04 &&
        head.y < p.y + height * 0.96;
      const opacity = obscures ? 0.34 : 1;
      sprite.material.opacity += (opacity - sprite.material.opacity) * blend;
      sprite.material.alphaTest = sprite.material.opacity < 0.9 ? 0.06 : 0.28;
    }
  }
  shadow(group, width = 1) {
    const shadow = new T.Mesh(
      new T.CircleGeometry(width, 28),
      new T.MeshBasicMaterial({
        color: 0x193633,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.y = 0.55;
    shadow.position.y = 0.025;
    group.add(shadow);
  }
  avatar(hero) {
    const g = new T.Group(),
      index = Math.max(
        0,
        HEROES.findIndex((h) => h.id === hero.id),
      );
    const map = this.cell(
      "heroes",
      6,
      4,
      (index % 3) * 2,
      Math.floor(index / 3),
    );
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map,
        transparent: true,
        alphaTest: 0.25,
        depthWrite: true,
      }),
    );
    sprite.center.set(0.5, 0.035);
    sprite.scale.set(3.4, 3.4, 1);
    sprite.position.y = 0.03;
    sprite.userData.ownedTexture = true;
    this.shadow(g, 0.6);
    g.add(sprite);
    // Preserve the presentation API used by the existing action controller.
    g.legs = [new T.Object3D(), new T.Object3D()];
    g.arms = [new T.Object3D(), new T.Object3D()];
    g.userData = {
      attack: 0,
      sprite,
      index,
      frame: 0,
      facing: 0,
      cameraYaw: Math.PI / 4,
    };
    return g;
  }
  animateAvatar(g, stride, time, moving, reduced) {
    const data = g.userData,
      sprite = data.sprite;
    if (!sprite) return;
    const frame = moving ? Math.floor(time * 6) % 2 : 0;
    if (frame !== data.frame) {
      sprite.material.map.offset.x =
        ((data.index % 3) * 2 + frame) / 6 +
        1 / sprite.material.map.image.width;
      data.frame = frame;
    }
    const right = Math.sin(data.facing - data.cameraYaw);
    sprite.scale.x = right < -0.15 ? -3.4 : 3.4;
    sprite.position.y =
      0.03 +
      (moving
        ? Math.abs(stride) * 0.08
        : reduced
          ? 0
          : Math.sin(time * 2) * 0.018);
    sprite.material.rotation =
      data.attack > 0 ? Math.sin(data.attack * 13) * 0.055 : 0;
  }
  building(x, z) {
    this.scene.add(this.prop(2, x, 0, z, 8.4, 8.4));
  }
  groundMaterial() {
    const tint =
      this.realm === "moon"
        ? 0xc2b9ed
        : this.realm === "cinder"
          ? 0xe4afa0
          : this.realm === "frost"
            ? 0xc1dce9
            : 0xffffff;
    return new T.ShaderMaterial({
      uniforms: {
        atlas: { value: sheets.ground },
        tint: { value: new T.Color(tint) },
        desaturate: { value: this.realm === "bastion" ? 0 : 0.65 },
      },
      vertexShader:
        "varying vec3 world;void main(){vec4 w=modelMatrix*vec4(position,1.);world=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}",
      fragmentShader: `varying vec3 world;uniform sampler2D atlas;uniform vec3 tint;uniform float desaturate;
        vec3 tile(vec2 cell){vec2 uv=abs(fract(world.xz*.16)*2.-1.);return texture2D(atlas,(cell+uv*.98+.01)*.5).rgb;}
        void main(){vec3 grass=tile(vec2(0.,1.));vec3 path=tile(vec2(1.,1.));vec3 stone=tile(vec2(0.,0.));vec3 sand=tile(vec2(1.,0.));
          float trail=1.-smoothstep(3.,4.6,abs(world.x+sin(world.z*.03)*3.));float bank=1.-smoothstep(5.3,6.8,abs(world.x-30.));
          vec3 c=mix(mix(grass,path,trail),sand,bank);if(length(world.xz)<10.)c=stone;
          float grey=dot(c,vec3(.2126,.7152,.0722));c=mix(c,vec3(grey),desaturate)*tint*.87;gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }
  tree(x, z, scale = 1, blossom = false) {
    const tint =
      this.realm === "moon"
        ? 0xd0c4f2
        : this.realm === "cinder"
          ? 0xffc4a9
          : this.realm === "frost"
            ? 0xc4e4ef
            : 0xffffff;
    this.scene.add(
      this.prop(
        blossom ? 1 : 0,
        x,
        this.ground(x, z, this.realm),
        z,
        6.2 * scale,
        6.2 * scale,
        tint,
      ),
    );
  }
  sanctuary() {
    const floor = new T.Mesh(
      new T.CircleGeometry(10, 96),
      this.groundMaterial(),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.025;
    floor.receiveShadow = true;
    this.scene.add(floor);
    for (const radius of [5, 8.6, 9.85])
      this.ring(this.scene, radius, 0.025, 0xd1b67b, 0.05);
    this.scene.add(this.prop(3, 0, 0, -6, 7.2, 7.2));
    this.building(-13, -4);
    this.building(13, -5);
    this.scene.add(this.prop(7, -10, 0, 5, 3.5, 3.5));
    for (const sign of [-1, 1]) {
      this.tree(sign * 9, -10, 1.1, true);
      for (const z of [-4, 6])
        this.scene.add(this.prop(10, sign * 8, 0, z, 2.7, 3.7));
    }
    const npc = this.avatar(HEROES[2]);
    npc.position.set(6, 0, -1);
    this.scene.add(npc);
    return { npc };
  }
  landscape() {
    let count = 0;
    for (let i = 0; i < 240 && count < 85; i++) {
      const x = this.random(this.seed, i, 22) * 220 - 110,
        z = this.random(this.seed, i, 23) * 220 - 110;
      if (Math.abs(x) < 9 || Math.hypot(x, z) < 20 || Math.abs(x - 30) < 9)
        continue;
      this.tree(x, z, 0.75 + this.random(1, i, 5) * 0.6);
      count++;
    }
    for (let i = 0; i < 35; i++) {
      const x = this.random(this.seed, i, 30) * 170 - 85,
        z = this.random(this.seed, i, 31) * 170 - 85;
      if (Math.hypot(x, z) < 18 || Math.abs(x) < 5) continue;
      this.scene.add(this.prop(9, x, this.ground(x, z, this.realm), z, 3, 3));
    }
    for (const x of [-9, 9])
      this.scene.add(
        this.prop(8, x, this.ground(x, -49, this.realm), -49, 6, 6),
      );
    this.createGrass();
    this.createMotes();
  }
  enemy(enemy) {
    const index = enemy.training
      ? 11
      : enemy.boss
        ? 13
        : { stalker: 12, sentinel: 13, archer: 14, oracle: 15 }[
            enemy.archetype
          ] || 12;
    const g = new T.Group();
    this.shadow(g, 0.65);
    const sprite = this.prop(
      index,
      0,
      0,
      0,
      enemy.training ? 2.8 : 3.5,
      enemy.training ? 2.8 : 3.5,
    );
    g.add(sprite);
    g.userData.sprite = sprite;
    return g;
  }
  resource(kind) {
    return this.prop(
      { ore: 4, tree: 6, herb: 5 }[kind],
      0,
      0,
      0,
      kind === "tree" ? 3.7 : 1.65,
      kind === "tree" ? 3.7 : 1.65,
    );
  }
}
