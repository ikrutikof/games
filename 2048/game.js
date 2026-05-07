'use strict';

const TILE_STYLE = {
  2:    { bg: '#0d1f2d', color: '#48b0c8', shadow: null },
  4:    { bg: '#0a1a30', color: '#00c8e0', shadow: null },
  8:    { bg: '#002838', color: '#00f5ff', shadow: '#00f5ff' },
  16:   { bg: '#001830', color: '#00f5ff', shadow: '#00f5ff' },
  32:   { bg: '#0a2410', color: '#44ee88', shadow: '#44ee88' },
  64:   { bg: '#201a00', color: '#f5e642', shadow: '#f5e642' },
  128:  { bg: '#221000', color: '#ffa040', shadow: '#ffa040' },
  256:  { bg: '#1e0a00', color: '#ff6828', shadow: '#ff6828' },
  512:  { bg: '#1e0010', color: '#ff3050', shadow: '#ff3050' },
  1024: { bg: '#1a0020', color: '#ff00a0', shadow: '#ff00a0' },
  2048: { bg: '#00f5ff', color: '#050510', shadow: '#00f5ff' },
};

const $score       = document.getElementById('score');
const $best        = document.getElementById('best');
const $grid        = document.getElementById('grid');
const $overlay     = document.getElementById('overlay');
const $overlayTitle = document.getElementById('overlayTitle');
const $overlayScore = document.getElementById('overlayScore');
const $btnContinue = document.getElementById('btnContinue');

let board, score, bestScore, won, keepPlaying;
let lastNewIdx, lastMergedSet;

function init() {
  board       = Array(16).fill(0);
  score       = 0;
  won         = false;
  keepPlaying = false;
  lastNewIdx  = -1;
  lastMergedSet = new Set();
  bestScore   = parseInt(localStorage.getItem('best2048') || '0');
  buildGrid();
  addTile();
  addTile();
  render();
  hideOverlay();
}

function buildGrid() {
  $grid.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    $grid.appendChild(cell);
  }
}

function addTile() {
  const empty = [];
  board.forEach((v, i) => { if (v === 0) empty.push(i); });
  if (!empty.length) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = Math.random() < 0.9 ? 2 : 4;
  lastNewIdx  = idx;
}

function slideRow(row) {
  let r   = row.filter(v => v !== 0);
  let pts = 0;
  const mergedAt = new Set();
  let i = 0;
  while (i < r.length - 1) {
    if (r[i] === r[i + 1]) {
      r[i] *= 2;
      pts += r[i];
      mergedAt.add(i);
      r.splice(i + 1, 1);
    }
    i++;
  }
  while (r.length < 4) r.push(0);
  return { row: r, pts, mergedAt };
}

function move(dir) {
  if ((won || isGameOver()) && !keepPlaying) return;

  const prev = [...board];
  let totalPts = 0;
  lastMergedSet = new Set();

  for (let line = 0; line < 4; line++) {
    let indices;
    if      (dir === 'left')  indices = [line*4, line*4+1, line*4+2, line*4+3];
    else if (dir === 'right') indices = [line*4+3, line*4+2, line*4+1, line*4];
    else if (dir === 'up')    indices = [line, line+4, line+8, line+12];
    else                      indices = [line+12, line+8, line+4, line];

    const rowVals = indices.map(i => board[i]);
    const { row: newRow, pts, mergedAt } = slideRow(rowVals);
    totalPts += pts;
    mergedAt.forEach(j => lastMergedSet.add(indices[j]));
    indices.forEach((idx, j) => { board[idx] = newRow[j]; });
  }

  if (board.every((v, i) => v === prev[i])) return; // nothing moved

  score += totalPts;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('best2048', bestScore);
  }

  if (window.SFX) { totalPts > 0 ? SFX.play('merge') : SFX.play('slide'); }
  if (totalPts > 0 && navigator.vibrate) navigator.vibrate(20);

  lastNewIdx = -1;
  addTile();
  render();

  if (!won && board.includes(2048)) {
    won = true;
    if (window.SFX) SFX.play('reach2048');
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
    if (window.Achievements) Achievements.unlock('game2048_win');
    if (window.LB && score > 0) LB.submit('2048', score);
    showOverlay('ТЫ ВЫИГРАЛ!', score, true);
    return;
  }
  if (!won && board.includes(1024) && window.Achievements) Achievements.unlock('game2048_1024');
  if (isGameOver()) {
    if (window.SFX) SFX.play('gameOver');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    if (window.LB && score > 0) LB.submit('2048', score);
    showOverlay('GAME OVER', score, false);
  }
}

