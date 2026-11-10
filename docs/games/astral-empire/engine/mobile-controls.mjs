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
  // Safari's visible viewport can be smaller than the layout viewport when chrome moves.
  const viewport=()=>{
    const v=win.visualViewport, root=doc.documentElement;
    root.style.setProperty('--view-width',`${v?.width || win.innerWidth}px`);
    root.style.setProperty('--view-height',`${v?.height || win.innerHeight}px`);
    root.style.setProperty('--view-left',`${v?.offsetLeft || 0}px`);
    root.style.setProperty('--view-top',`${v?.offsetTop || 0}px`);
  };
  viewport();win.addEventListener('resize',viewport);
  win.visualViewport?.addEventListener('resize',viewport);
  win.visualViewport?.addEventListener('scroll',viewport);
  // Prevent selection/callouts on game controls, never on editable form fields.
  const editable=e=>e.target.closest?.('input,textarea,select,[contenteditable="true"]');
  for(const type of ['contextmenu','selectstart'])hud.addEventListener(type,e=>{if(!editable(e))e.preventDefault();});
  const key='aetherbound_controls_v1'; let preference='auto';
  try { const value=win.localStorage.getItem(key); if(['auto','touch','desktop'].includes(value)) preference=value; } catch {}
  const bar=doc.createElement('div'); bar.className='device-controls';
  bar.innerHTML='<button type="button" id="fullscreen-toggle" aria-label="Enter fullscreen">Fullscreen</button><details id="control-options"><summary>Controls</summary><label>Input layout<select id="control-scheme"><option value="auto">Auto detect</option><option value="touch">Touch / on-screen</option><option value="desktop">Keyboard / controller</option></select></label><p>Left stick moves. Right buttons interact and hold primary attack. Drag the world to orbit; pinch to zoom. A connected controller hides touch controls in Auto.</p><p id="fullscreen-help" role="status"></p></details>';
  hud.append(bar);
  const options=bar.querySelector('details');
  const fullButton=bar.querySelector('#fullscreen-toggle');
  options.insertBefore(fullButton,options.querySelector('label'));
  const close=doc.createElement('button');close.type='button';close.textContent='Back to game';close.className='close-controls';options.append(close);
  close.addEventListener('click',()=>options.open=false);
  options.addEventListener('click',e=>{if(e.target.closest('[data-panel]'))options.open=false;});
  doc.addEventListener('keydown',e=>{if(e.key==='Escape')options.open=false;});
  doc.addEventListener('pointerdown',e=>{if(options.open&&!bar.contains(e.target))options.open=false;});
  const movable=['.camera-dock','.menu-dock','.artisan-shortcut'].map(selector=>{
    const node=doc.querySelector(selector);if(!node)return null;
    const marker=doc.createComment('control-home');node.before(marker);return {node,marker};
  }).filter(Boolean);

  const select=bar.querySelector('select');select.value=preference;
  const full=bar.querySelector('#fullscreen-toggle'), help=bar.querySelector('#fullscreen-help');
  const actions=doc.createElement('div');actions.className='touch-actions';
  actions.innerHTML='<button type="button" data-touch-key="e">Interact</button><button type="button" data-touch-key="q">Target</button><button type="button" data-touch-key="g">Guard</button><button type="button" data-touch-key=" ">Jump</button><button type="button" data-touch-key="Shift">Dodge</button>';
  hud.append(actions);
  const rightActions=doc.createElement('div');rightActions.className='touch-primary-actions';
  rightActions.append(actions.querySelector('[data-touch-key="e"]'));
  const primary=doc.createElement('button');primary.type='button';primary.dataset.touchKey='__primary';primary.textContent='LMB';primary.setAttribute('aria-label','Hold primary attack');rightActions.append(primary);hud.append(rightActions);
  const sticks=[];let moveKeys=new Set();
  const held=new Map();
  const emit=(type,k)=>k==='__primary'?doc.dispatchEvent(new win.CustomEvent('aether-touch-primary',{detail:{held:type==='keydown'}})):doc.dispatchEvent(new win.KeyboardEvent(type,{key:k,bubbles:true}));
  const release=()=>{for(const stick of sticks)stick.reset();for(const k of moveKeys)emit('keyup',k);moveKeys.clear();for(const k of held.values())emit('keyup',k);held.clear();for(const k of ['w','a','s','d'])emit('keyup',k);};
  for(const button of [...actions.querySelectorAll('button'),...rightActions.querySelectorAll('button')]) {
    button.addEventListener('pointerdown',e=>{e.preventDefault();const k=button.dataset.touchKey;held.set(e.pointerId,k);emit('keydown',k);if(button.hasPointerCapture?.(e.pointerId)===false){try{button.setPointerCapture(e.pointerId);}catch{}}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{const k=held.get(e.pointerId);if(k)emit('keyup',k);held.delete(e.pointerId);});
  }
  for(const kind of ['move']) {
    const stick=doc.createElement('div');stick.className='touch-stick '+kind;stick.setAttribute('role','group');stick.setAttribute('aria-label',kind==='move'?'Movement joystick':'Camera joystick: horizontal orbit, vertical zoom');
    stick.innerHTML='<span class="stick-label">'+(kind==='move'?'MOVE':'ORBIT / ZOOM')+'</span><i></i>';hud.append(stick);
    const state={pointer:null,x:0,y:0,reset(){this.pointer=null;this.x=this.y=0;stick.querySelector('i').style.transform='translate(-50%,-50%)';if(kind==='move'){for(const k of moveKeys)emit('keyup',k);moveKeys.clear();}}};sticks.push(state);
    const update=e=>{const r=stick.getBoundingClientRect();let x=(e.clientX-r.x-r.width/2)/(r.width*.35),y=(e.clientY-r.y-r.height/2)/(r.height*.35);const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}state.x=Math.abs(x)>.18?x:0;state.y=Math.abs(y)>.18?y:0;stick.querySelector('i').style.transform=`translate(calc(-50% + ${x*26}px),calc(-50% + ${y*26}px))`;if(kind==='move'){const next=new Set();if(state.x<-.25)next.add('a');if(state.x>.25)next.add('d');if(state.y<-.25)next.add('w');if(state.y>.25)next.add('s');for(const k of moveKeys)if(!next.has(k))emit('keyup',k);for(const k of next)if(!moveKeys.has(k))emit('keydown',k);moveKeys=next;}};
    stick.addEventListener('pointerdown',e=>{if(state.pointer!==null)return;e.preventDefault();state.pointer=e.pointerId;try{stick.setPointerCapture(e.pointerId);}catch{}update(e);});
    stick.addEventListener('pointermove',e=>{if(state.pointer===e.pointerId){e.preventDefault();update(e);}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(state.pointer===e.pointerId)state.reset();});
  }
  options.addEventListener('toggle',()=>{if(options.open)release();});
  const pads=()=>{try{return [...(win.navigator.getGamepads?.()||[])].some(p=>p?.connected);}catch{return false;}};
  const apply=()=>{release();const scheme=resolveControlScheme(preference,detectMobile(win),pads());doc.documentElement.dataset.controls=scheme;
    for(const {node,marker} of movable) {if(scheme==='touch')options.insertBefore(node,close);else marker.after(node);}
    options.open=false;};
  select.addEventListener('change',()=>{preference=select.value;try{win.localStorage.setItem(key,preference);}catch{}apply();});
  win.addEventListener('gamepadconnected',apply);win.addEventListener('gamepaddisconnected',apply);
  const coarse=win.matchMedia('(pointer: coarse)');coarse.addEventListener?.('change',apply);
  const standalone=()=>win.navigator.standalone===true||win.matchMedia('(display-mode: standalone)').matches;
  const nativeFullscreen=()=>!!(doc.fullscreenEnabled||doc.webkitFullscreenEnabled);
  const sync=()=>{const active=!!(doc.fullscreenElement||doc.webkitFullscreenElement);full.textContent=active?'Exit fullscreen':standalone()?'App view':nativeFullscreen()?'Fullscreen':'Install fullscreen';full.setAttribute('aria-label',full.textContent);full.setAttribute('aria-pressed',String(active));};
  full.addEventListener('click',async()=>{
    try {
      if(standalone()&&!doc.fullscreenElement&&!doc.webkitFullscreenElement){help.textContent='Already running in installed app view. iOS reserves its system gesture area.';options.open=true;return;}
      if(!nativeFullscreen()){help.textContent='This browser cannot hide its own bars. On iPhone, open this page in Safari, tap Share, then Add to Home Screen (enable Open as Web App if shown). Launch that icon for app view. Your browser may keep its system gesture area.';options.open=true;return;}
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
