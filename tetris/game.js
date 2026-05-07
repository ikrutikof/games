const COLS = 10, ROWS = 20, CELL = 30;
const COLORS = {
  I: '#00f5ff', O: '#f5e642', T: '#ff00a0',
  S: '#39ff14', Z: '#ff4444', J: '#4d79ff', L: '#ff9500'
};
const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};
const TYPES = Object.keys(SHAPES);
const SCORE_TABLE = [0, 100, 300, 500, 800];

const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');

let board, piece, nextType, score, linesCount, level;
let gameOver, paused, animId, lastTime, dropAccum;

function rotate(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  const result = Array.from({length: cols}, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = matrix[r][c];
  return result;
}

function collides(mat, ox, oy) {
  for (let r = 0; r < mat.length; r++)
    for (let c = 0; c < mat[r].length; c++) {
      if (!mat[r][c]) continue;
      const nx = ox + c, ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  return false;
}

function spawnPiece() {
  const type = nextType || TYPES[Math.floor(Math.random() * TYPES.length)];
  nextType = TYPES[Math.floor(Math.random() * TYPES.length)];
  const mat = SHAPES[type].map(r => [...r]);
  const x = Math.floor((COLS - mat[0].length) / 2);
  piece = { type, mat, x, y: 0, color: COLORS[type] };
  if (collides(piece.mat, piece.x, piece.y)) {
    endGame();
  }
  drawNext();
}

function lockPiece() {
  for (let r = 0; r < piece.mat.length; r++)
    for (let c = 0; c < piece.mat[r].length; c++) {
      if (!piece.mat[r][c]) continue;
      const row = piece.y + r;
      if (row < 0) { endGame(); return; }
      board[row][piece.x + c] = piece.color;
    }
  if (window.SFX) SFX.play('lock');
  if (navigator.vibrate) navigator.vibrate(15);
  clearLines();
  spawnPiece();
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(Boolean)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++;
    }
  }
  if (!cleared) return;
  linesCount += cleared;
  score += SCORE_TABLE[cleared] * level;
  level = Math.floor(linesCount / 10) + 1;
  document.getElementById('score').textContent = score;
  document.getElementById('lines').textContent = linesCount;
  document.getElementById('level').textContent = level;
  if (window.SFX) SFX.play(cleared === 4 ? 'clear4' : 'clear1');
  if (navigator.vibrate) navigator.vibrate(cleared === 4 ? [40, 20, 40, 20, 60] : [30]);
  if (window.Achievements && cleared === 4) Achievements.unlock('tetris_4lines');
  if (window.Achievements && level >= 5) Achievements.unlock('tetris_level5');
}

function dropInterval() {
  return Math.max(100, 800 - (level - 1) * 70);
}

function tryMove(dx, dy) {
  if (collides(piece.mat, piece.x + dx, piece.y + dy)) return false;
  piece.x += dx;
  piece.y += dy;
  return true;
}

function tryRotate() {
  const rotated = rotate(piece.mat);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collides(rotated, piece.x + kick, piece.y)) {
      piece.mat = rotated;
      piece.x += kick;
      return;
    }
  }
}

function hardDrop() {
  while (!collides(piece.mat, piece.x, piece.y + 1)) piece.y++;
  lockPiece();
}

function ghostY() {
  let gy = piece.y;
  while (!collides(piece.mat, piece.x, gy + 1)) gy++;
  return gy;
}

function drawCell(context, x, y, color, alpha = 1) {
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  context.globalAlpha = 0.4 * alpha;
  context.strokeStyle = '#fff';
  context.lineWidth = 0.5;
  context.strokeRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3);
  context.globalAlpha = 1;
}

function draw() {
  ctx.fillStyle = 'rgba(5,5,16,0.95)';
  ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  ctx.strokeStyle = 'rgba(0,245,255,0.04)';
  ctx.lineWidth = 1;
  for (let r = 0; r < ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke();
  }
  for (let c = 0; c < COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke();
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) drawCell(ctx, c, r, board[r][c]);

  if (piece) {
    const gy = ghostY();
    for (let r = 0; r < piece.mat.length; r++)
      for (let c = 0; c < piece.mat[r].length; c++)
        if (piece.mat[r][c]) drawCell(ctx, piece.x + c, gy + r, piece.color, 0.18);

    for (let r = 0; r < piece.mat.length; r++)
      for (let c = 0; c < piece.mat[r].length; c++)
        if (piece.mat[r][c]) drawCell(ctx, piece.x + c, piece.y + r, piece.color);
  }
}

