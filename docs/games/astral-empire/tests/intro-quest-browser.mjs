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
  await page.locator('#profile-name').fill('Quest Test');await page.locator('#profile-pin').fill('2468');
  await page.getByRole('button',{name:'NEW ADVENTURE',exact:true}).click();
  const key='astral_empire_profile_quest-test_v3';
  await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.statistics.gathers=5;localStorage.setItem(k,JSON.stringify(s));},key);
  await page.reload();await page.locator('#profile-name').fill('Quest Test');await page.locator('#profile-pin').fill('2468');await page.locator('#login-form button[type=submit]').click();await page.locator('[data-action="menu-enter"]').click();
  await page.getByRole('button',{name:'DECLARE CHARACTER',exact:true}).click();
  await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'j',bubbles:true})));
  await page.locator('[data-quest="gather"]').waitFor();
  assert.equal(await page.locator('[data-quest="gather"]').isEnabled(),true);
  assert.equal(await page.locator('[data-quest="warden"]').isEnabled(),false);
  await page.locator('[data-quest="gather"]').click();
  assert.equal(await page.locator('[data-quest="gather"]').textContent(),'CLAIMED');
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert(saved.claimed.includes('gather'));assert.equal(saved.gold,1950);
  await page.screenshot({path:`.artifacts/intro-quest-${size.width}.png`});
  assert.deepEqual(errors,[]);await page.close();console.log('Quest UI PASS',size);
 }
} finally {await browser.close();server.close();}
