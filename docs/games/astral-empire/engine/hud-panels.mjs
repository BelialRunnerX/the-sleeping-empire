/* UI-only progressive disclosure. Simulation and inventory actions remain owned by app. */
const panels=document.querySelector('#panels');
let query='';
function enhance(){
 const dialog=panels?.querySelector('[role="dialog"]');
 if(!dialog||dialog.dataset.glassEnhanced)return;
 dialog.dataset.glassEnhanced='true';
 if(dialog.getAttribute('aria-label')!=='Equipment')return;
 const body=dialog.querySelector('.panel-body');
 for(const [selector,label] of [['.stat-grid','Character statistics'],['.resource-line','Material stockpile']]){
  const block=body.querySelector(selector);if(!block)continue;
  const detail=document.createElement('details');detail.className='glass-disclosure';
  const summary=document.createElement('summary');summary.textContent=label;
  detail.append(summary);block.before(detail);detail.append(block);
 }
 const grid=body.querySelector('.grid-3');if(!grid)return;
 const label=document.createElement('label');label.className='inventory-search';
 label.textContent='Find equipment';const input=document.createElement('input');input.type='search';input.placeholder='Name, slot or modifier';input.value=query;label.append(input);grid.before(label);
 const status=document.createElement('p');status.className='small muted';status.setAttribute('role','status');grid.before(status);
 const filter=()=>{query=input.value;const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);let count=0;for(const card of grid.children){card.hidden=!terms.every(t=>card.textContent.toLowerCase().includes(t));if(!card.hidden)count++;}status.textContent=`${count} equipment item${count===1?'':'s'}${count===0?' · Try another name or modifier.':''}`;};
 input.addEventListener('input',filter);filter();
}
new MutationObserver(enhance).observe(panels,{childList:true,subtree:true});enhance();
