import assert from "node:assert/strict";
import {resolve} from "node:path";
import {freshState} from "../engine/simulation.mjs";
// Raw materials are a labelled import fixture. Build, process, craft, reload and collect use real UI.
export async function testArtisanFlow(browser,url,artifacts){
 const page=await browser.newPage({viewport:{width:1440,height:900}}), errors=[];
 page.setDefaultTimeout(60000);page.on("pageerror",e=>errors.push(e.message));
 await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());
 await page.addInitScript(()=>localStorage.setItem("astral_empire_visuals_v1",JSON.stringify({quality:"low",reducedMotion:true})));
 const load=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("astral_empire_profile_artisan-test_v3")));
 try {
  await page.goto(url);await page.locator("#loading").waitFor({state:"hidden"});
  await page.locator("#profile-name").fill("Artisan Test");await page.locator("#profile-pin").fill("2468");
  await page.getByRole("button",{name:"NEW ADVENTURE"}).click();await page.locator('[data-action="menu-enter"]').click();
  await page.getByRole("button",{name:"DECLARE CHARACTER"}).click();await page.locator("#panels").waitFor({state:"hidden"});
  const fixture=freshState(92714);fixture.race="imperial";fixture.calling="enforcer";fixture.position={x:0,z:6};
  Object.assign(fixture.resources,{cobalt:60,stone:30,timber:50,herb:30,fish:30,circuitry:10,loomflaxFibre:3});
  await page.keyboard.press("o");await page.locator("#save-file").setInputFiles({name:"construction-fixture.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(fixture))});
  await page.locator("#panels").waitFor({state:"hidden"});
  await page.keyboard.press("c");await page.locator('[data-craft="loomflax-cord"]').click();
  assert.equal((await load()).resources.fieldCord,1);
  await page.locator("summary").filter({hasText:"Advanced equipment"}).click();
  assert.equal(await page.locator('[data-craft="aethercoil-pistol"]').isDisabled(),true);
  await page.locator('#panels [data-panel="build"]:visible').first().click();
  assert.equal(await page.locator('[data-place-station="foundry"]').isEnabled(),true);
  await page.screenshot({path:resolve(artifacts,"build-workstation-menu.png")});
  const cobalt=(await load()).resources.cobalt;await page.locator('[data-place-station="foundry"]').click();
  let saved=await load(),id=Object.keys(saved.production.stations).find(k=>k.startsWith("placed-"));
  assert.ok(id);assert.equal(saved.production.stations[id].x,0);assert.equal(saved.production.stations[id].z,9);assert.equal(saved.resources.cobalt,cobalt-2);
  assert.equal(await page.locator('[data-place-station="foundry"]').isDisabled(),true);
  await page.locator('#panels [data-panel="artisan"]:visible').first().click();
  await page.locator(`[data-process-station="${id}"][data-process="billet"][data-quantity="3"]`).click();
  await page.locator(`[data-cancel-station="${id}"]`).last().click();
  assert.equal((await load()).production.stations[id].jobs.length,2);
  await page.screenshot({path:resolve(artifacts,"placed-foundry-production.png")});
  await page.keyboard.press("Escape");await page.screenshot({path:resolve(artifacts,"placed-foundry-world.png")});
  await page.keyboard.press("c");await page.locator("summary").filter({hasText:"Advanced equipment"}).click();
  await page.locator('[data-craft="aethercoil-pistol"]').click();assert.ok((await load()).items.some(i=>i.form==="pistol"));
  await page.reload();await page.locator("#loading").waitFor({state:"hidden"});await page.locator("#profile-name").fill("Artisan Test");await page.locator("#profile-pin").fill("2468");
  await page.locator('#login-form button[type="submit"]').click();await page.locator('[data-action="menu-enter"]').click();await page.locator("#hud").waitFor();
  await page.keyboard.press("b");await page.locator('#panels [data-panel="artisan"]:visible').first().click();
  await page.waitForFunction(id=>!document.querySelector(`[data-collect-station="${id}"]`)?.disabled,id,{timeout:60000});
  await page.locator(`[data-collect-station="${id}"]`).click();assert.ok((await load()).resources.billet>=1);
  assert.equal((await load()).production.stations[id].realm,"bastion");
  await page.setViewportSize({width:844,height:390});await page.locator('#panels [data-panel="build"]:visible').first().click();await page.screenshot({path:resolve(artifacts,"build-workstation-mobile.png")});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log("Placeable workstation UI passed: craft/place, saved location, isolated queue/cancel, nearby advanced crafting, reload/collect and mobile layout.");
 }catch(e){await page.screenshot({path:resolve(artifacts,"build-workstation-failure.png")});console.error("Build UI:",await page.locator("#panels").innerText());throw e;}finally{await page.close();}
}
