import assert from "node:assert/strict";
import { resolve } from "node:path";
import { freshState } from "../engine/simulation.mjs";

// A clearly seeded import fixture supplies raw stock; the existing browser
// scenario separately proves real world harvesting. All production actions,
// station travel, timers, collection, crafting and equip use the player UI.
export async function testArtisanFlow(browser, url, artifacts) {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    }),
    errors = [];
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      /Shader Error|THREE.WebGLProgram|GL_INVALID/.test(m.text())
    )
      errors.push(m.text());
  });
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "astral_empire_visuals_v1",
      JSON.stringify({
        quality: "low",
        reducedMotion: false,
      }),
    ),
  );
  const load = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("astral_empire_profile_artisan-test_v3")),
    );
  const panel = () => page.keyboard.press("b");
  const close = () => page.keyboard.press("Escape");
  const walk = async (keys, axis, threshold, direction) => {
    await close();
    // Deliver both halves of an isometric diagonal before the next simulation
    // frame. Separate CDP round trips can leave a lone key held for a slow
    // software-rendered frame, drifting the fixed route into the cottage.
    await page.evaluate((keys) => {
      for (const key of keys)
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true }),
        );
    }, keys);
    try {
      await page.waitForFunction(
        ({ axis, threshold, direction, keys }) => {
          const position = document
            .querySelector("#coordinates")
            .textContent.split(",")
            .map(Number);
          const reached = direction > 0
            ? position[axis] >= threshold
            : position[axis] <= threshold;
          // Stop in the same browser task that observes arrival. A later CDP
          // round trip can leave keys held across slow software-rendered frames.
          if (reached) for (const key of keys)
            document.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
          return reached;
        },
        { axis, threshold, direction, keys },
        { timeout: 45000 },
      );
    } finally {
      await page.evaluate((keys) => {
        for (const key of keys)
          document.dispatchEvent(
            new KeyboardEvent("keyup", { key, bubbles: true }),
          );
      }, keys);
    }
    await panel();
  };
  const collect = async (id) => {
    const button = page.locator(`[data-collect-station="${id}"]`);
    await button.waitFor();
    await page.waitForFunction(
      (id) =>
        !document.querySelector(`[data-collect-station="${id}"]`)?.disabled,
      id,
      { timeout: 45000 },
    );
    await button.click();
  };
  try {
    await page.goto(url);
    await page.locator("#loading").waitFor({ state: "hidden" });
    await page.locator("#profile-name").fill("Artisan Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "NEW ADVENTURE" }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor();
    await page.getByRole("button", { name: "DECLARE CHARACTER" }).click();await page.locator('#panels').waitFor({state:'hidden'});
    const fixture = freshState(92714);
    fixture.race = "imperial";
    fixture.calling = "enforcer";
    Object.assign(fixture.resources, {
      cobalt: 60,
      stone: 30,
      timber: 50,
      electrum: 2,
      herb: 30,
      fish: 30,
    });
    fixture.position = { x: -10, z: 5 };
    await page.keyboard.press("o");
    await page.locator("#save-file").setInputFiles({
      name: "artisan-fixture.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
    await page.locator("#panels").waitFor({ state: "hidden" });
    await page.keyboard.press("e");
    await page.getByRole("dialog", { name: "Atelier", exact: true }).waitFor();
    await page.locator('[data-build-station="foundry"]').click();
    await page.locator('[data-process="billet"][data-quantity="3"]').click();
    const stockBefore = (await load()).resources.cobalt;
    await page.locator('[data-cancel-station="foundry"]').last().click();
    assert.equal((await load()).resources.cobalt, stockBefore + 2);
    await page.screenshot({
      path: resolve(artifacts, "atelier-production.png"),
    });
    await page.reload();
    await page.locator("#loading").waitFor({ state: "hidden" });
    await page.locator("#profile-name").fill("Artisan Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "CONTINUE →" }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor();
    await panel();
    assert.equal((await load()).production.stations.foundry.tier, 1);
    await collect("foundry");
    assert.ok((await load()).resources.billet >= 1);
    // Move east before heading north to go around the cottage's collision box.
    await walk(["d", "s"], 0, -8, 1);
    await walk(["w", "d"], 1, -4, -1);
    await page.locator('[data-build-station="joinery"]').click();
    await page.locator('[data-process="plank"][data-quantity="1"]').click();
    await collect("joinery");
    await walk(["s", "a"], 1, 4, 1);
    const foundry = (await load()).production.stations.foundry;
    if (foundry.completed || foundry.jobs.length) await collect("foundry");
    await page.locator('[data-upgrade-station="foundry"]').click();
    assert.equal((await load()).production.stations.foundry.tier, 2);
    await walk(["d", "s"], 0, 7, 1);
    await page.locator('[data-build-station="alchemy"]').click();
    await page.locator('[data-process="extract"][data-quantity="1"]').click();
    await collect("alchemy");
    assert.equal((await load()).resources.extract, 2);
    await walk(["a", "w"], 0, -8, -1);
    await walk(["w", "d"], 1, -4, -1);
    await page.locator('[data-process="plank"][data-quantity="1"]').click();
    await collect("joinery");
    await page.getByRole("button", { name: "Workshop", exact: true }).click();
    await page.locator('[data-craft="artisan-mantle"]').click();
    let saved = await load();
    const item = saved.items.at(-1);
    assert.equal(item.name, "Artisan's starweave");
    assert.equal(item.rarity, "epic");
    assert.equal(item.affixes.length, 4);
    await page.getByRole("button", { name: "Equipment", exact: true }).click();
    await page
      .locator(`[data-item="${item.id}"][data-item-action="equip"]`)
      .click();
    assert.equal((await load()).equipped.armor, item.id);
    await page.getByRole("button", { name: "Workshop", exact: true }).click();
    await page.locator('[data-craft="piercer-spear"]').click();
    const spear = (await load()).items.at(-1);
    await page.locator('[data-craft="kinetic-shield"]').click();
    const shield = (await load()).items.at(-1);
    await page.getByRole("button", { name: "Equipment", exact: true }).click();
    const spearAction = (action) =>
      page.locator(`[data-item="${spear.id}"][data-item-action="${action}"]`);
    for (let i = 0; i < 4; i++) await spearAction("temper").click();
    await spearAction("ascend-force").click();
    await spearAction("equip").click();
    await page
      .locator(`[data-item="${shield.id}"][data-item-action="equip"]`)
      .click();
    await page.screenshot({
      path: resolve(artifacts, "foundry-ascension-menu.png"),
    });
    await close();
    await page.screenshot({ path: resolve(artifacts, "atelier-world.png") });
    await panel();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: resolve(artifacts, "atelier-mobile.png") });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await close();
    await page.keyboard.press("o");
    await page.getByRole("button", { name: "SAVE & LOG OUT" }).click();
    await page.locator("#profile-name").fill("Artisan Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: "CONTINUE →" }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor();
    saved = await load();
    assert.equal(saved.equipped.armor, item.id);
    assert.equal(saved.equipped.offhand, shield.id);
    assert.equal(saved.items.find((i) => i.id === spear.id).ascension, 1);
    assert.equal(saved.production.stations.foundry.tier, 2);
    assert.ok(saved.statistics.processed >= 5);
    assert.deepEqual(errors, []);
    console.log(
      "Artisan UI passed: seeded raw-stock import, actual station travel, build, batch reservation/cancel refund, live timers, reload, collect, upgrade, refine, epic craft/equip, mobile and relog persistence.",
    );
  } catch (error) {
    await page
      .screenshot({ path: resolve(artifacts, "artisan-failure.png") })
      .catch(() => {});
    throw error;
  } finally {
    await page.close();
  }
}
