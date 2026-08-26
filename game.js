const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;

let player = {
    x: 15,
    y: 10
};

let keys = {};
let inventory = [];

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Touch support
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    let moveX = 0, moveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) moveX = dx > 0 ? 1 : -1;
    else moveY = dy > 0 ? 1 : -1;

    movePlayer(moveX, moveY);
});

function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT && map[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;
    }
}

// Map
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

// Loot System
const itemTiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const elements = ['Void', 'Plasma', 'Neural', 'Dimensional', 'Kinetic'];

function generateLoot() {
    const tier = itemTiers[Math.floor(Math.random() * itemTiers.length)];
    const element = elements[Math.floor(Math.random() * elements.length)];
    const isArmor = Math.random() > 0.5;

    if (isArmor) {
        return {
            type: 'armor',
            name: `${tier} ${element} Armor`,
            tier: tier,
            element: element,
            armor: Math.floor(Math.random() * 40) + 20,
            health: Math.floor(Math.random() * 80) + 30
        };
    } else {
        return {
            type: 'weapon',
            name: `${tier} ${element} Weapon`,
            tier: tier,
            element: element,
            damage: Math.floor(Math.random() * 35) + 15,
            fireRate: Math.random() > 0.6 ? 2 : 1
        };
    }
}

function addToInventory(item) {
    inventory.push(item);
    updateInventoryUI();
}

function updateInventoryUI() {
    const invDiv = document.getElementById('inventory');
    invDiv.innerHTML = '';
    inventory.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'item';
        el.innerHTML = `${item.name} <br><small>${item.tier} • ${item.element}</small>`;
        invDiv.appendChild(el);
    });
}

// Update
function update() {
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['w']) dy = -1;
    if (keys['ArrowDown'] || keys['s']) dy = 1;
    if (keys['ArrowLeft'] || keys['a']) dx = -1;
    if (keys['ArrowRight'] || keys['d']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
        
        // Random loot chance when moving
        if (Math.random() < 0.08) {
            const loot = generateLoot();
            addToInventory(loot);
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            ctx.fillStyle = map[y][x] === 1 ? '#1a2533' : '#11161f';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#1f2a3a';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('%c[Sleeping Empire] Loot system initialized.', 'color:#00f3ff');