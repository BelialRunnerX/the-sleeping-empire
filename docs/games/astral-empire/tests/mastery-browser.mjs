import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { freshState } from "../engine/progression.mjs";
import { SKILLS } from "../engine/content.mjs";



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
  await page.addInitScript(() => localStorage.setItem("astral_empire_visuals_v1", JSON.stringify({quality:"low", reducedMotion:true})));
  await page.goto(url);
  await page.locator("#loading").waitFor({state:"hidden"});
  await page.locator("#profile-name").fill("Mastery Test");
  await page.locator("#profile-pin").fill("2468");
  await page.getByRole("button",{name:"NEW ADVENTURE"}).click();
  await page.locator('[data-action="menu-enter"]').click();
  await page.getByRole("button",{name:"DECLARE CHARACTER"}).click();
  await page.locator("#panels").waitFor({state:"hidden"});
  const fixture=freshState(92714); fixture.race="imperial";fixture.calling="enforcer";fixture.level=5;fixture.gold=3000;fixture.professions.mining=750;
  await page.keyboard.press("o");
  await page.locator("#save-file").setInputFiles({name:"mastery-fixture.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(fixture))});
  await page.locator("#panels").waitFor({state:"hidden"});
  await page.keyboard.press("k");
  const id=SKILLS.find(s=>s.id!=="strike").id;
  const train=page.locator(`[data-train-skill="${id}"]`);
  await train.click();
  assert.match(await page.locator("#panels").innerText(),/Training rank 1\/5/);
  await train.click();
  assert.equal(await train.isDisabled(),true);
  const load=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("astral_empire_profile_mastery-test_v3")));
  assert.equal((await load()).skillTraining[id],2);assert.equal((await load()).gold,2500);
  await page.screenshot({path:resolve(artifacts,"mastery-skills-desktop.png")});
  await page.locator('#panels [data-panel="lifeskills"]').click();
  assert.match(await page.locator("#panels").innerText(),/2\/3 bonuses active/);
  await page.screenshot({path:resolve(artifacts,"mastery-careers-desktop.png")});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator("#panels article").filter({hasText:"Mineral extraction"}).scrollIntoViewIfNeeded();
  await page.screenshot({path:resolve(artifacts,"mastery-careers-mobile.png")});
  await page.reload();await page.locator("#loading").waitFor({state:"hidden"});
  await page.locator("#profile-name").fill("Mastery Test");await page.locator("#profile-pin").fill("2468");
  await page.getByRole("button",{name:/CONTINUE/}).click();
  await page.locator('[data-action="menu-enter"]').click();
  await page.keyboard.press("k");
  assert.match(await page.locator("#panels").innerText(),/Training rank 2\/5/);
  assert.equal((await load()).gold,2500);
  // The integrated release adds both mastery and the deterministic field compiler.
  // Assert the offline shell retains them before testing a real offline sign-in.
  await page.evaluate(() => navigator.serviceWorker.ready);
  assert.equal(await page.evaluate(async () => !!(await caches.match(new URL('./engine/mastery.mjs', location.href)))), true);
  assert.equal(await page.evaluate(async () => !!(await caches.match(new URL('./engine/universe/field-program.mjs', location.href)))), true);
  await page.context().setOffline(true);
  await page.reload();await page.locator("#loading").waitFor({state:"hidden"});
  await page.locator("#profile-name").fill("Mastery Test");await page.locator("#profile-pin").fill("2468");
  await page.getByRole("button",{name:/CONTINUE/}).click();
  await page.locator('[data-action="menu-enter"]').click();
  await page.keyboard.press("k");
  assert.match(await page.locator("#panels").innerText(),/Training rank 2\/5/);
  await page.context().setOffline(false);
  assert.deepEqual(errors,[]);
  console.log("Mastery browser passed: purchases, level gating, gold, save/relogin, careers, mobile layout, offline reload.");
} finally { await browser.close(); await new Promise(r=>server.close(r)); }


