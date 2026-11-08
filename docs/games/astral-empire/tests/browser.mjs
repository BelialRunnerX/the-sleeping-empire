import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { testArtisanFlow } from "./artisan-browser.mjs";
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
  if (process.env.ARTISAN_ONLY === "1") {
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
    await page.locator("#hud").waitFor({ state: "visible" });
    console.log("Profile entered world");
    await page.waitForFunction(
      () => document.querySelector("#save-state")?.textContent === "Saved",
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(artifacts, "world.png") });
    assert.equal(
      await page.locator("#world").getAttribute("data-art-style"),
      "illustrated",
    );
    await page.keyboard.press("o");
    await page.locator("#render-style").selectOption("model");
    assert.equal(
      await page.locator("#world").getAttribute("data-art-style"),
      "model",
    );
    await page.locator("#render-style").selectOption("illustrated");
    assert.equal(
      await page.locator("#world").getAttribute("data-art-style"),
      "illustrated",
    );
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
    await page.mouse.move(1100 - Math.PI / 0.006, 430);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(1100, 430);
    await page.mouse.up({ button: "right" });
    await page.mouse.wheel(0, 600);
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
    await page.getByRole("button", { name: "RECRUIT SORA · FREE" }).click();
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
    await page.keyboard.press("h");
    await page.locator('[data-hero="mira"]').click();
    await page.keyboard.press("Escape");
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
    await page.getByRole("button", { name: "Heroes", exact: true }).click();
    await page.locator('[data-hero="kael"]').click();
    await page.keyboard.press("Escape");
    // In the 45-degree view, D+S travels along positive world X to the herb.
    await page.keyboard.down("d");
    await page.keyboard.down("s");
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#coordinates").textContent.split(",")[0],
        ) >= 5,
      null,
      { timeout: 45000 },
    );
    await page.keyboard.up("d");
    await page.keyboard.up("s");
    await page.keyboard.press("e");
    await page.waitForFunction(
      () =>
        JSON.parse(
          localStorage.getItem("astral_empire_profile_browser-test_v3"),
        )?.resources.herb > 0,
      null,
      { timeout: 45000 },
    );
    const gathered = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("astral_empire_profile_browser-test_v3")),
    );
    assert.ok(
      gathered.resources.herb > 0,
      "Actual world gathering should award herbs",
    );
    await page.keyboard.down("w");
    await page.waitForTimeout(800);
    await page.keyboard.up("w");
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
    await page.locator('[data-passive="blade1"]').click();
    await page
      .locator('.talent-node.allocated[data-passive="blade1"]')
      .waitFor();
    await page.screenshot({ path: resolve(artifacts, "constellation.png") });
    await page.getByRole("button", { name: "Workshop", exact: true }).click();
    await page.getByRole("dialog", { name: "Workshop" }).waitFor();
    await page.keyboard.press("Escape");
    await page.keyboard.down("w");
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#coordinates").textContent.split(",")[1],
        ) <= -12,
      null,
      { timeout: 45000 },
    );
    await page.keyboard.up("w");
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
    await page.locator("#hud").waitFor({ state: "visible" });
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("astral_empire_profile_browser-test_v3")),
    );
    assert.equal(saved.links.lance[0], "swift");
    assert.equal(saved.links.lance[1], "chain");
    assert.ok(saved.heroes.includes("sora"));
    assert.ok(saved.passives.includes("blade1"));
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
    await page.locator("#hud").waitFor({ state: "visible" });
    await page.context().setOffline(false);
    assert.deepEqual(errors, []);
    await testArtisanFlow(browser, url, artifacts);
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
