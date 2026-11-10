import assert from 'node:assert/strict';
import {detectMobile,resolveControlScheme} from '../engine/mobile-controls.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
assert.equal(detectMobile({navigator:{platform:'MacIntel',maxTouchPoints:5}}),true);
assert.equal(detectMobile({navigator:{userAgent:'Windows',maxTouchPoints:0}}),false);
assert.equal(resolveControlScheme('auto',true,true),'desktop');
assert.equal(resolveControlScheme('touch',false,true),'touch');
const root=resolve(import.meta.dirname,'..');
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/')path='/index.html'; const file=resolve(root,'.'+path);res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.env.TEST_URL || `http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader']});
try {
const errors=[];
const page=await browser.newPage({viewport:{width:393,height:720},isMobile:true,hasTouch:true,deviceScaleFactor:3,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
await page.waitForFunction(()=>document.documentElement.dataset.controls==='touch');
await page.locator('#profile-name').fill('Mobile Test');await page.locator('#profile-pin').fill('2468');await page.getByRole('button',{name:'NEW ADVENTURE',exact:true}).click();await page.locator('[data-action="menu-enter"]').click();await page.getByRole('button',{name:'DECLARE CHARACTER',exact:true}).click();
await page.locator('#hud').waitFor();
await page.evaluate(()=>{
window.stickEvents=[];document.addEventListener('keydown',e=>stickEvents.push('down:'+e.key));document.addEventListener('keyup',e=>stickEvents.push('up:'+e.key));document.addEventListener('aether-touch-camera',e=>stickEvents.push('camera'));
for(const [selector,id] of [['.touch-stick.move',21],['.touch-stick.camera',22]]){const el=document.querySelector(selector),r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:id,clientX:r.x+r.width*.8,clientY:r.y+r.height*.2,bubbles:true,cancelable:true}));}
});
await page.waitForFunction(()=>window.stickEvents.includes('camera'));
assert.ok((await page.evaluate(()=>window.stickEvents)).includes('down:w'));
await page.locator('.touch-stick.move').dispatchEvent('pointercancel',{pointerId:21});
assert.ok((await page.evaluate(()=>window.stickEvents)).includes('up:w'));
await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
const cameraCount=await page.evaluate(()=>stickEvents.filter(x=>x==='camera').length);
await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
assert.equal(await page.evaluate(()=>stickEvents.filter(x=>x==='camera').length),cameraCount);

const render=await page.evaluate(()=>{const c=document.querySelector('#world'),gl=c.getContext('webgl2');return {w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight,dw:gl.drawingBufferWidth,dh:gl.drawingBufferHeight};});
assert.ok(render.w>=render.cw&&render.h>=render.ch);assert.equal(render.w,render.dw);assert.equal(render.h,render.dh);

