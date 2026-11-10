export function detectMobile(env = globalThis) {
  const nav = env.navigator || {};
  return !!(nav.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '') ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) ||
    (nav.maxTouchPoints > 0 && env.matchMedia?.('(pointer: coarse)').matches));
}
export function resolveControlScheme(preference, mobile, gamepad) {
  return preference === 'touch' || preference === 'desktop' ? preference : mobile && !gamepad ? 'touch' : 'desktop';
}
export function installMobileControls(doc = document, win = window) {
  const hud=doc.querySelector('#hud'); if (!hud) return;
  const key='aetherbound_controls_v1'; let preference='auto';
  try { const value=win.localStorage.getItem(key); if(['auto','touch','desktop'].includes(value)) preference=value; } catch {}
  const bar=doc.createElement('div'); bar.className='device-controls';
  bar.innerHTML='<button type="button" id="fullscreen-toggle" aria-label="Enter fullscreen">Fullscreen</button><details id="control-options"><summary>Controls</summary><label>Input layout<select id="control-scheme"><option value="auto">Auto detect</option><option value="touch">Touch / on-screen</option><option value="desktop">Keyboard / controller</option></select></label><p>Touch: pad moves; drag the world to look, pinch to zoom. A connected controller hides touch controls in Auto.</p><p id="fullscreen-help" role="status"></p></details>';
  hud.append(bar);
  const select=bar.querySelector('select');select.value=preference;
  const full=bar.querySelector('#fullscreen-toggle'), help=bar.querySelector('#fullscreen-help');
  const actions=doc.createElement('div');actions.className='touch-actions';
  actions.innerHTML='<button type="button" data-touch-key="e">Interact</button><button type="button" data-touch-key="q">Target</button><button type="button" data-touch-key="g">Guard</button>';
  hud.append(actions);
  const held=new Map();
  const emit=(type,k)=>doc.dispatchEvent(new win.KeyboardEvent(type,{key:k,bubbles:true}));
  const release=()=>{for(const k of held.values())emit('keyup',k);held.clear();for(const k of ['w','a','s','d'])emit('keyup',k);};
  for(const button of actions.querySelectorAll('button')) {
    button.addEventListener('pointerdown',e=>{e.preventDefault();const k=button.dataset.touchKey;held.set(e.pointerId,k);emit('keydown',k);button.setPointerCapture(e.pointerId);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{const k=held.get(e.pointerId);if(k)emit('keyup',k);held.delete(e.pointerId);});
  }
  const pads=()=>{try{return [...(win.navigator.getGamepads?.()||[])].some(p=>p?.connected);}catch{return false;}};
  const apply=()=>{release();doc.documentElement.dataset.controls=resolveControlScheme(preference,detectMobile(win),pads());};
  select.addEventListener('change',()=>{preference=select.value;try{win.localStorage.setItem(key,preference);}catch{}apply();});
  win.addEventListener('gamepadconnected',apply);win.addEventListener('gamepaddisconnected',apply);
  const coarse=win.matchMedia('(pointer: coarse)');coarse.addEventListener?.('change',apply);
  const sync=()=>{const active=!!(doc.fullscreenElement||doc.webkitFullscreenElement);full.textContent=active?'Exit fullscreen':'Fullscreen';full.setAttribute('aria-label',full.textContent);full.setAttribute('aria-pressed',String(active));};
  full.addEventListener('click',async()=>{
    try {
      if(doc.fullscreenElement||doc.webkitFullscreenElement) await (doc.exitFullscreen?.()||doc.webkitExitFullscreen?.());
      else if(doc.documentElement.requestFullscreen) await doc.documentElement.requestFullscreen();
      else if(doc.documentElement.webkitRequestFullscreen) await doc.documentElement.webkitRequestFullscreen();
      else {help.textContent='Fullscreen is unavailable in this browser. On iPhone/iPad, use Share → Add to Home Screen, then open the installed game for an app-sized view.';bar.querySelector('details').open=true;}
    } catch {help.textContent='The browser declined fullscreen. Try the button again, or use your browser’s Add to Home Screen option.';bar.querySelector('details').open=true;}
    sync();
  });
  doc.addEventListener('fullscreenchange',sync);doc.addEventListener('webkitfullscreenchange',sync);
  win.addEventListener('blur',release);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)release();});
  new MutationObserver(()=>{if(!doc.querySelector('#panels')?.hidden)release();}).observe(doc.querySelector('#panels'),{attributes:true,attributeFilter:['hidden']});
  apply();sync();
}
if(typeof document!=='undefined') installMobileControls();
