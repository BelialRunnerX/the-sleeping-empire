import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const artifacts = resolve(root, ".artifacts");
await mkdir(artifacts, { recursive: true });
const server = createServer(async (req, res) => {
  const route = new URL(req.url, "http://localhost").pathname;
  if (route === "/") {
    res
      .writeHead(200, { "content-type": "text/html" })
      .end(
        '<!doctype html><style>body{margin:0;overflow:hidden}canvas{display:block}</style><canvas id="scene"></canvas>',
      );
    return;
  }
  const path = resolve(root, "." + decodeURIComponent(route));
  if (!path.startsWith(root.slice(0, -1) + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const bytes = await readFile(path);
    res
      .writeHead(200, {
        "content-type":
          extname(path) === ".mjs" || extname(path) === ".js"
            ? "text/javascript"
            : "application/octet-stream",
      })
      .end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /Shader Error|VALIDATE_STATUS|THREE.WebGLProgram|GL_INVALID/.test(
      message.text(),
    )
  )
    errors.push(message.text());
});
try {
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.evaluate(async () => {
    const { WorldView } = await import("/engine/world.mjs");
    const { freshState, Simulation } = await import("/engine/simulation.mjs");
    const { HEROES } = await import("/engine/content.mjs");
    window.artTest = { WorldView, freshState, Simulation, HEROES };
  });
  for (const realm of ["bastion", "moon", "cinder", "frost", "orbit"]) {
    const report = await page.evaluate(async (realm) => {
      const { WorldView, freshState, Simulation, HEROES } = window.artTest;
      const state = freshState(9372);
      state.realm = realm;
      const sim = new Simulation(state),
        view = new WorldView(document.querySelector("canvas"), state, sim, {
          quality: "high",
          reducedMotion: false,
        });
      const render = async () => {
        view.update(0.1, { x: 0, z: 0 }, 12);
        // Give software renderers time to submit each frame instead of queuing
        // dozens of shadow passes in a single evaluation task.
        view.renderer.getContext().finish();
        await new Promise(requestAnimationFrame);
      };
      await render();
      const baseline = view.renderer.info.memory.geometries;
      // Switching every hero must retire unique capes/weapon geometry.
      for (const hero of HEROES) {
        state.hero = hero.id;
        view.setHero();
        await render();
      }
      const after = view.renderer.info.memory.geometries;
      state.hero = "kael";
      view.setHero();
      for (const quality of ["low", "balanced", "high"]) {
        view.applyVisualSettings({ quality, reducedMotion: false });
        await render();
      }
      const cache = view.features[0];
      const point = view.project(
        cache.x,
        view.height(cache.x, cache.z) + 0.55,
        cache.z,
      );
      const picked =
        point.visible && view.pick(point.x, point.y)?.id === cache.id;
      const allMeshes =
        view.camera.isPerspectiveCamera &&
        view.nodes.every((n) => n.mesh.children.every((o) => !o.isSprite));
      // A riverbank view exposes animated water, terrain, foliage and the skyline.
      sim.player.x = 20;
      sim.player.z = 7;
      sim.player.facing = -1.2;
      Object.assign(view.rig.goal, { yaw: -0.6, pitch: 0.45, distance: 13 });
      for (let i = 0; i < 4; i++) await render();
      window.artTest.view = view;
      window.artTest.draw = () => {
        view.update(0.016, { x: 0, z: 0 }, 12);
        window.artTest.frame = requestAnimationFrame(window.artTest.draw);
      };
      window.artTest.frame = requestAnimationFrame(window.artTest.draw);
      return {
        realm,
        baseline,
        after,
        calls: view.renderer.info.render.calls,
        triangles: view.renderer.info.render.triangles,
        textures: view.renderer.info.memory.textures,
        picked,
        allMeshes,
      };
    }, realm);
    assert.ok(
      report.after <= report.baseline + 4,
      "Hero changes leaked geometry: " + JSON.stringify(report),
    );
    assert.ok(
      report.calls < 1200 && report.triangles < 600000,
      "Scene exceeded structural rendering budget: " + JSON.stringify(report),
    );
    assert.ok(report.textures < 16, "Unexpected texture growth");
    assert.equal(
      report.picked && report.allMeshes,
      true,
      "The perspective scene should contain mesh resources and ray-pick the rendered cache",
    );
    await page.screenshot({
      path: resolve(artifacts, "realm-" + realm + "-model.png"),
      timeout: 60000,
    });
    console.log("Rendered", JSON.stringify(report));
    await page.evaluate(() => {
      cancelAnimationFrame(window.artTest.frame);
      window.artTest.view.dispose();
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    "Visual checks passed: five 3D realms, ray picking, twelve appearance swaps, all presets, shader compilation, geometry lifetime and scene budgets.",
  );
} finally {
  await browser.close();
  server.close();
}