function isGameOver() {
  if (board.includes(0)) return false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r * 4 + c];
      if (c < 3 && v === board[r * 4 + c + 1]) return false;
      if (r < 3 && v === board[(r + 1) * 4 + c]) return false;
    }
  }
  return true;
}

function render() {
  $score.textContent = score;
  $best.textContent  = bestScore;

  const cells = $grid.children;
  board.forEach((v, i) => {
    const cell = cells[i];
    const isNew    = i === lastNewIdx;
    const isMerge  = lastMergedSet.has(i);

    // reset animation classes
    cell.classList.remove('appear', 'merge');
    // force reflow so re-adding class triggers animation
    void cell.offsetWidth;

    if (v) {
      const style = TILE_STYLE[v] || { bg: '#100010', color: '#ff00ff', shadow: '#ff00ff' };
      cell.textContent      = v;
      cell.style.background = style.bg;
      cell.style.color      = style.color;
      cell.style.borderColor = style.color + '55';
      cell.style.boxShadow  = style.shadow ? `0 0 12px ${style.shadow}50` : 'none';
      cell.style.textShadow = style.shadow ? `0 0 8px ${style.shadow}` : 'none';
      cell.style.fontSize   = v >= 1000 ? '1rem' : v >= 100 ? '1.3rem' : '1.7rem';

      if (isNew)   cell.classList.add('appear');
      else if (isMerge) cell.classList.add('merge');
    } else {
      cell.textContent      = '';
      cell.style.background = '';
      cell.style.color      = '';
      cell.style.borderColor = '';
      cell.style.boxShadow  = '';
      cell.style.textShadow = '';
      cell.style.fontSize   = '';
    }
  });
}

function showOverlay(title, sc, isWin) {
  $overlayTitle.textContent = title;
  $overlayTitle.style.color = isWin ? 'var(--cyan)' : 'var(--magenta)';
  $overlayScore.textContent = `СЧЁТ: ${sc}`;
  $btnContinue.style.display = isWin ? 'inline-block' : 'none';
  $overlay.style.display = 'flex';
}

function hideOverlay() {
  $overlay.style.display = 'none';
}

// Keyboard
document.addEventListener('keydown', e => {
  const map = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down',
    A: 'left', D: 'right', W: 'up', S: 'down',
  };
  const dir = map[e.key];
  if (dir) { e.preventDefault(); move(dir); }
});

// Full-screen swipe — works anywhere on the page, skip buttons
let touchOrigin = null;
document.addEventListener('touchstart', e => {
  if (e.target.closest('button,a')) return;
  const t = e.touches[0];
  touchOrigin = { x: t.clientX, y: t.clientY };
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!touchOrigin) return;
  const dx = e.changedTouches[0].clientX - touchOrigin.x;
  const dy = e.changedTouches[0].clientY - touchOrigin.y;
  touchOrigin = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
}, { passive: true });

// Buttons
document.getElementById('btnNew').addEventListener('click', () => { if (window.SFX) SFX.play('start'); localStorage.setItem('plays_2048', (+localStorage.getItem('plays_2048') || 0) + 1); init(); });
document.getElementById('btnRestart').addEventListener('click', () => { hideOverlay(); if (window.SFX) SFX.play('start'); localStorage.setItem('plays_2048', (+localStorage.getItem('plays_2048') || 0) + 1); init(); });
$btnContinue.addEventListener('click', () => { keepPlaying = true; hideOverlay(); });

init();
