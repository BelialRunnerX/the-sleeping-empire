const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;

let player = {
    x: 12,
    y: 9
};

let keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    let dx = 0, dy = 0;

    if (keys['ArrowUp'] || keys['w']) dy = -1;
    if (keys['ArrowDown'] || keys['s']) dy = 1;
    if (keys['ArrowLeft'] || keys['a']) dx = -1;
    if (keys['ArrowRight'] || keys['d']) dx = 1;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
        player.x = newX;
        player.y = newY;
    }
}

function draw() {
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#1a1f2e';
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Player
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('%c[Sleeping Empire] Game initialized.', 'color:#00f3ff');