import * as T from "../vendor/three.module.js";
import { STATIONS } from "./artisan.mjs";

export class WorkstationView {
  constructor(scene, state, art, illustrated) {
    this.state = state;
    this.entries = [];
    if (state.realm !== "bastion") return;
    for (const def of STATIONS) {
      const group = new T.Group();
      group.position.set(def.x, 0, def.z);
      scene.add(group);
      let body;
      if (illustrated) {
        body = art.stationSprite(def.cell);
        group.add(body);
      } else {
        body = new T.Group();
        group.add(body);
        art.shape(body, "box", 0x556779, 0, 0.5, 0, 2, 1, 1.3);
        art.shape(body, "box", def.color, 0, 1.05, 0, 2.2, 0.1, 1.5);
        if (def.id === "foundry")
          art.shape(body, "tube", 0x6d7380, 0.5, 1.8, -0.3, 0.25, 2, 0.25);
        else if (def.id === "alchemy")
          for (const x of [-0.5, 0, 0.5])
            art.shape(body, "orb", def.color, x, 1.4, 0, 0.16, 0.3, 0.16);
        else art.shape(body, "box", 0xc4a57b, 0, 1.2, 0, 1.8, 0.2, 0.6);
      }
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
      this.entries.push({ def, group, body, ring, sparks });
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
    for (const { def, body, ring, sparks } of this.entries) {
      const station = this.state.production.stations[def.id],
        job = station.jobs[0];
      const busy = !!job && job.start <= now && job.end > now;
      if (body.isSprite) {
        body.material.opacity = station.tier ? 1 : 0.32;
        body.material.alphaTest = station.tier ? 0.25 : 0.06;
      }
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
