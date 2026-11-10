import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { testArtisanFlow } from "./artisan-browser.mjs";
import { testNurseryFlow } from "./nursery-browser.mjs";
import { testMicrovoxelFlow } from "./microvoxels-browser.mjs";
import { testGeologyFlow } from "./geology-browser.mjs";
const root = fileURLToPath(new URL("../", import.meta.url)),
  artifacts = resolve(root, ".artifacts");
await mkdir(artifacts, { recursive: true });
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
};
const server = createServer(async (req, res) => {
  try {
    const route = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      ),
      path = resolve(
        root,
        "." + (route.endsWith("/") ? route + "index.html" : route),
      );
    if (
      !path.startsWith(root.slice(0, -1) + sep) &&
      path !== root.slice(0, -1)
    ) {
      res.writeHead(403).end();
      return;
    }
    const bytes = await readFile(path);
    res
      .writeHead(200, {
        "content-type": types[extname(path)] || "application/octet-stream",
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
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.error("Page error:", e.message);
});
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /Shader Error|VALIDATE_STATUS|THREE.WebGLProgram|GL_INVALID/.test(
      message.text(),
    )
  )
    errors.push(message.text());
});
const url = "http://127.0.0.1:" + server.address().port + "/index.html";
// Optional typography must not make a local mechanics test network-dependent.
await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
  route.abort(),
);
try {
  if (process.env.GEOLOGY_ONLY === "1") {
    await page.close();
    await testGeologyFlow(browser, url, artifacts);
  } else if (process.env.MICROVOXEL_ONLY === "1") {
    await page.close();
    await testMicrovoxelFlow(browser, url, artifacts);
  } else if (process.env.NURSERY_ONLY === "1") {
    await page.close();
    await testNurseryFlow(browser, url, artifacts);
  } else if (process.env.ARTISAN_ONLY === "1") {
    await page.close();
    await testArtisanFlow(browser, url, artifacts);
  } else {
    await page.goto(url);
    await page.locator("#loading").waitFor({ state: "hidden" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(artifacts, "landing.png") });
    console.log("Anime title screen rendered");
    await page.locator("#profile-name").fill("Browser Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "NEW ADVENTURE" }).click();
    // Initial world/shader construction can exceed the normal action timeout
    // on CI software renderers. Click once, then require the actual Codex UI.
    await page.locator('[data-action="menu-enter"]').click({ timeout: 60000 });
    await page.locator("#codex-race").waitFor({ state: "visible", timeout: 60000 });
    await page.locator("#hud").waitFor({ state: "visible" });
    assert.equal(await page.locator("#codex-race option").count(), 6);
    assert.equal(await page.locator("#codex-class option").count(), 9);
    await page.locator("#codex-race").selectOption("veylari");
    await page.locator("#codex-class").selectOption("marksman");
    await page.getByRole("button", { name: "DECLARE CHARACTER" }).click();await page.locator('#panels').waitFor({state:'hidden'});
    console.log("Profile entered world");
    assert.equal(
      await page.locator("#world").getAttribute("data-avatar-model"),
      "rigged",
    );
    assert.equal(
      await page.locator("#world").getAttribute("data-surfaces"),
      "scanned",
    );
    await page.evaluate(() => {
      window.testPad = { index: 0, id: "Test Controller", mapping: "standard",
        connected: true, axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      navigator.getGamepads = () => [window.testPad];
    });
    await page.locator("#controller-status").waitFor({ state: "visible" });
    await page.evaluate(() => { window.testPad.buttons[9].pressed = true; });
    await page.getByRole("dialog").waitFor({ state: "visible" });
    await page.evaluate(() => {
      window.testPad.buttons[9].pressed = false;
      window.testPad.buttons[1].pressed = true;
    });
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.evaluate(() => { window.testPad = null; });
    await page.locator("#controller-status").waitFor({ state: "hidden" });
    await page.keyboard.press("ControlLeft");
    assert.equal(
      await page.locator("#free-look").getAttribute("aria-pressed"),
      "true",
    );
    await page.keyboard.press("ControlLeft");
    assert.equal(
      await page.locator("#free-look").getAttribute("aria-pressed"),
      "false",
    );
    await page.waitForFunction(
      () => document.querySelector("#save-state")?.textContent === "Saved",
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(artifacts, "world.png") });
    assert.equal(
      await page.locator("#world").getAttribute("data-art-style"),
      "model",
    );
    await page.keyboard.press("o");
    await page.locator("#graphics-quality").selectOption("high");
    assert.equal(
      await page.locator("#world").getAttribute("data-shadows"),
      "true",
    );
    await page.keyboard.press("Escape");
    // Orbit and zoom through real camera controls, then restore the
    // initial heading before movement checks. F8 must hide and restore the HUD.
    await page.mouse.move(1100, 430);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(1100 - Math.PI / 0.006, 430);
    await page.mouse.up({ button: "right" });
    await page.mouse.wheel(0, -600);
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("astral_empire_camera_v1"))?.distance <
        6,
    );
    await page.keyboard.press("F8");
    await page.waitForTimeout(500);
    assert.equal(
      await page
        .locator("#hud")
        .evaluate((el) => getComputedStyle(el).visibility),
      "hidden",
    );
    await page.screenshot({ path: resolve(artifacts, "hero-detail.png") });
    await page.keyboard.press("F8");
    await page.keyboard.press("r");
    await page.keyboard.press("o");
    await page.locator("#graphics-quality").selectOption("low");
    await page.locator("#reduced-motion").check();
    assert.equal(
      await page.locator("#world").getAttribute("data-shadows"),
      "false",
    );
    assert.equal(
      await page.evaluate(() =>
        document.body.classList.contains("reduced-motion"),
      ),
      true,
    );
    await page.keyboard.press("Escape");
    // Exercise the new disciplines through the player UI, including actual impact.
    await page.keyboard.press("h");
    await page.locator(".hero-illustration").first().waitFor();
    await page.screenshot({ path: resolve(artifacts, "anime-roster.png") });
    await page.getByRole("button", { name: "CLAIM SORA · FREE" }).click();
    await page.locator('[data-hero="sora"]').click();
    await page.keyboard.press("Escape");
    await page
      .locator('[data-skill="strike"][title*="Moonstring volley"]')
      .waitFor();
    await page.locator('[data-skill="strike"]').click();
    await page
      .locator("#world-labels .floating")
      .first()
      .waitFor({ state: "attached" });
    await page.screenshot({ path: resolve(artifacts, "bow-training.png") });
    await page.keyboard.press("u");
    await page.locator("#codex-class").selectOption("psion");
    await page.getByRole("button", { name: "UPDATE FIELD LOADOUT" }).click();
    await page.locator('[data-skill="strike"][title*="Aether bolt"]').waitFor();
    await page.waitForTimeout(650);
    await page.locator('[data-skill="strike"]').click();
    await page.keyboard.press("k");
    await page.locator("#damage-inspector").waitFor();
    assert.match(
      await page.locator("#damage-inspector").innerText(),
      /Physical hits meet armor/,
    );
    await page.screenshot({ path: resolve(artifacts, "combat-builds.png") });
    await page
      .getByRole("button", { name: "Appearances", exact: true })
      .click();
    await page.locator('[data-hero="kael"]').click();
    await page.keyboard.press("Escape");
    await page.locator('[data-skill="strike"][title*="Aether bolt"]').waitFor();
    await page.keyboard.press("u");
    await page.locator("#codex-class").selectOption("enforcer");
    await page.getByRole("button", { name: "UPDATE FIELD LOADOUT" }).click();
    const cache = page.locator('[data-world-feature="bastion-cache-0"]');
    await cache.click();
    const savedState = () =>
      JSON.parse(localStorage.getItem("astral_empire_profile_browser-test_v3"));
    await page.waitForFunction(() =>
      JSON.parse(
        localStorage.getItem("astral_empire_profile_browser-test_v3"),
      )?.exploration.changed.includes("bastion-cache-0"),
    );
    const cacheLoot = (await page.evaluate(savedState)).resources.herb;
    // In the 45-degree view, D+S travels along positive world X.
    const pressPair = (type, keys) =>
      page.evaluate(
        ({ type, keys }) => {
          for (const key of keys)
            document.dispatchEvent(
              new KeyboardEvent(type, { key, bubbles: true }),
            );
        },
        { type, keys },
      );
    await pressPair("keydown", ["s", "a"]);
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#coordinates").textContent.split(",")[1],
        ) >= 5,
    );
    await pressPair("keyup", ["s", "a"]);
    await pressPair("keydown", ["d", "s"]);
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#coordinates").textContent.split(",")[0],
        ) >= 5,
      null,
      { timeout: 45000 },
    );
    await pressPair("keyup", ["d", "s"]);
    await page.keyboard.press("e");
    await page.waitForFunction(
      (herb) =>
        JSON.parse(
          localStorage.getItem("astral_empire_profile_browser-test_v3"),
        )?.resources.herb > herb,
      cacheLoot,
      { timeout: 45000 },
    );
    const gathered = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("astral_empire_profile_browser-test_v3")),
    );
    assert.ok(
      gathered.resources.herb > 0,
      "Actual world gathering should award herbs",
    );
    // Earn the first Codex points by crafting from the collected field materials.
    await page.keyboard.press("c");
    for (let i = 0; i < 2; i++) {
      const potion = page.locator('[data-craft="potion"]');
      if (await potion.isEnabled()) await potion.click();
    }
    await page.keyboard.press("Escape");
    // Test larger trees with a levelled, otherwise unchanged exported profile.
    await page.keyboard.press("o");
    const rankFixture = await page.evaluate(savedState);
    rankFixture.level = Math.max(5, rankFixture.level);
    await page.locator("#save-file").setInputFiles({
      name: "ranked-frontier.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(rankFixture)),
    });
    await page.locator("#panels").waitFor({ state: "hidden" });
    await page.keyboard.press("u");
    await page.getByRole("button", { name: "Add five accuracy" }).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("k");
    await page.getByRole("dialog", { name: "Skill links" }).waitFor();
    await page
      .locator('[data-link-skill="lance"][data-link-index="0"]')
      .selectOption("swift");
    await page
      .locator('[data-link-skill="lance"][data-link-index="1"]')
      .selectOption("chain");
    await page.keyboard.press("Escape");
    await page.keyboard.press("p");
    assert.equal(await page.locator(".talent-node").count(), 331);
    const web = page.locator(".talent-view svg");
    const box = await web.boundingBox();
    const initial = await web.getAttribute("viewBox");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -400);
    await page.waitForFunction(
      (before) =>
        document.querySelector(".talent-view svg").getAttribute("viewBox") !==
        before,
      initial,
    );
    const zoomed = await web.getAttribute("viewBox");
    assert.ok(Number(zoomed.split(" ")[2]) < Number(initial.split(" ")[2]));
    await page.mouse.move(
      box.x + box.width / 2 + 50,
      box.y + box.height / 2 + 30,
    );
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 104,
      box.y + box.height / 2 + 65,
      { steps: 4 },
    );
    await page.mouse.up();
    assert.notEqual(await web.getAttribute("viewBox"), zoomed);
    await page.mouse.wheel(0, 400);
    await page.getByRole("button", { name: "FIT", exact: true }).click();
    await page.locator('[data-passive="blade1"]').click();
    await page
      .locator('.talent-node.allocated[data-passive="blade1"]')
      .waitFor();
    await page.screenshot({ path: resolve(artifacts, "constellation.png") });
    await page.getByRole("button", { name: "Workshop", exact: true }).click();
    await page.getByRole("dialog", { name: "Workshop" }).waitFor();
    await page.keyboard.press("Escape");
    await pressPair("keydown", ["w", "d"]);
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#coordinates").textContent.split(",")[1],
        ) <= -12,
      null,
      { timeout: 45000 },
    );
    await pressPair("keyup", ["w", "d"]);
    await page.locator("#target-hud").waitFor({ state: "visible" });
    await page.keyboard.press("q");
    await page.keyboard.press("1");
    await page.keyboard.press("2");
    await page.waitForTimeout(100);
    await page.screenshot({ path: resolve(artifacts, "combat.png") });
    await page.keyboard.press("o");
    await page
      .getByText("Simulation: C++ / WebAssembly", { exact: false })
      .waitFor();
    await page.getByRole("button", { name: "SAVE & LOG OUT" }).click();
    await page.locator("#profile-name").fill("Browser Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "CONTINUE →" }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor({ state: "visible" });
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("astral_empire_profile_browser-test_v3")),
    );
    assert.equal(saved.links.lance[0], "swift");
    assert.equal(saved.links.lance[1], "chain");
    assert.ok(saved.heroes.includes("sora"));
    assert.ok(saved.passives.includes("blade1"));
    assert.equal(saved.attributes.accuracy, 5);
    assert.equal(saved.race, "veylari");
    assert.equal(saved.calling, "enforcer");
    assert.ok(saved.exploration.changed.includes("bastion-cache-0"));
    assert.ok(saved.position.z < 6);
    await page.reload();
    await page.locator("#loading").waitFor({ state: "hidden" });
    assert.equal(
      await page.locator("#world").getAttribute("data-quality"),
      "low",
    );
    assert.equal(
      await page.evaluate(() =>
        document.body.classList.contains("reduced-motion"),
      ),
      true,
    );
    await page.locator("#profile-name").fill("Browser Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "CONTINUE →" }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor({ state: "visible" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: resolve(artifacts, "mobile.png") });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.evaluate(() =>
      Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(Error("Offline shell installation timed out")),
            15000,
          ),
        ),
      ]),
    );
    await page.context().setOffline(true);
    await page.reload();
    await page.locator("#loading").waitFor({ state: "hidden" });
    await page.locator("#profile-name").fill("Browser Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "CONTINUE →" }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor({ state: "visible" });
    await page.context().setOffline(false);
    assert.deepEqual(errors, []);
    await page.close();
    await testArtisanFlow(browser, url, artifacts);
    await testNurseryFlow(browser, url, artifacts);
    await testMicrovoxelFlow(browser, url, artifacts);
    await testGeologyFlow(browser, url, artifacts);
    console.log(
      "Browser checks passed: WebGL/WASM startup, profile creation, movement, harvesting, support links, passives, workshop, skills, logout/login, reload, mobile layout, offline reload.",
    );
  }
} catch (error) {
  console.error("Browser failed:", error.message);
  console.error(
    await page
      .locator("#auth-error")
      .textContent()
      .catch(() => ""),
  );
  await page
    .screenshot({ path: resolve(artifacts, "failure.png") })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
  server.close();
}
