const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;

let player = { x: 15, y: 10 };
let keys = {};
let inventory = [];

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Touch
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    let moveX = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
    let moveY = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0;
    movePlayer(moveX, moveY);
});

let map = [];
function generateMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (x === 0 || x === MAP_WIDTH-1 || y === 0 || y === MAP_HEIGHT-1) map[y][x] = 1;
            else map[y][x] = Math.random() < 0.12 ? 1 : 0;
        }
    }
}
generateMap();

const itemTiers = ['Common','Uncommon','Rare','Epic','Legendary'];
const elements = ['Void','Plasma','Neural','Dimensional','Kinetic'];

function generateLoot() {
    const tier = itemTiers[Math.floor(Math.random()*itemTiers.length)];
    const element = elements[Math.floor(Math.random()*elements.length)];
    const isArmor = Math.random() > 0.5;
    if (isArmor) {
        return { type:'armor', name:`${tier} ${element} Armor`, tier, element, armor: Math.floor(Math.random()*40)+20, health: Math.floor(Math.random()*80)+30 };
    } else {
        return { type:'weapon', name:`${tier} ${element} Weapon`, tier, element, damage: Math.floor(Math.random()*35)+15, fireRate: Math.random()>0.6?2:1 };
    }
}

function addToInventory(item) {
    inventory.push(item);
    updateInventoryUI();
}

function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    invDiv.innerHTML = '';
    inventory.forEach(item => {
        const el = document.createElement('div');
        el.className = 'item';
        el.innerHTML = `${item.name}<br><small>${item.tier} • ${item.element}</small>`;
        invDiv.appendChild(el);
    });
}

function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT && map[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;

        // Random loot
        if (Math.random() < 0.08) {
            addToInventory(generateLoot());
        }

        // Random encounter
        if (Math.random() < 0.12) {
            triggerEncounter();
        }
    }
}

function triggerEncounter() {
    const types = ['Hostile', 'Peaceful'];
    const type = types[Math.floor(Math.random()*types.length)];

    if (type === 'Hostile') {
        showMessage("A hostile entity appears! What do you do?");
        showChoices([
            { text: "Fight", action: () => resolveCombat() },
            { text: "Try to flee", action: () => showMessage("You escaped.") }
        ]);
    } else {
        showMessage("You meet a wandering trader.");
        showChoices([
            { text: "Trade", action: () => { addToInventory(generateLoot()); showMessage("You made a trade."); } },
            { text: "Ignore", action: () => showMessage("You move on.") }
        ]);
    }
}

function resolveCombat() {
    const char = window.gameState?.character || { strength: 10 };
    const damage = (char.strength || 10) * 2 + (inventory.length * 3);
    if (damage > 40) {
        showMessage(`You defeated the enemy! (+${Math.floor(damage/4)} damage dealt)`);
        if (Math.random() < 0.6) addToInventory(generateLoot());
    } else {
        showMessage("You barely escaped.");
    }
}

function showMessage(text) {
    document.getElementById('game-area').innerHTML = `<p>${text}</p>`;
}

function showChoices(choices) {
    const container = document.getElementById('choices');
    container.innerHTML = '';
    choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.innerText = c.text;
        btn.onclick = () => { container.innerHTML = ''; c.action(); };
        container.appendChild(btn);
    });
}

function update() {
    let dx=0, dy=0;
    if (keys['ArrowUp']||keys['w']) dy=-1;
    if (keys['ArrowDown']||keys['s']) dy=1;
    if (keys['ArrowLeft']||keys['a']) dx=-1;
    if (keys['ArrowRight']||keys['d']) dx=1;

    if (dx||dy) movePlayer(dx, dy);
}

function draw() {
    ctx.fillStyle='#0a0c14';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<MAP_HEIGHT;y++){
        for(let x=0;x<MAP_WIDTH;x++){
            ctx.fillStyle = map[y][x]===1 ? '#1a2533' : '#11161f';
            ctx.fillRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE);
            ctx.strokeStyle='#1f2a3a';
            ctx.strokeRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE);
        }
    }
    ctx.fillStyle='#00f3ff';
    ctx.fillRect(player.x*TILE_SIZE,player.y*TILE_SIZE,TILE_SIZE,TILE_SIZE);
}

function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('%c[Sleeping Empire] Encounters system initialized.', 'color:#00f3ff');