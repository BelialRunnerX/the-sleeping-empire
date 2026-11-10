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
    const { loadAvatarRigs } = await import("/engine/avatar-rig.mjs");
    const { loadSurfaces } = await import("/engine/surfaces.mjs");
    const { loadFieldArt } = await import("/engine/field-art.mjs");
    const loaded = (
      await Promise.all([loadAvatarRigs(), loadSurfaces(), loadFieldArt()])
    ).flat();
    const failed = loaded.filter((r) => r.status === "rejected");
    if (failed.length)
      throw Error(failed.map((x) => x.reason?.message).join("; "));
    const { WorldView } = await import("/engine/world.mjs");
    const { freshState, Simulation, craft, alterItem } = await import(
      "/engine/simulation.mjs"
    );
    const { HEROES } = await import("/engine/content.mjs");
    window.artTest = {
      WorldView,
      freshState,
      Simulation,
      HEROES,
      craft,
      alterItem,
    };
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
      if (!view.character.userData.rig)
        throw Error("Kael did not load the rigged avatar");
      const leg = view.character.userData.rig.bones.L_UpperLeg;
      const idle = leg.rotation.x;
      view.update(0.016, { x: 1, z: 0 }, 12.16);
      if (Math.abs(leg.rotation.x - idle) < 0.01)
        throw Error("Rig walk pose did not reach the leg joint");
      state.hero = "mira";
      view.setHero();
      await render();
      if (!view.character.userData.rig)
        throw Error("Mira did not load the rigged avatar");
      state.hero = "kael";
      view.setHero();
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
      if (realm === "bastion") {
        if (!view.field.grass?.count || view.field.animals.size !== 2)
          throw Error("Outpost grass or wildlife did not load");
        const grassMatrix = view.field.grass.instanceMatrix.version;
        const startTile = view.chunkMeshes.get("0:0");
        sim.player.x = -2860;
        sim.player.z = 3140;
        await render();
        if (
          view.chunkMeshes.size !== 49 ||
          view.chunkMeshes.has("0:0") ||
          startTile.terrain.parent ||
          !view.nodes.some((n) => n.x < -2800) ||
          view.field.grass.instanceMatrix.version === grassMatrix
        )
          throw Error("World did not unload old terrain and load new terrain");
        sim.player.x = 0;
        sim.player.z = 6;
        await render();
        if (
          view.chunkMeshes.size !== 49 ||
          view.chunkMeshes.get("0:0") === startTile
        )
          throw Error("World did not reconstruct the starting area");
      }
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
    assert.ok(
      report.textures < 48,
      "Unexpected texture growth: " + report.textures,
    );
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
  const showcase = [
    {
      file: "living-biomes-fenstag.png",
      realm: "bastion",
      x: 13,
      z: 12,
      yaw: 1.62,
      pitch: 0.34,
      distance: 7.5,
      hero: "mira",
      weapon: "coilwood-bow",
      armor: "scout-weave",
    },
    {
      file: "foundry-arsenal.png",
      realm: "bastion",
      x: 0,
      z: 6,
      yaw: 2.66,
      pitch: 0.21,
      distance: 4.95,
      hero: "kael",
      weapon: "piercer-spear",
      armor: "siege-plate",
    },
    {
      file: "foundry-crystals.png",
      realm: "frost",
      x: -12.3,
      z: 12.5,
      yaw: 1.72,
      pitch: 0.39,
      distance: 6.5,
      hero: "mira",
      weapon: "railbow",
      armor: "scout-weave",
    },
    {
      file: "foundry-expedition.png",
      realm: "orbit",
      x: -2860,
      z: 3140,
      yaw: 0.16,
      pitch: 0.11,
      distance: 10.9,
      hero: "mira",
      weapon: "psi-projector",
      armor: "scout-weave",
    },
  ];
  for (const shot of showcase) {
    await page.evaluate(async (shot) => {
      const { WorldView, freshState, Simulation, craft, alterItem } =
        window.artTest;
      const state = freshState(9372);
      state.realm = shot.realm;
      state.hero = shot.hero;
      state.position = { x: shot.x, z: shot.z };
      Object.assign(state.resources, {
        cobalt: 30,
        stone: 30,
        timber: 30,
        circuitry: 10,
        herb: 10,
        electrum: 4,
        fieldCord: 1,
        essence: 4,
      });
      let serial = 1042;
      for (const recipe of [shot.weapon, shot.armor, "kinetic-shield"]) {
        if (!craft(state, recipe, serial++).ok)
          throw Error("Invalid gear visual fixture");
        alterItem(state, state.items.at(-1).id, "equip");
      }
      const sim = new Simulation(state);
      sim.player.facing = shot.yaw + 0.22;
      const view = new WorldView(
        document.querySelector("canvas"),
        state,
        sim,
        { quality: "high", reducedMotion: false },
        shot,
      );
      window.artTest.view = view;
      for (let i = 0; i < 5; i++) {
        view.update(0.1, { x: 0, z: 0 }, 12 + i * 0.1);
        view.renderer.getContext().finish();
        await new Promise(requestAnimationFrame);
      }
    }, shot);
    await page.screenshot({
      path: resolve(artifacts, shot.file),
      timeout: 60000,
    });
    await page.evaluate(() => window.artTest.view.dispose());
  }
  assert.deepEqual(errors, []);
  console.log(
    "Visual checks passed: five 3D realms, ray picking, twelve appearance swaps, all presets, shader compilation, geometry lifetime and scene budgets.",
  );
} finally {
  await browser.close();
  server.close();
}
