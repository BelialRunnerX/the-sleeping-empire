// Mobile navigation keeps every panel reachable without a clipped horizontal tab strip.
const root=document.querySelector('#panels');
function enhance(){
 const dialog=root?.querySelector('.panel-window');if(!dialog||dialog.querySelector('.mobile-panel-nav'))return;
 const nav=dialog.querySelector('.panel-tabs');if(!nav)return;
 const select=document.createElement('select');select.className='mobile-panel-nav';select.setAttribute('aria-label','Game menu');
 for(const group of nav.querySelectorAll('.menu-group')){
  const optgroup=document.createElement('optgroup');optgroup.label=group.querySelector('span')?.textContent||'Menus';
  for(const button of group.querySelectorAll('[data-panel]')){const option=document.createElement('option');option.value=button.dataset.panel;option.textContent=button.textContent;option.selected=button.classList.contains('active');optgroup.append(option);}select.append(optgroup);
 }
 select.addEventListener('change',()=>nav.querySelector(`[data-panel="${select.value}"]`)?.click());
 dialog.querySelector('.panel-top').insertBefore(select,dialog.querySelector('.panel-close'));
}
new MutationObserver(enhance).observe(root,{childList:true,subtree:true});enhance();
// A focused login field remains reachable when Safari opens the keyboard.
const login=document.querySelector('#landing');
function fitLogin(){
 if(!login||login.classList.contains('main-menu'))return;
 const focused=login.contains(document.activeElement)&&document.activeElement.matches('input,textarea');
 const height=window.visualViewport?.height||innerHeight;
 login.dataset.keyboard=String(height<innerHeight*.8||(focused&&height<440));
 if(focused)requestAnimationFrame(()=>document.activeElement.scrollIntoView({block:'nearest',inline:'nearest'}));
}
document.addEventListener('focusin',fitLogin);
document.addEventListener('focusout',()=>setTimeout(fitLogin,0));
window.visualViewport?.addEventListener('resize',fitLogin);
window.addEventListener('resize',fitLogin);
