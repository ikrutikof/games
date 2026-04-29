const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const CW = canvas.width;   // 400
const CH = canvas.height;  // 560

const BCOLS = 10, BROWS = 6;
const BMARGIN = 12, BGAP = 4;
const BW = (CW - 2 * BMARGIN - (BCOLS - 1) * BGAP) / BCOLS;
const BH = 14;
const BTOP = 50;

const BALL_R = 6;
const PAD_W = 80, PAD_H = 10;
const PAD_Y = CH - 30;
const PAD_SPEED = 7;

const ROW_COLORS = ['#00f5ff', '#ff00a0', '#f5e642', '#39ff14', '#ff9500', '#ff4444'];

let blocks, ball, paddle;
let score, lives, level;
let gameOver, paused, animId, lastTime;
const keys = {};

function initBlocks() {
  blocks = [];
  for (let r = 0; r < BROWS; r++) {
    for (let c = 0; c < BCOLS; c++) {
      blocks.push({
        x: BMARGIN + c * (BW + BGAP),
        y: BTOP + r * (BH + BGAP),
        alive: true,
        color: ROW_COLORS[r],
      });
    }
  }
}

function ballSpeed() {
  return 3 + (level - 1) * 0.6;
}

function launchBall() {
  const spd = ballSpeed();
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
  ball = {
    x: paddle.x + PAD_W / 2,
    y: PAD_Y - BALL_R - 1,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    spd,
  };
}

function startGame() {
  level = 1; score = 0; lives = 3;
  paddle = { x: CW / 2 - PAD_W / 2 };
  initBlocks();
  launchBall();
  gameOver = paused = false;
  lastTime = null;
  updateHUD();
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('pause-btn').textContent = '[ ПАУЗА ]';
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function nextLevel() {
  level++;
  initBlocks();
  paddle.x = CW / 2 - PAD_W / 2;
  launchBall();
  updateHUD();
}

function loseLife() {
  lives--;
  updateHUD();
  if (lives <= 0) {
    endGame();
  } else {
    paddle.x = CW / 2 - PAD_W / 2;
    launchBall();
  }
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
  document.getElementById('lives').textContent = lives;
  document.getElementById('level').textContent = level;
}

function update(dt) {
  const dtScale = dt / 16;

  // Keyboard paddle
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) paddle.x = Math.max(0, paddle.x - PAD_SPEED);
  if (keys['ArrowRight'] || keys['d'] || keys['D']) paddle.x = Math.min(CW - PAD_W, paddle.x + PAD_SPEED);

  // Move ball
  ball.x += ball.vx * dtScale;
  ball.y += ball.vy * dtScale;

  // Wall bounces
  if (ball.x - BALL_R < 0)  { ball.x = BALL_R;       ball.vx =  Math.abs(ball.vx); }
  if (ball.x + BALL_R > CW) { ball.x = CW - BALL_R;  ball.vx = -Math.abs(ball.vx); }
  if (ball.y - BALL_R < 0)  { ball.y = BALL_R;        ball.vy =  Math.abs(ball.vy); }

  // Bottom — lose life
  if (ball.y - BALL_R > CH) { loseLife(); return; }

  // Paddle collision
  if (
    ball.vy > 0 &&
    ball.y + BALL_R >= PAD_Y &&
    ball.y - BALL_R <= PAD_Y + PAD_H &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + PAD_W
  ) {
    ball.y = PAD_Y - BALL_R;
    const hitRel = (ball.x - (paddle.x + PAD_W / 2)) / (PAD_W / 2);
    ball.vx = ball.spd * hitRel * 1.2;
    const norm = Math.sqrt(ball.vx * ball.vx + ball.spd * ball.spd);
    ball.vx = (ball.vx / norm) * ball.spd;
    ball.vy = -Math.abs(Math.sqrt(ball.spd * ball.spd - ball.vx * ball.vx));
  }

  // Block collisions
  for (const b of blocks) {
    if (!b.alive) continue;
    if (
      ball.x + BALL_R > b.x &&
      ball.x - BALL_R < b.x + BW &&
      ball.y + BALL_R > b.y &&
      ball.y - BALL_R < b.y + BH
    ) {
      b.alive = false;
      score += 10;
      const overlapL = ball.x + BALL_R - b.x;
      const overlapR = b.x + BW - (ball.x - BALL_R);
      const overlapT = ball.y + BALL_R - b.y;
      const overlapB = b.y + BH - (ball.y - BALL_R);
      if (Math.min(overlapL, overlapR) < Math.min(overlapT, overlapB)) {
        ball.vx = -ball.vx;
      } else {
        ball.vy = -ball.vy;
      }
      updateHUD();
      break;
    }
  }

  if (blocks.every(b => !b.alive)) nextLevel();
}

function draw() {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CW, CH);

  // Grid
  ctx.strokeStyle = 'rgba(0,245,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
  for (let y = 0; y < CH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

  // Blocks
  for (const b of blocks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(b.x, b.y, BW, BH);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(b.x, b.y, BW, 3);
  }

  // Paddle
  ctx.fillStyle = '#00f5ff';
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 18;
  ctx.fillRect(paddle.x, PAD_Y, PAD_W, PAD_H);
  ctx.shadowBlur = 0;

  // Ball
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function loop(ts) {
  if (gameOver || paused) return;
  const dt = Math.min(ts - (lastTime || ts), 32);
  lastTime = ts;
  update(dt);
  draw();
  animId = requestAnimationFrame(loop);
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  document.getElementById('pause-btn').textContent = paused ? '[ ИГРАТЬ ]' : '[ ПАУЗА ]';
  if (!paused) { lastTime = null; animId = requestAnimationFrame(loop); }
}

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) e.preventDefault();
  if (e.key === 'p' || e.key === 'P') togglePause();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CW / rect.width;
  paddle.x = Math.max(0, Math.min(CW - PAD_W, (e.clientX - rect.left) * scaleX - PAD_W / 2));
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = CW / rect.width;
  paddle.x = Math.max(0, Math.min(CW - PAD_W, (e.touches[0].clientX - rect.left) * scaleX - PAD_W / 2));
}, { passive: false });

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('pause-btn').addEventListener('click', togglePause);

function holdPaddle(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  let iv = null;
  const move = () => { paddle.x = Math.max(0, Math.min(CW - PAD_W, paddle.x + dir * 15)); };
  el.addEventListener('touchstart', e => { e.preventDefault(); move(); iv = setInterval(move, 50); }, { passive: false });
  el.addEventListener('touchend',   e => { e.preventDefault(); clearInterval(iv); }, { passive: false });
  el.addEventListener('mousedown',  () => { move(); iv = setInterval(move, 50); });
  el.addEventListener('mouseup',    () => clearInterval(iv));
  el.addEventListener('mouseleave', () => clearInterval(iv));
}
holdPaddle('btn-left',  -1);
holdPaddle('btn-right',  1);

// Initial draw
paddle = { x: CW / 2 - PAD_W / 2 };
ball   = { x: CW / 2, y: PAD_Y - BALL_R - 1, vx: 0, vy: 0, spd: 3 };
ctx.fillStyle = '#050510';
ctx.fillRect(0, 0, CW, CH);
