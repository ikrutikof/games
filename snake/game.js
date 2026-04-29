const COLS = 20, ROWS = 20, CELL = 30;
const CW = COLS * CELL, CH = ROWS * CELL;
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const DIR = {
  UP:    { dx:  0, dy: -1 },
  DOWN:  { dx:  0, dy:  1 },
  LEFT:  { dx: -1, dy:  0 },
  RIGHT: { dx:  1, dy:  0 },
};

let snake, dir, nextDir, food;
let score, paused, gameOver, tickMs, lastTime, tickAccum, animId;

function isOpposite(a, b) {
  return a.dx + b.dx === 0 && a.dy + b.dy === 0;
}

function spawnFood() {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  let fx, fy;
  do {
    fx = Math.floor(Math.random() * COLS);
    fy = Math.floor(Math.random() * ROWS);
  } while (occupied.has(`${fx},${fy}`));
  food = { x: fx, y: fy };
}

function startGame() {
  snake = [
    { x: 10, y: 10 },
    { x:  9, y: 10 },
    { x:  8, y: 10 },
    { x:  7, y: 10 },
  ];
  dir = nextDir = DIR.RIGHT;
  score = 0;
  tickMs = 150;
  paused = gameOver = false;
  lastTime = null;
  tickAccum = 0;
  spawnFood();
  updateHUD();
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('pause-btn').textContent = '[ ПАУЗА ]';
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function tick() {
  dir = nextDir;
  const head = snake[0];
  const nx = head.x + dir.dx;
  const ny = head.y + dir.dy;

  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) { endGame(); return; }

  for (const seg of snake) {
    if (seg.x === nx && seg.y === ny) { endGame(); return; }
  }

  const ateFood = (nx === food.x && ny === food.y);
  snake.unshift({ x: nx, y: ny });
  if (ateFood) {
    score += 10;
    tickMs = Math.max(80, 150 - Math.floor(score / 50) * 5);
    spawnFood();
  } else {
    snake.pop();
  }
  updateHUD();
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  document.getElementById('overlay-title').textContent = 'GAME OVER';
  document.getElementById('overlay-score').textContent = `СЧЁТ: ${score}`;
  document.getElementById('start-btn').textContent = '[ ЗАНОВО ]';
  document.getElementById('overlay').style.display = 'flex';
}

function updateHUD() {
  document.getElementById('score').textContent = score;
  document.getElementById('length').textContent = snake.length;
  const level = Math.floor((150 - tickMs) / 5) + 1;
  document.getElementById('speed-val').textContent = level;
}

function draw() {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CW, CH);

  ctx.strokeStyle = 'rgba(0,245,255,0.04)';
  ctx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(CW, r * CELL); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, CH); ctx.stroke();
  }

  // Food
  ctx.shadowColor = '#f5e642';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#f5e642';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake (back to front so head is on top)
  for (let i = snake.length - 1; i >= 0; i--) {
    const s = snake[i];
    const sx = s.x * CELL, sy = s.y * CELL;
    if (i === 0) {
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(sx + 2, sy + 2, CELL - 4, CELL - 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#050510';
      if (dir.dx === 1)       { ctx.fillRect(sx + CELL - 9, sy + 6,  4, 4); ctx.fillRect(sx + CELL - 9, sy + CELL - 10, 4, 4); }
      else if (dir.dx === -1) { ctx.fillRect(sx + 5,        sy + 6,  4, 4); ctx.fillRect(sx + 5,        sy + CELL - 10, 4, 4); }
      else if (dir.dy === -1) { ctx.fillRect(sx + 6,        sy + 5,  4, 4); ctx.fillRect(sx + CELL - 10, sy + 5,        4, 4); }
      else                    { ctx.fillRect(sx + 6, sy + CELL - 9,  4, 4); ctx.fillRect(sx + CELL - 10, sy + CELL - 9, 4, 4); }
    } else {
      const alpha = 1 - (i / snake.length) * 0.65;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(sx + 4, sy + 4, CELL - 8, CELL - 8);
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 3, sy + 3, CELL - 6, CELL - 6);
      ctx.globalAlpha = 1;
    }
  }

  // Speed bar
  const level = Math.floor((150 - tickMs) / 5) + 1;
  const barW = (Math.min(level, 15) / 15) * CW;
  ctx.fillStyle = 'rgba(0,245,255,0.1)'; ctx.fillRect(0, 0, CW, 3);
  ctx.fillStyle = '#00f5ff'; ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 4;
  ctx.fillRect(0, 0, barW, 3); ctx.shadowBlur = 0;
}

function loop(ts) {
  if (gameOver || paused) return;
  const dt = ts - (lastTime || ts);
  lastTime = ts;
  tickAccum += dt;
  while (tickAccum >= tickMs) {
    tickAccum -= tickMs;
    tick();
    if (gameOver) return;
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  document.getElementById('pause-btn').textContent = paused ? '[ ИГРАТЬ ]' : '[ ПАУЗА ]';
  if (!paused) { lastTime = null; animId = requestAnimationFrame(loop); }
}

function setDir(d) {
  if (!isOpposite(d, dir)) nextDir = d;
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') { e.preventDefault(); setDir(DIR.UP); }
  if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') { e.preventDefault(); setDir(DIR.DOWN); }
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { e.preventDefault(); setDir(DIR.LEFT); }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); setDir(DIR.RIGHT); }
  if (e.key === 'p' || e.key === 'P') togglePause();
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('pause-btn').addEventListener('click', togglePause);

function addDirBtn(id, d) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); setDir(d); }, { passive: false });
  el.addEventListener('mousedown',  () => setDir(d));
}
addDirBtn('btn-up',    DIR.UP);
addDirBtn('btn-down',  DIR.DOWN);
addDirBtn('btn-left',  DIR.LEFT);
addDirBtn('btn-right', DIR.RIGHT);

ctx.fillStyle = '#050510';
ctx.fillRect(0, 0, CW, CH);