assert.equal(await page.locator('.touch-stick.move').isVisible(),true);
await page.screenshot({path:resolve(root,'.artifacts/mobile-controls-live.png')});
await page.setViewportSize({width:607,height:279});
await page.screenshot({path:resolve(root,'.artifacts/mobile-compact-live.png')});
await page.setViewportSize({width:393,height:720});
await page.locator('#control-options summary').tap();await page.locator('#control-scheme').selectOption('desktop');assert.equal(await page.locator('.touch-stick.move').isVisible(),false);
await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.controls==='desktop');
// Log back in through the real flow after reload.
await page.locator('#profile-name').fill('Mobile Test');
await page.locator('#profile-pin').fill('2468');
await page.locator('#login-form button[type=submit]').click();
await page.locator('[data-action="menu-enter"]').click();
await page.locator('#hud').waitFor({state:'visible'});
await page.locator('#control-options summary').click();await page.locator('#control-scheme').selectOption('auto');await page.locator('#control-options summary').click();assert.equal(await page.locator('.touch-stick.move').isVisible(),true);
await page.evaluate(()=>{Object.defineProperty(navigator,'getGamepads',{value:()=>[{connected:true}],configurable:true});window.dispatchEvent(new Event('gamepadconnected'));});assert.equal(await page.locator('.touch-stick.move').isVisible(),false);
await page.locator('#control-options summary').click();await page.locator('#control-scheme').selectOption('touch');await page.locator('#control-options summary').click();assert.equal(await page.locator('.touch-stick.move').isVisible(),true);
await page.evaluate(()=>{document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined;});
await page.locator('#fullscreen-toggle').click();assert.match(await page.locator('#fullscreen-help').textContent(),/Add to Home Screen/);
await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('denied'));});await page.locator('#fullscreen-toggle').click();assert.match(await page.locator('#fullscreen-help').textContent(),/declined/);
await page.evaluate(()=>{window.keyEvents=[];document.addEventListener('keydown',e=>window.keyEvents.push('down:'+e.key));document.addEventListener('keyup',e=>window.keyEvents.push('up:'+e.key));});
await page.locator('.close-controls').click();await page.locator('[data-touch-key="g"]').dispatchEvent('pointerdown',{pointerId:1});await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.deepEqual(await page.evaluate(()=>window.keyEvents.filter(x=>x.endsWith(':g'))),['down:g','up:g']);
await page.evaluate(()=>{Object.defineProperty(document,'fullscreenElement',{value:document.documentElement,configurable:true});document.dispatchEvent(new Event('fullscreenchange'));});
assert.equal(await page.locator('#fullscreen-toggle').getAttribute('aria-pressed'),'true');
await page.evaluate(()=>{Object.defineProperty(document,'fullscreenElement',{value:null,configurable:true});document.dispatchEvent(new Event('fullscreenchange'));});
const check=async()=>{
await page.evaluate(()=>document.querySelector('#hud').style.setProperty('--safe-bottom','34px'));
const boxes=await page.evaluate(()=>{const sels=['#world','.touch-stick.move','.touch-actions','.bottom-hud','.character-hud','.device-controls'];return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,boxes:Object.fromEntries(sels.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))};});
assert.ok(boxes.scroll<=boxes.width,'no horizontal page overflow');
assert.equal(Math.round(boxes.boxes['#world'].width),boxes.width);assert.equal(Math.round(boxes.boxes['#world'].height),boxes.height);
for(const [s,r] of Object.entries(boxes.boxes)){assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=boxes.width+1&&r.y+r.height<=boxes.height+1,`bounds ${s} ${JSON.stringify(r)}`);}
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
for(const [a,b] of [['.touch-stick.move','.bottom-hud'],['.touch-actions','.bottom-hud'],['.character-hud','.device-controls']])assert.equal(overlap(boxes.boxes[a],boxes.boxes[b]),false,`${a} overlaps ${b}`);
};await check();
await page.setViewportSize({width:607,height:279});
assert.equal(await page.locator('.touch-stick.move').isVisible(),true);await check();
await page.screenshot({path:resolve(root,'.artifacts/mobile-controls-landscape.png')});
await page.setViewportSize({width:393,height:720});await page.screenshot({path:resolve(root,'.artifacts/mobile-controls.png')});
// Simulate Safari's reduced visual viewport and landscape notch insets.
await page.evaluate(()=>{
Object.defineProperty(visualViewport,'width',{get:()=>560,configurable:true});
Object.defineProperty(visualViewport,'height',{get:()=>260,configurable:true});
visualViewport.dispatchEvent(new Event('resize'));
const hud=document.querySelector('#hud');hud.style.setProperty('--safe-left','59px');hud.style.setProperty('--safe-right','59px');hud.style.setProperty('--safe-bottom','21px');
});
await page.setViewportSize({width:607,height:279});
const visible=await page.evaluate(()=>Object.fromEntries(['#world','#hud','.touch-stick.move','.touch-actions','.bottom-hud','.device-controls'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}]})));
assert.equal(visible['#world'].width,560);assert.equal(visible['#hud'].height,260);
for(const s of ['.touch-stick.move','.touch-actions','.bottom-hud','.device-controls']){assert.ok(visible[s].right<=501&&visible[s].x>=59,`safe inset ${s}: ${JSON.stringify(visible[s])}`);assert.ok(visible[s].bottom<=260,`visible height ${s}`);}
assert.equal(await page.locator('.touch-stick.move').evaluate(el=>getComputedStyle(el).userSelect),'none');
assert.equal(await page.locator('.touch-stick.move').evaluate(el=>el.dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true}))),false);
await page.locator('#control-options summary').click();
await page.evaluate(()=>{Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Object.defineProperty(document,'webkitFullscreenEnabled',{value:false,configurable:true});document.dispatchEvent(new Event('fullscreenchange'));});
assert.equal(await page.locator('#fullscreen-toggle').textContent(),'Install fullscreen');
await page.locator('#fullscreen-toggle').click();assert.match(await page.locator('#fullscreen-help').textContent(),/cannot hide its own bars/);
await page.locator('.close-controls').click();await page.screenshot({path:resolve(root,'.artifacts/mobile-visible-landscape.png')});
assert.deepEqual(errors,[]);
console.log('PASS DPR3 canvas bounds/buffer, no horizontal overflow, control zone separation portrait/landscape, simulated bottom safe area, mobile detection, persisted override, controller auto/manual, fullscreen fallback/rejection, held-input blur');
} finally {await browser.close();server.close();}
