import * as T from "../vendor/three.module.js";
import { STATIONS } from "./artisan.mjs";

export class WorkstationView {
  constructor(scene, state, art) {
    this.state = state;
    this.entries = [];
    if (state.realm !== "bastion") return;
    for (const def of STATIONS) {
      const group = new T.Group();
      group.position.set(def.x, 0, def.z);
      scene.add(group);
      const body = new T.Group(),
        built = new T.Group();
      group.add(body);
      body.add(built);
      const shape = (kind, color, ...args) =>
        art.shape(built, kind, color, ...args);
      art.shape(body, "box", 0x69787f, 0, 0.09, 0, 2.55, 0.18, 1.8);
      shape("box", 0x424e62, 0, 0.62, 0, 1.93, 0.93, 1.31);
      shape("box", def.color, 0, 1.1, 0, 2.15, 0.13, 1.46);
      for (const x of [-0.8, 0.8])
        for (const z of [-0.54, 0.54])
          shape("box", 0xa39379, x, 0.6, z, 0.14, 0.94, 0.14);
      if (def.id === "foundry") {
        shape("tube", 0x6d7380, 0.57, 1.87, -0.38, 0.25, 1.65, 0.25);
        shape("tube", 0x9e998e, 0.57, 2.68, -0.38, 0.33, 0.13, 0.33);
        shape("box", 0x262638, -0.26, 0.64, 0.68, 0.78, 0.55, 0.09);
        shape("box", 0xffac6d, -0.26, 0.58, 0.74, 0.59, 0.21, 0.04).material =
          art.material(0xffac6d, 0.72);
        shape("tube", 0x949cac, -0.42, 1.32, 0.12, 0.32, 0.27, 0.25);
      } else if (def.id === "alchemy") {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * 0.48,
            tint = [0xc098e9, 0x99e6bc, 0x8fd7fa][i];
          shape("orb", tint, x, 1.31, 0.22, 0.16, 0.19, 0.16).material =
            art.material(tint, 0.38);
          shape("tube", tint, x, 1.53, 0.22, 0.065, 0.19, 0.065);
          shape("tube", 0xbda07f, x, 1.65, 0.22, 0.08, 0.065, 0.08);
        }
        shape("box", 0xb38daf, 0, 1.45, -0.49, 2.02, 0.11, 0.39);
      } else {
        for (let i = 0; i < 3; i++)
          shape(
            "box",
            0xc4a57b,
            -0.21,
            1.23 + i * 0.11,
            0.12,
            1.37 - i * 0.24,
            0.1,
            0.36,
          );
        shape("gem", 0x96a8ae, 0.71, 1.47, -0.18, 0.22, 0.32, 0.07);
      }
      const plan = art.shape(
        body,
        "gem",
        0xb9b3ef,
        0,
        0.74,
        0,
        0.44,
        0.57,
        0.44,
      );
      plan.material = art.material(0xb9b3ef, 0.34);
      const ring = new T.Mesh(
        new T.RingGeometry(1.15, 1.3, 64),
        new T.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: T.DoubleSide,
          uniforms: {
            progress: { value: 0 },
            running: { value: 0 },
            ready: { value: 0 },
            tint: { value: new T.Color(def.color) },
          },
          vertexShader:
            "varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader: `varying vec2 p;uniform float progress;uniform float running;uniform float ready;uniform vec3 tint;
          void main(){float a=fract(atan(p.y,p.x)/6.2831853+.25);float fill=step(a,progress);float alpha=.18+running*fill*.6+ready*.45;gl_FragColor=vec4(mix(tint,vec3(1.,.86,.5),ready),alpha);}`,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.06;
      group.add(ring);
      const positions = [];
      for (let i = 0; i < 12; i++)
        positions.push(
          Math.sin(i * 2.4) * 0.65,
          0.8 + (i % 4) * 0.3,
          Math.cos(i * 2.4) * 0.5,
        );
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(positions, 3),
      );
      const sparks = new T.Points(
        geometry,
        new T.PointsMaterial({
          color: def.color,
          size: 0.065,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: T.AdditiveBlending,
        }),
      );
      group.add(sparks);
      this.entries.push({ def, group, built, plan, ring, sparks });
    }
  }
  nearest(player) {
    return (
      this.entries
        .map((e) => ({
          ...e.def,
          distance: Math.hypot(player.x - e.def.x, player.z - e.def.z),
        }))
        .filter((e) => e.distance <= 4)
        .sort((a, b) => a.distance - b.distance)[0] || null
    );
  }
  update(time, reduced) {
    const now = Date.now();
    for (const { def, built, plan, ring, sparks } of this.entries) {
      const station = this.state.production.stations[def.id],
        job = station.jobs[0];
      const busy = !!job && job.start <= now && job.end > now;
      built.visible = !!station.tier;
      plan.visible = !station.tier;
      plan.rotation.y = reduced ? 0.7 : time * 0.6;
      ring.material.uniforms.running.value = busy ? 1 : 0;
      ring.material.uniforms.ready.value = station.completed ? 1 : 0;
      ring.material.uniforms.progress.value = job
        ? Math.max(0, Math.min(1, (now - job.start) / (job.end - job.start)))
        : 0;
      sparks.visible = busy && !reduced;
      sparks.position.y = (time * 0.25) % 0.4;
      sparks.rotation.y = time * 0.5;
    }
  }
}