function drawNext() {
  nctx.fillStyle = 'rgba(5,5,16,0.95)';
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextType) return;
  const mat = SHAPES[nextType];
  const color = COLORS[nextType];
  const cellSize = 22;
  const offX = Math.floor((nextCanvas.width - mat[0].length * cellSize) / 2);
  const offY = Math.floor((nextCanvas.height - mat.length * cellSize) / 2);
  for (let r = 0; r < mat.length; r++)
    for (let c = 0; c < mat[r].length; c++)
      if (mat[r][c]) {
        nctx.fillStyle = color;
        nctx.fillRect(offX + c * cellSize + 1, offY + r * cellSize + 1, cellSize - 2, cellSize - 2);
        nctx.globalAlpha = 0.4;
        nctx.strokeStyle = '#fff';
        nctx.lineWidth = 0.5;
        nctx.strokeRect(offX + c * cellSize + 1.5, offY + r * cellSize + 1.5, cellSize - 3, cellSize - 3);
        nctx.globalAlpha = 1;
      }
}

function gameLoop(ts) {
  if (gameOver || paused) return;
  const dt = ts - (lastTime || ts);
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval()) {
    dropAccum = 0;
    if (!tryMove(0, 1)) lockPiece();
  }
  draw();
  animId = requestAnimationFrame(gameLoop);
}

function startGame() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  score = 0; linesCount = 0; level = 1;
  gameOver = false; paused = false;
  dropAccum = 0; lastTime = null;
  document.getElementById('score').textContent = '0';
  document.getElementById('lines').textContent = '0';
  document.getElementById('level').textContent = '1';
  document.getElementById('overlay').style.display = 'none';
  nextType = null;
  spawnPiece();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  if (window.SFX) SFX.play('gameOver');
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  if (window.LB && score > 0) LB.submit('tetris', score);
  const ov = document.getElementById('overlay');
  document.getElementById('overlay-title').textContent = 'ИГРА ОКОНЧЕНА';
  document.getElementById('start-btn').textContent = '[ ЗАНОВО ]';
  ov.style.display = 'flex';
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  document.getElementById('pause-btn').textContent = paused ? '[ ИГРАТЬ ]' : '[ ПАУЗА ]';
  if (!paused) {
    lastTime = null;
    animId = requestAnimationFrame(gameLoop);
  }
}

document.getElementById('start-btn').addEventListener('click', () => { if (window.SFX) SFX.play('start'); localStorage.setItem('', (+localStorage.getItem('') || 0) + 1); startGame(); });
document.getElementById('pause-btn').addEventListener('click', togglePause);

document.addEventListener('keydown', e => {
  if (gameOver || paused) return;
  if (e.key === 'ArrowLeft')  { e.preventDefault(); if(tryMove(-1,0)){if(window.SFX)SFX.play('move');} draw(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); if(tryMove(1,0)){if(window.SFX)SFX.play('move');}  draw(); }
  if (e.key === 'ArrowDown')  { e.preventDefault(); if (!tryMove(0, 1)) lockPiece(); draw(); }
  if (e.key === 'ArrowUp')    { e.preventDefault(); tryRotate(); if(window.SFX)SFX.play('rotate'); draw(); }
  if (e.key === ' ')          { e.preventDefault(); if(window.SFX)SFX.play('hardDrop'); hardDrop(); draw(); }
  if (e.key === 'p' || e.key === 'P') togglePause();
});

function addBtn(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); if (!gameOver && !paused) { fn(); draw(); } }, {passive: false});
  el.addEventListener('mousedown', () => { if (!gameOver && !paused) { fn(); draw(); } });
}
addBtn('btn-left',   () => tryMove(-1, 0));
addBtn('btn-right',  () => tryMove(1, 0));
addBtn('btn-down',   () => { if (!tryMove(0, 1)) lockPiece(); });
addBtn('btn-rotate', () => tryRotate());
addBtn('btn-drop',   () => hardDrop());

// Full-screen swipe: ←→ move, ↓ hard drop, ↑ or tap = rotate (skip buttons)
let swipeOrigin = null;
document.addEventListener('touchstart', e => {
  if (e.target.closest('button,a,.ctrl-btn')) return;
  swipeOrigin = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
document.addEventListener('touchend', e => {
  if (!swipeOrigin || gameOver || paused) return;
  const dx = e.changedTouches[0].clientX - swipeOrigin.x;
  const dy = e.changedTouches[0].clientY - swipeOrigin.y;
  swipeOrigin = null;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (Math.max(adx, ady) < 20) { tryRotate(); draw(); return; }
  if (adx > ady) { tryMove(dx > 0 ? 1 : -1, 0); draw(); }
  else if (dy > 0) { hardDrop(); draw(); }
  else { tryRotate(); draw(); }
}, { passive: true });

ctx.fillStyle = 'rgba(5,5,16,0.95)';
ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
