import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root))throw Error();res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.wasm':'application/wasm'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run']});
await mkdir('.artifacts',{recursive:true});
try {
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]) {
  const page=await browser.newPage({viewport:size,hasTouch:size.width<1000,isMobile:size.width<1000});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#profile-name').fill('Menu Test');await page.locator('#profile-pin').fill('2468');
  await page.getByRole('button',{name:'NEW ADVENTURE',exact:true}).click();
  await page.locator('[data-action="menu-enter"]').waitFor();
  assert.equal(await page.locator('#hud').isVisible(),false);
  const key='astral_empire_profile_menu-test_v3';
  const saved=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.screenshot({path:`.artifacts/main-menu-${size.width}.png`});
  const bounds=await page.locator('.main-menu-shell').boundingBox();assert(bounds.x>=0 && bounds.x+bounds.width<=size.width+1);
  if (size.width === 1440) {
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'menu-new');
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'menu-enter');
  }
  await page.locator('[data-action="menu-settings"]').click();
  await page.locator('#graphics-quality').selectOption('low');
  await page.locator('[data-assist="autoFire"]').click();
  await page.locator('[data-action="menu-back"]').click();
  await page.locator('[data-action="menu-new"]').click();
  await page.locator('#profile-name').fill('Menu Test');await page.locator('#profile-pin').fill('2468');
  await page.getByRole('button',{name:'NEW ADVENTURE',exact:true}).click();
  assert.match(await page.locator('#auth-error').textContent(),/already exists/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);
  await page.locator('[data-action="menu-back"]').click();
  await page.locator('[data-action="menu-enter"]').click();
  await page.getByRole('button',{name:'DECLARE CHARACTER',exact:true}).click();
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "o", bubbles: true })));
  await page.locator('[data-action="main-menu"]').click();
  await page.locator('[data-action="menu-enter"]').waitFor();
  assert.equal(await page.locator('#hud').isVisible(),false);
  const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  await page.locator('[data-action="menu-signout"]').click();
  await page.locator('#profile-name').fill('Menu Test');await page.locator('#profile-pin').fill('2468');
  await page.locator('#login-form button[type=submit]').click();
  await page.locator('[data-action="menu-enter"]').waitFor();
  const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.deepEqual(before.position,after.position);assert.equal(before.race,after.race);assert.equal(before.seed,after.seed);
  assert.deepEqual(errors,[]);await page.close();console.log('Main menu PASS',size);
 }
} finally {await browser.close();server.close();}
