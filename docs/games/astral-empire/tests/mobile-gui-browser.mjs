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
 for(const size of [{width:393,height:852},{width:852,height:393},{width:607,height:279},{width:320,height:568}]){
  const page=await browser.newPage({viewport:size,hasTouch:true,isMobile:true}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#loading').waitFor({state:'hidden'});await page.screenshot({path:`.artifacts/gui-profile-${size.width}.png`}); const gw=await page.locator('#landing').evaluate(e=>[e.clientWidth,e.scrollWidth]);assert(gw[1]<=gw[0]+1,'profile horizontal overflow');
  await page.locator('#profile-name').fill('GUI audit');await page.locator('#profile-pin').fill('2468');
  await page.getByRole('button',{name:'NEW ADVENTURE',exact:true}).click();
  await page.waitForTimeout(500); await page.screenshot({path:`.artifacts/gui-menu-${size.width}.png`});
  await page.locator('[data-action="menu-enter"]').click();
  await page.screenshot({path:`.artifacts/gui-codex-${size.width}.png`});
  await page.getByRole('button',{name:'DECLARE CHARACTER',exact:true}).click();await page.locator('#panels').waitFor({state:'hidden'});
  await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'i',bubbles:true})));
  for(const id of ['inventory','skills','passives','lifeskills','crafting','artisan','nursery','geology','heroes','codex','journal','realms','frontier','settings']){
   await page.locator('.mobile-panel-nav').selectOption(id);await page.waitForTimeout(80);
   const audit=await page.evaluate(()=>{const b=document.querySelector('.panel-body'),w=document.querySelector('.panel-window');return {body:[b.clientWidth,b.scrollWidth,b.clientHeight,b.scrollHeight],window:[w.getBoundingClientRect().x,w.getBoundingClientRect().y,w.getBoundingClientRect().width,w.getBoundingClientRect().height],overflow:[...b.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>b.getBoundingClientRect().right+2).slice(0,5).map(e=>e.className||e.tagName)}});
   assert(audit.body[1]<=audit.body[0]+1,`${size.width} ${id} horizontal overflow`); assert(audit.window[0]>=0 && audit.window[1]>=0 && audit.window[0]+audit.window[2]<=size.width+1 && audit.window[1]+audit.window[3]<=size.height+1,`${id} viewport bounds`);console.log(size.width,id,JSON.stringify(audit));
   await page.screenshot({path:`.artifacts/gui-${id}-${size.width}.png`});
  }
  assert.deepEqual(errors,[]);
  // Simulate Safari chrome + notch/indicator insets without relying on a physical device.
  await page.evaluate(({width,height})=>{const s=document.documentElement.style;s.setProperty('--view-left','10px');s.setProperty('--view-top','20px');s.setProperty('--view-width',(width-20)+'px');s.setProperty('--view-height',(height-60)+'px');for(const side of ['left','right'])s.setProperty('--gui-safe-'+side,'24px');s.setProperty('--gui-safe-bottom','12px');},size);
  await page.locator('.mobile-panel-nav').selectOption('inventory');
  const b=await page.locator('.panel-window').boundingBox();assert(b.x>=34 && b.y>=20 && b.x+b.width<=size.width-34+1 && b.y+b.height<=size.height-40+1,'safe visual viewport');
  await page.screenshot({path:`.artifacts/gui-safe-${size.width}.png`});
  await page.locator('.panel-close').click();
  assert(await page.locator('.touch-stick.move').isVisible(),'movement joystick retained');
  await page.close();
 }
}finally{await browser.close();server.close();}
