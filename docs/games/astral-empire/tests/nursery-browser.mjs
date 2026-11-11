import assert from "node:assert/strict";
import { resolve } from "node:path";
import { freshState } from "../engine/simulation.mjs";

export async function testNurseryFlow(browser, url, artifacts) {
  await runNurseryFlow(browser, url, artifacts, false);
  await runNurseryFlow(browser, url, artifacts, true);
}

async function runNurseryFlow(browser, url, artifacts, mobile) {
  const page = await browser.newPage({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  const errors = [];
  page.setDefaultTimeout(30_000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.addInitScript(() => {
    localStorage.setItem(
      "astral_empire_visuals_v1",
      JSON.stringify({ quality: "low" }),
    );
    const realNow = Date.now.bind(Date);
    Date.now = () =>
      realNow() + Number(localStorage.getItem("nursery-test-time"));
  });
  const openPanel = async (id, label) => {
    const nav = page.locator(".mobile-panel-nav");
    if (await nav.isVisible()) await nav.selectOption(id);
    else await page.getByRole("button", { name: label, exact: true }).click();
  };
  const key = "astral_empire_profile_nursery-test_v3";
  const load = () =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
  const openNursery = () =>
    openPanel("nursery", "Hydroponics");
  const login = async (label) => {
    await page.locator("#profile-name").fill("Nursery Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: label }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor();
  };
  try {
    await page.goto(url);
    await login("NEW ADVENTURE");
    await page.getByRole("button", { name: "DECLARE CHARACTER" }).click();await page.locator('#panels').waitFor({state:'hidden'});
    const fixture = freshState(9372);
    fixture.race = "imperial";
    fixture.calling = "enforcer";
    fixture.level = 6;
    // Saved foundry beside the nursery supplies the nearby advanced-crafting requirement.
    fixture.production.stations["placed-250"]={kind:"foundry",realm:"bastion",x:-2,z:13,tier:1,jobs:[],output:{},xp:{},completed:0};
    fixture.position = { x: 5.4, z: 9.1 };
    Object.assign(fixture.resources, {
      stone: 2,
      timber: 2,
      cobalt: 1,
      billet: 2,
      plank: 2,
      circuitry: 4,
      fieldCord: 4,
      downbloomTuft: 4,
      electrum: 1,
    });
    await page.keyboard.press("o");
    await page.locator("#save-file").setInputFiles({
      name: "nursery-fixture.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
    await page.getByText("Loomflax", { exact: true }).waitFor();
    await page.keyboard.press("e");
    await page.waitForFunction(
      (key) =>
        JSON.parse(localStorage.getItem(key))?.resources.loomflaxSeed === 2,
      key,
    );
    await page.keyboard.press("l");
    await openNursery();
    await page.getByRole("button", { name: /TRAVEL TO HYDROPONICS/ }).click();
    await page
      .getByRole("dialog", { name: "Hydroponics", exact: true })
      .waitFor();
    await page.getByRole("button", { name: /BUILD HYDROPONICS/ }).click();
    // Dismiss/reopen must preserve construction without charging twice.
    await page.getByRole("button", { name: "Close panel", exact: true }).click();
    await page.keyboard.press("l");
    await openNursery();
    assert.equal((await load()).nursery.plots.length, 2);
    await page.locator('[data-plant-crop="loomflax"][data-bed="0"]').click();
    assert.equal(
      await page.locator('[data-harvest-crop="0"]').isDisabled(),
      true,
    );
    await page.getByRole("button", { name: /INSTALL NUTRIENT ARRAY/ }).click();
    const planted = (await load()).nursery;
    assert.equal(planted.tier, 2);
    assert.equal(planted.plots.length, 4);
    assert.equal(planted.plots[0].tier, 1);
    await page.locator('[data-plant-crop="loomflax"][data-bed="2"]').click();
    await openPanel("settings", "Settings");
    await page.getByRole("button", { name: "SAVE & LOG OUT" }).click();
    await page.evaluate(() =>
      localStorage.setItem("nursery-test-time", "211000"),
    );
    // Exercise real cached-shell loading, not merely simulated elapsed time.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.context().setOffline(true);
    await page.reload();
    await login("CONTINUE →");
    await page.keyboard.press("e");
    await page
      .getByRole("dialog", { name: "Hydroponics", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByText("Mature · ready to harvest", { exact: true })
        .count(),
      2,
    );
    await page.screenshot({
      path: resolve(artifacts, `dawnwake-hydroponics-${mobile ? "mobile" : "desktop"}-panel.png`),
    });
    const before = (await load()).resources.loomflaxFibre;
    await page.locator('[data-harvest-crop="0"]').click();
    await page.locator('[data-harvest-crop="2"]').click();
    const after = await load();
    assert.equal(after.nursery.plots.filter(Boolean).length, 0);
    assert.equal(after.resources.loomflaxSeed, 2);
    assert.ok(after.resources.loomflaxFibre >= before + 2);
    assert.equal(await page.locator('[data-harvest-crop]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await openPanel("crafting", "Workshop");
    await page.locator("summary").filter({hasText:"Advanced equipment"}).click();
    await page.locator('[data-craft="cultivator-lattice"]').click();
    const charm = (await load()).items.find(item => item.frame === "cultivator");
    assert.ok(charm);
    await openPanel("inventory", "Equipment");
    await page.locator(`[data-item="${charm.id}"][data-item-action="equip"]`).click();
    assert.equal((await load()).equipped.charm, charm.id);
    await page.getByText("Character statistics", {exact:true}).click();
    await page.getByText("FIBRE FORTUNE", { exact: true }).waitFor();
    await page.reload();
    await login("CONTINUE →");
    assert.equal((await load()).items.find(item => item.id === charm.id).frame, "cultivator");
    assert.deepEqual(errors, []);
    console.log(
      `Hydroponics ${mobile ? "mobile" : "desktop"} UI passed: wild seeds, route, construction, close/reopen, two crop speeds, offline relog, harvest and Fortune charm craft/equip/reload.`,
    );
  } finally {
    await page.close();
  }
}
