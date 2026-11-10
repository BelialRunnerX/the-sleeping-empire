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
