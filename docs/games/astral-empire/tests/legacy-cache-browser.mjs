import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

// Disposable origin/profile only: never uses an existing player's browser data.
const root = resolve(import.meta.dirname, "..");
const currentSw = await readFile(resolve(root, "sw.js"), "utf8");
const cacheName = currentSw.match(/const CACHE = "([^"]+)"/)[1];
const oldName = "astral-empire-aetherbound-v3-42-test";
const saveKey = "final-release-test-save";
const save = { version: 3, marker: "preserve-me" };
const footer = "V3.25.0 \u00b7 Legacy Web Edition";
let latest = false;
const types = {
  ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript",
  ".css": "text/css", ".wasm": "application/wasm",
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
      .replace(/\/$/, "/index.html");
    if (path === "/probe.html") {
      res.setHeader("content-type", "text/html");
      res.end("<!doctype html><title>Isolated cache upgrade QA</title>");
      return;
    }
    if (path === "/sw.js") {
      res.setHeader("content-type", "text/javascript");
      res.setHeader("cache-control", "no-store");
      // Exercise cache-version replacement using the production worker logic.
      res.end(latest ? currentSw : currentSw.replace(cacheName, oldName));
      return;
    }
    const file = resolve(root, "." + path);
    if (!file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader("content-type", types[extname(path)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));

// Await asynchronous cache inspections explicitly before advancing lifecycle stages.
async function waitAsync(page, predicate, argument) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await page.evaluate(predicate, argument)) return;
    await page.waitForTimeout(200);
  }
  throw Error("Cache lifecycle state did not settle within 60 seconds");
}
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(origin + "/probe.html");
  await page.evaluate(async ({ saveKey, save }) => {
    localStorage.setItem(saveKey, JSON.stringify(save));
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  }, { saveKey, save });
  await waitAsync(page, async () => !!navigator.serviceWorker.controller &&
    (await navigator.serviceWorker.getRegistration()).active?.state === "activated");
  assert.ok((await page.evaluate(() => caches.keys())).includes(oldName));
  latest = true;
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await waitAsync(page, async ({ oldName, cacheName }) => {
    const keys = await caches.keys();
    return keys.includes(cacheName) && !keys.includes(oldName) &&
      (await (await caches.open(cacheName)).keys()).length > 100 &&
      (await navigator.serviceWorker.getRegistration()).active?.state === "activated";
  }, { oldName, cacheName });
  await page.context().setOffline(true);
  await page.goto(origin + "/index.html");
  await page.locator("#loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator(".landing-footer span").innerText(), footer);
  await page.reload();
  await page.locator("#loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator(".landing-footer span").innerText(), footer);
  const report = await page.evaluate(async ({ cacheName, saveKey }) => ({
    names: await caches.keys(),
    entries: (await (await caches.open(cacheName)).keys()).length,
    save: JSON.parse(localStorage.getItem(saveKey)),
  }), { cacheName, saveKey });
  assert.deepEqual(report.names, [cacheName]);
  assert.ok(report.entries > 100, "Final production cache must contain shell assets");
  assert.deepEqual(report.save, save);
  for (const name of ["app", "native-density", "terrain-adaptive", "terrain-field", "terrain-volume"]) {
    const route = "/engine/" + name + ".mjs";
    const expected = await readFile(resolve(root, "." + route), "utf8");
    const cached = await page.evaluate(async ({ cacheName, route }) => {
      const response = await (await caches.open(cacheName)).match(route);
      return response ? response.text() : null;
    }, { cacheName, route });
    assert.equal(cached, expected, "Current module cached byte-for-byte: " + name);
  }
  console.log(`PASS cache upgrade to ${cacheName}; ${report.entries} resources; old cache removed; local save preserved; legacy footer visible after two offline loads; five changed modules match current files byte-for-byte.`);
} finally {
  if (browser) await browser.close();
  server.close();
}
