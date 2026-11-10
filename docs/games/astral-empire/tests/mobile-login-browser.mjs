const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
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
  const page=await browser.newPage({viewport:size,hasTouch:true,isMobile:true,deviceScaleFactor:3});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('#loading').waitFor({state:'hidden'});
  assert.match(await page.locator('#landing').evaluate(e=>getComputedStyle(e).backgroundImage),/solarpunk-menu.png/);
  assert.equal(await page.locator('#profile-pin').evaluate(e=>getComputedStyle(e).fontSize),'16px');
  await page.locator('#profile-name').fill('Keyboard audit');
  await page.evaluate(({width,height})=>{Object.defineProperty(visualViewport,'height',{get:()=>height<440?160:300,configurable:true});visualViewport.dispatchEvent(new Event('resize'));},size);
  await page.locator('#profile-pin').fill('2468');
  await page.waitForFunction(()=>document.querySelector('#landing').dataset.keyboard==='true');
  for(const selector of ['#profile-name','#profile-pin','.auth-actions button']){
   const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();
   const bounds=await el.evaluate(e=>{const r=e.getBoundingClientRect(),l=document.querySelector('#landing').getBoundingClientRect();return {inside:r.left>=l.left&&r.right<=l.right+1&&r.top>=l.top-1&&r.bottom<=l.bottom+1,width:r.width,height:r.height};});
   assert.ok(bounds.inside,`${size.width} ${selector} reachable above keyboard ${JSON.stringify(bounds)}`);
  }
  assert.ok(await page.locator('#landing').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.screenshot({path:`.artifacts/login-keyboard-${size.width}.png`});
  await page.getByRole('button',{name:'NEW ADVENTURE',exact:true}).click();await page.locator('[data-action="menu-enter"]').waitFor();
  assert.deepEqual(errors,[]);await page.close();console.log('PASS login/art/keyboard',size);
 }
}finally{await browser.close();server.close();}
