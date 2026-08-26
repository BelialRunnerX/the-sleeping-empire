const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const OVERWORLD_WIDTH = 30;
const OVERWORLD_HEIGHT = 20;
const DUNGEON_SIZE = 12;

let currentMap = 'overworld';
let player = { x: 15, y: 10 };
let keys = {};
let inventory = [];

let overworldMap = [];
let dungeonMap = [];
let dungeonExit = { x: 0, y: 0 };

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Touch / Tap to move
function handleMove(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.floor((clientX - rect.left) / TILE_SIZE);
    const clickY = Math.floor((clientY - rect.top) / TILE_SIZE);

    if (clickX < 0 || clickX >= (currentMap === 'overworld' ? OVERWORLD_WIDTH : DUNGEON_SIZE) || 
        clickY < 0 || clickY >= (currentMap === 'overworld' ? OVERWORLD_HEIGHT : DUNGEON_SIZE)) return;

    let dx = 0, dy = 0;
    if (clickX > player.x) dx = 1;
    else if (clickX < player.x) dx = -1;
    else if (clickY > player.y) dy = 1;
    else if (clickY < player.y) dy = -1;

    movePlayer(dx, dy);
}

canvas.addEventListener('click', e => handleMove(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => handleMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY));

// Generate Overworld
function generateOverworld() {
    overworldMap = [];
    for (let y = 0; y < OVERWORLD_HEIGHT; y++) {
        overworldMap[y] = [];
        for (let x = 0; x < OVERWORLD_WIDTH; x++) {
            if (x === 0 || x === OVERWORLD_WIDTH-1 || y === 0 || y === OVERWORLD_HEIGHT-1) {
                overworldMap[y][x] = 1;
            } else {
                overworldMap[y][x] = Math.random() < 0.12 ? 1 : 0;
            }
        }
    }
    
    // Add dungeon entrances
    for (let i = 0; i < 4; i++) {
        const ex = Math.floor(Math.random() * (OVERWORLD_WIDTH - 4)) + 2;
        const ey = Math.floor(Math.random() * (OVERWORLD_HEIGHT - 4)) + 2;
        overworldMap[ey][ex] = 2; // 2 = dungeon entrance
    }
}
generateOverworld();

// Generate Dungeon
function generateDungeon() {
    dungeonMap = [];
    for (let y = 0; y < DUNGEON_SIZE; y++) {
        dungeonMap[y] = [];
        for (let x = 0; x < DUNGEON_SIZE; x++) {
            if (x === 0 || x === DUNGEON_SIZE-1 || y === 0 || y === DUNGEON_SIZE-1) {
                dungeonMap[y][x] = 1;
            } else {
                dungeonMap[y][x] = Math.random() < 0.25 ? 1 : 0;
            }
        }
    }
    
    // Place exit
    dungeonExit.x = Math.floor(Math.random() * (DUNGEON_SIZE - 4)) + 2;
    dungeonExit.y = Math.floor(Math.random() * (DUNGEON_SIZE - 4)) + 2;
    dungeonMap[dungeonExit.y][dungeonExit.x] = 3; // 3 = exit
}

// Movement
function movePlayer(dx, dy) {
    const map = currentMap === 'overworld' ? overworldMap : dungeonMap;
    const width = currentMap === 'overworld' ? OVERWORLD_WIDTH : DUNGEON_SIZE;
    const height = currentMap === 'overworld' ? OVERWORLD_HEIGHT : DUNGEON_SIZE;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX >= 0 && newX < width && newY >= 0 && newY < height && map[newY][newX] !== 1) {
        player.x = newX;
        player.y = newY;

        // Check for dungeon entrance
        if (currentMap === 'overworld' && map[newY][newX] === 2) {
            enterDungeon();
        }
        
        // Check for dungeon exit
        if (currentMap === 'dungeon' && map[newY][newX] === 3) {
            exitDungeon();
        }

        // Random loot / encounter
        if (Math.random() < 0.08) addToInventory(generateLoot());
        if (Math.random() < 0.12) triggerEncounter();
    }
}

function enterDungeon() {
    currentMap = 'dungeon';
    generateDungeon();
    player.x = Math.floor(DUNGEON_SIZE / 2);
    player.y = Math.floor(DUNGEON_SIZE / 2);
}

function exitDungeon() {
    currentMap = 'overworld';
    player.x = 15;
    player.y = 10;
}

// Loot System
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

// Encounters
function triggerEncounter() {
    const types = ['Hostile', 'Peaceful'];
    const type = types[Math.floor(Math.random()*types.length)];

    if (type === 'Hostile') {
        showMessage("A hostile entity appears!");
        showChoices([
            { text: "Fight", action: () => resolveCombat() },
            { text: "Flee", action: () => showMessage("You escaped.") }
        ]);
    } else {
        showMessage("You meet a wandering trader.");
        showChoices([
            { text: "Trade", action: () => { addToInventory(generateLoot()); showMessage("Trade successful."); } },
            { text: "Ignore", action: () => showMessage("You move on.") }
        ]);
    }
}

function resolveCombat() {
    const damage = 40 + (inventory.length * 5);
    if (damage > 50) {
        showMessage(`You defeated the enemy!`);
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

// Update & Draw
function update() {
    let dx=0, dy=0;
    if (keys['ArrowUp']||keys['w']) dy=-1;
    if (keys['ArrowDown']||keys['s']) dy=1;
    if (keys['ArrowLeft']||keys['a']) dx=-1;
    if (keys['ArrowRight']||keys['d']) dx=1;

    if (dx||dy) {
        const map = currentMap === 'overworld' ? overworldMap : dungeonMap;
        const width = currentMap === 'overworld' ? OVERWORLD_WIDTH : DUNGEON_SIZE;
        const height = currentMap === 'overworld' ? OVERWORLD_HEIGHT : DUNGEON_SIZE;

        const newX = player.x + dx;
        const newY = player.y + dy;

        if (newX>=0 && newX<width && newY>=0 && newY<height && map[newY][newX] !== 1) {
            player.x = newX;
            player.y = newY;

            if (currentMap === 'overworld' && map[newY][newX] === 2) enterDungeon();
            if (currentMap === 'dungeon' && map[newY][newX] === 3) exitDungeon();

            if (Math.random()<0.08) addToInventory(generateLoot());
            if (Math.random()<0.12) triggerEncounter();
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const currentMapData = currentMap === 'overworld' ? overworldMap : dungeonMap;
    const width = currentMap === 'overworld' ? OVERWORLD_WIDTH : DUNGEON_SIZE;
    const height = currentMap === 'overworld' ? OVERWORLD_HEIGHT : DUNGEON_SIZE;

    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            let tile = currentMapData[y][x];
            if (tile === 1) ctx.fillStyle = '#1a2533';
            else if (tile === 2) ctx.fillStyle = '#ff6b6b';
            else if (tile === 3) ctx.fillStyle = '#4ecdc4';
            else ctx.fillStyle = '#11161f';

            ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#1f2a3a';
            ctx.strokeRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Player
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(player.x*TILE_SIZE, player.y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.shadowBlur = 0;
}

function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('%c[Sleeping Empire] Dungeon system initialized.', 'color:#00f3ff');