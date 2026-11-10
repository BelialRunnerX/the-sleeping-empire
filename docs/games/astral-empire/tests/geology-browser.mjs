import assert from "node:assert/strict";
import { resolve } from "node:path";
import { freshState } from "../engine/simulation.mjs";
import { RAW_COBALT, COBALT_INGOT } from "../engine/geology-field.mjs";

export async function testGeologyFlow(browser, url, artifacts) {
  for (const mobile of [false, true]) await run(browser, url, artifacts, mobile);
}
async function run(browser, url, artifacts, mobile) {
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem("astral_empire_visuals_v1", JSON.stringify({ quality: "low" }));
    const now = Date.now.bind(Date);
    Date.now = () => now() + Number(localStorage.getItem("geology-test-time"));
  });
  const openPanel = async (id, label) => {
    const nav = page.locator(".mobile-panel-nav");
    if (await nav.isVisible()) await nav.selectOption(id);
    else await page.getByRole("button", { name: label, exact: true }).click();
  };
  const key = "astral_empire_profile_geology-test_v3";
  const load = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  const click = locator => mobile ? locator.tap() : locator.click();
  const login = async label => {
    await page.locator("#profile-name").fill("Geology Test");
    await page.locator("#profile-pin").fill("2468");
    await click(page.getByRole("button", { name: label, exact: true }));
    await click(page.locator('[data-action="menu-enter"]'));
    await page.locator("#hud").waitFor();
  };
  const walk = async (keys, axis, threshold) => {
    await page.evaluate(keys => { for (const key of keys) document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); }, keys);
    try {
      await page.waitForFunction(({axis,threshold}) => Number(document.querySelector("#coordinates").textContent.split(",")[axis]) <= threshold, {axis,threshold}, {timeout:45000});
    } finally {
      await page.evaluate(keys => { for (const key of keys) document.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true })); }, keys);
    }
  };
  try {
    await page.goto(url);
    await login("NEW ADVENTURE");
    await click(page.getByRole("button", { name: "DECLARE CHARACTER", exact: true }));await page.locator('#panels').waitFor({state:'hidden'});
    // Only initial legacy construction stock is seeded. Canonical raw/ingots
    // must be obtained through the live drill and Foundry UI.
    const fixture = freshState(9372);
    fixture.race = "imperial"; fixture.calling = "enforcer"; fixture.level = 4;
    fixture.position = { x: -1, z: 17 };
    Object.assign(fixture.resources, { stone: 5, cobalt: 4, timber: 8, fieldCord: 2, circuitry: 1 });
    await page.keyboard.press("o");
    await page.locator("#save-file").setInputFiles({name:"geology-fixture.json", mimeType:"application/json", buffer:Buffer.from(JSON.stringify(fixture))});
    await page.locator("#panels").waitFor({state:"hidden"});
    await page.keyboard.press("l");
    await openPanel("geology", "Core drilling");
    await click(page.getByRole("button", {name:"TRAVEL TO CORE DRILL", exact:true}));
    await page.getByRole("dialog", {name:"Core drilling", exact:true}).waitFor();
    await click(page.locator("[data-build-core]"));
    assert.equal((await load()).geology.built, true);
    assert.equal((await load()).resources.cobalt, 2);
    await click(page.getByRole("button", {name:"Close panel", exact:true}));
    await page.screenshot({path:resolve(artifacts, `core-drill-${mobile ? "mobile" : "desktop"}-world.png`)});
    await page.keyboard.press("l");
    await openPanel("geology", "Core drilling");
    assert.equal(await page.locator("[data-build-core]").count(), 0);
    for (let n=0;n<2;n++) {
      await page.waitForFunction(() => !document.querySelector("[data-extract-core]").disabled);
      await click(page.locator("[data-extract-core]"));
    }
    const drilled = await load();
    assert.equal(drilled.geology.mined.length, 2);
    assert.ok(drilled.resources[RAW_COBALT] >= 2);
    assert.equal(drilled.resources.cobalt, 2);
    const mined = [...drilled.geology.mined];
    await click(page.locator('[data-core-field="1"]'));
    await click(page.locator('[data-core-field="-1"]'));
    assert.deepEqual((await load()).geology.mined, mined);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path:resolve(artifacts, `core-drill-${mobile ? "mobile" : "desktop"}-panel.png`)});
    await click(page.getByRole("button", {name:"Close panel", exact:true}));
    // Actual navigation, not save teleportation, from drill to Foundry.
    await walk(["a","w"], 0, -10);
    await walk(["w","d"], 1, 7);
    await page.keyboard.press("b");
    await click(page.locator('[data-build-station="foundry"]'));
    const beforeQueue = await load();
    await click(page.locator('[data-process="source-cobalt-ingot"][data-quantity="1"]'));
    await click(page.locator('[data-process="source-cobalt-ingot"][data-quantity="1"]'));
    assert.equal((await load()).resources[RAW_COBALT], beforeQueue.resources[RAW_COBALT] - 2);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.context().setOffline(true);
    await page.evaluate(() => localStorage.setItem("geology-test-time", "25000"));
    await page.reload();
    await login("CONTINUE →");
    await page.keyboard.press("b");
    await click(page.locator('[data-collect-station="foundry"]'));
    assert.equal((await load()).resources[COBALT_INGOT], 2);
    assert.deepEqual((await load()).geology.mined, mined);
    await openPanel("crafting", "Workshop");
    await click(page.locator('[data-craft="cobalt-assay-lens"]'));
    const crafted = await load(), armor = crafted.items.find(item => item.frame === "assay");
    assert.ok(armor);
    assert.equal(crafted.resources[COBALT_INGOT], 0);
    await openPanel("inventory", "Equipment");
    await click(page.locator(`[data-item="${armor.id}"][data-item-action="equip"]`));
    await page.reload();
    await login("CONTINUE →");
    const restored = await load();
    assert.equal(restored.equipped.armor, armor.id);
    assert.equal(restored.items.find(item => item.id === armor.id).frame, "assay");
    assert.deepEqual(restored.geology.mined, mined);
    assert.deepEqual(errors, []);
    console.log(`Geology ${mobile ? "mobile" : "desktop"} passed: drill route/build/extract, finite depletion, canonical processing, offline collection, assay craft/equip/reload.`);
  } catch (error) {
    await page.screenshot({path:resolve(artifacts, `geology-${mobile ? "mobile" : "desktop"}-failure.png`)}).catch(()=>{});
    throw error;
  } finally { await page.close(); }
}
