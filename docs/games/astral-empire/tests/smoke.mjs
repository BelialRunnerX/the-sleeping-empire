// Astral Empire browser game smoke tests. Run: node docs/games/astral-empire/tests/smoke.mjs
// Uses the built-in Node.js runtime. No dependencies, server, or browser required.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const directory=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(resolve(directory,'../index.html'),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'Expected an inline game script');
const gameJS=match[1];
const checks=[];

function test(name,check){
  check();
  checks.push(name);
  console.log('✓ '+name);
}
function boot(initial){
  const nodes={app:{innerHTML:''},overlay:{innerHTML:''},'toast-root':{innerHTML:''}};
  const listeners={};
  let saveData=initial?JSON.stringify(initial):null;
  const document={
    getElementById(id){return nodes[id]??null;},
    addEventListener(event,fn){listeners[event]=fn;},
    querySelector(){return null;}
  };
  const window={addEventListener(){},scrollTo(){}};
  const localStorage={
    getItem(){return saveData;},
    setItem(key,value){saveData=value;}
  };
  const sandbox={document,window,localStorage,navigator:{},console,
    setInterval(){return 0;},setTimeout(){return 0;},clearTimeout(){}};
  vm.runInNewContext(gameJS,sandbox,{timeout:5000,filename:'index.html:inline-script'});
  function action(action,options={}){
    const node={dataset:{action,...options},classList:{contains(){return false;}},closest(){return this;}};
    listeners.click({target:node,preventDefault(){}});
  }
  return {
    action,
    get html(){return nodes.app.innerHTML;},
    get overlay(){return nodes.overlay.innerHTML;},
    get state(){return saveData?JSON.parse(saveData):null;}
  };
}

const game=boot();
test('Renders first launch',()=>assert.match(game.html,/ASTRAL EMPIRE/));
game.action('daily');
test('Daily claim saves progress',()=>assert.ok(game.state.dailyClaimed));
game.action('page',{id:'roster'});
test('Roster and awakening UI',()=>assert.match(game.html,/Astral Awakening/));
game.action('page',{id:'forge'});
const before=game.state.items.length;
game.action('craft');
test('Craft adds a relic',()=>assert.equal(game.state.items.length,before+1));
game.action('page',{id:'battle'});
test('Battle includes Trial and element guide',()=>{
  assert.match(game.html,/DAILY ASTRAL TRIAL/);
  assert.match(game.html,/Elemental Warfare/);
});
game.action('start-battle',{mode:'rift'});
test('New encounter shows enemy intent',()=>assert.match(game.html,/SHADOW CLAW/));
game.action('battle-move',{move:'skill'});
game.action('battle-select',{index:'1'});
game.action('battle-move',{move:'attack'});
test('Element collision triggers Steam Break',()=>assert.match(game.html,/STEAM BREAK/));
game.action('page',{id:'summon'});
game.action('summon',{count:'10'});
test('Summons display results',()=>assert.match(game.overlay,/summon results|legendary star/i));
game.action('close-modal');
game.action('page',{id:'expeditions'});
test('Dispatch and achievements remain available',()=>{
  assert.match(game.html,/Nebula Reconnaissance/);
  assert.match(game.html,/Astral Conqueror/);
});

const previous=game.state;
delete previous.trialDate;
delete previous.trialWins;
delete previous.heroes.kael.awakened;
previous.heroes.kael.duplicates=20;
previous.heroes.kael.level=60;
previous.heroes.lumi.level=60;
previous.heroes.mira.level=60;
previous.gold=100000;
const veteran=boot(previous);
veteran.action('daily');
veteran.action('page',{id:'roster'});
veteran.action('select-hero',{id:'kael'});
veteran.action('awaken-hero',{id:'kael'});
test('Existing saves migrate and awaken correctly',()=>assert.equal(veteran.state.heroes.kael.awakened,1));
veteran.action('page',{id:'battle'});
veteran.action('start-battle',{mode:'trial'});
test('Daily boss can launch',()=>assert.match(veteran.html,/TRIAL BOSS/));
for(let i=0;i<55&&veteran.html.includes('data-move="attack"');i++){
  veteran.action('battle-select',{index:String(i%3)});
  veteran.action('battle-move',{move:i%3===0?'skill':'attack'});
}
test('Trial victory awards gems and records completion',()=>{
  assert.ok(veteran.state.trialDate);
  assert.ok(veteran.state.trialWins>=1);
  assert.ok(veteran.state.gems>=2);
});
veteran.action('next-battle');
veteran.action('retreat');
veteran.action('confirm-retreat');
veteran.action('page',{id:'battle'});
test('Daily boss locks after victory',()=>assert.match(veteran.html,/data-mode="trial" disabled/));
console.log('All '+checks.length+' Astral Empire smoke tests passed.');
