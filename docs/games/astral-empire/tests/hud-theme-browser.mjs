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
 await page.goto(url); await page.locator('#loading').waitFor({state:'hidden'});
 await page.locator('#profile-name').fill('Glass review'); await page.locator('#profile-pin').fill('2468');
 await page.getByRole('button',{name:'NEW ADVENTURE'}).click();
 await page.locator('[data-action="menu-enter"]').click();
 await page.getByRole('button',{name:'DECLARE CHARACTER'}).click();await page.locator('#panels').waitFor({state:'hidden'});
 await page.waitForTimeout(1000);
 await page.screenshot({path:resolve(artifacts,'hud-desktop.png')});
 await page.keyboard.press('i'); await page.getByRole('dialog').waitFor({state:'visible'});
 await page.locator('.inventory-search input').fill('unlikely-no-result'); assert.equal(await page.locator('.grid-3 .card:visible').count(),0); await page.locator('.inventory-search input').fill(''); await page.screenshot({path:resolve(artifacts,'hud-inventory.png')});
 for(const id of ['skills','passives','journal','settings','inventory']){
  await page.locator(`#panels [data-panel="${id}"]`).click();
  await page.waitForTimeout(100);
  assert(await page.getByRole('dialog').isVisible());
  if(id==='skills'||id==='passives')await page.screenshot({path:resolve(artifacts,`hud-${id}.png`)});
 }
 for(const [name,w,h] of [['portrait',393,852],['landscape',852,393],['short-landscape',607,279]]) {
  await page.setViewportSize({width:w,height:h});
  await page.locator('#control-scheme').selectOption('touch',{force:true});
  await page.waitForTimeout(200);
  const box=await page.locator('.panel-window').boundingBox();
  assert(box.x>=0 && box.y>=0 && box.x+box.width<=w+1 && box.y+box.height<=h+1,`${name} panel bounds`);
  await page.screenshot({path:resolve(artifacts,`hud-panel-${name}.png`)});
  await page.locator('.panel-close').click();
  await page.screenshot({path:resolve(artifacts,`hud-${name}.png`)});
  await page.keyboard.press('i');
 }
 assert.deepEqual(errors,[]);console.log('HUD visual/bounds checks passed');
} finally {await browser.close();server.close();}