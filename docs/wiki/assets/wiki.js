'use strict';
(()=>{
 const script=document.currentScript;
 const root=new URL('../',new URL(script.dataset.index,location.href));
 const form=document.getElementById('search-form'),input=document.getElementById('wiki-search'),results=document.getElementById('search-results'),article=document.getElementById('article');
 const nav=document.getElementById('navigation'),theme=document.getElementById('theme-toggle');
 let rowsPromise;
 const setTheme=dark=>{document.documentElement.dataset.theme=dark?'dark':'light';theme.textContent=dark?'Light':'Dark';theme.setAttribute('aria-label',dark?'Use light theme':'Use dark theme');};
 try{setTheme(localStorage.getItem('elysiumWikiTheme')==='dark');}catch{setTheme(false);}
 theme.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';setTheme(dark);try{localStorage.setItem('elysiumWikiTheme',dark?'dark':'light');}catch{}});
 if(matchMedia('(max-width:720px)').matches)nav.open=false;
 nav.addEventListener('click',e=>{if(e.target.closest('a')&&matchMedia('(max-width:720px)').matches)nav.open=false;});
 function restore(){results.hidden=true;article.hidden=false;results.replaceChildren();}
 let generation=0;
 async function search(query){const current=++generation;const q=query.trim().slice(0,160);if(!q){restore();return;}
  results.hidden=false;article.hidden=true;results.textContent='Searching mechanics…';
  try{
   rowsPromise??=fetch(new URL(script.dataset.index,location.href)).then(r=>{if(!r.ok)throw Error('index unavailable');return r.json();});
   const rows=await rowsPromise;if(current!==generation)return;
   const terms=q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
   const found=rows.filter(row=>terms.every(t=>(row.title+' '+row.summary+' '+row.text).toLocaleLowerCase().includes(t)));
   const heading=document.createElement('h1');heading.textContent='Search results';const count=document.createElement('p');count.textContent=`${found.length} article${found.length===1?'':'s'} for “${q}”`;
   const list=document.createElement('ul');for(const row of found){const item=document.createElement('li'),a=document.createElement('a'),p=document.createElement('p');a.href=new URL(row.url,root);a.textContent=row.title;p.textContent=row.summary;item.append(a,p);list.append(item);}
   const back=document.createElement('button');back.type='button';back.textContent='Return to article';back.onclick=()=>{input.value='';++generation;restore();input.focus();};
   results.replaceChildren(heading,count,list,back);if(!found.length){const p=document.createElement('p');p.textContent='Try a broader mechanic such as mining, loot, power or camp. This search contains mechanics only.';results.insertBefore(p,list);}
  }catch{if(current!==generation)return;results.textContent='Search is unavailable. Use the topic navigation to read every article.';rowsPromise=undefined;}
 }
 form.addEventListener('submit',e=>{e.preventDefault();search(input.value);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){++generation;input.value='';restore();if(matchMedia('(max-width:720px)').matches)nav.open=false;}if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){e.preventDefault();input.focus();}});
})();
