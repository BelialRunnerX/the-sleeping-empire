import assert from "node:assert/strict";
import { resolve } from "node:path";
import { freshState } from "../engine/simulation.mjs";

export async function testMicrovoxelFlow(browser, url, artifacts) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, r => r.abort());
  const key = "astral_empire_profile_micro-test_v3";
  const login = async label => {
    await page.locator("#profile-name").fill("Micro Test");
    await page.locator("#profile-pin").fill("2468");
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.locator('[data-action="menu-enter"]').click();
    await page.locator("#hud").waitFor();
  };
  const assertFine = async () => {
    assert.equal(await page.locator("#world").getAttribute("data-micro-fine-ready"), "true");
    assert.equal(await page.locator("#world").getAttribute("data-micro-coarse-visible"), "false");
    assert.ok(Number(await page.locator("#world").getAttribute("data-micro-quads")) > 0);
  };
  try {
    await page.goto(url);
    await login("NEW ADVENTURE");
    await page.getByRole("button", { name: "DECLARE CHARACTER" }).click();await page.locator('#panels').waitFor({state:'hidden'});
    await assertFine(); // No interaction or edits needed to create fine geometry.
    await page.screenshot({ path: resolve(artifacts, "microvoxel-fresh-default-camera.png") });
    const fixture = freshState(9372);
    fixture.race = "imperial"; fixture.calling = "enforcer";
    fixture.position = { x: 0, z: 17 };
    await page.keyboard.press("o");
    await page.locator("#save-file").setInputFiles({ name: "micro-fixture.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(fixture)) });
    await assertFine();
    await page.getByText("Microvoxel outcrop", { exact: true }).waitFor();
    await page.screenshot({ path: resolve(artifacts, "microvoxel-before-first-edit.png") });
    await page.keyboard.press("e");
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.microvoxels.recoveredUnits === 1, key);
    const edited = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).microvoxels, key);
    assert.equal(Object.keys(edited.edits).length, 1);
    await page.reload();
    await login("CONTINUE →");
    await assertFine();
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).microvoxels, key), edited);
    await page.keyboard.press("e");
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.microvoxels.recoveredUnits === 2, key);
    assert.deepEqual(errors, []);
    console.log("Microvoxel UI passed: first-load fine mesh, first edit, reload visibility, sparse edit persistence and subsequent mining.");
  } finally { await page.close(); }
}
