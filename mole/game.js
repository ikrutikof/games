'use strict';

const GRID_SIZE     = 9;
const GAME_DURATION = 60;
const POINTS_NORMAL = 10;
const POINTS_GOLDEN = 50;
const GOLDEN_CHANCE = 0.12;

let score, bestScore, timeLeft, gameActive;
let holes = [];
let countdownTimer;
let spawnTimeout;

function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  holes = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.innerHTML = '<div class="mole"><span class="mole-face">◈</span></div>';

    hole.addEventListener('click', () => whack(i));
    hole.addEventListener('touchstart', e => { e.preventDefault(); whack(i); }, { passive: false });

    grid.appendChild(hole);
    holes.push({ el: hole, upTimer: null, isUp: false, isGolden: false });
  }
}

function startGame() {
  score     = 0;
  timeLeft  = GAME_DURATION;
  gameActive = true;
  bestScore = parseInt(localStorage.getItem('bestMole') || '0');

  document.getElementById('score').textContent = '0';
  document.getElementById('timer').textContent  = GAME_DURATION;
  document.getElementById('timer').classList.remove('warn');
  document.getElementById('best').textContent   = bestScore;
  document.getElementById('overlay').style.display = 'none';

  holes.forEach(h => lowerMole(h, true));
  scheduleSpawn();

  countdownTimer = setInterval(() => {
    timeLeft--;
    const timerEl = document.getElementById('timer');
    timerEl.textContent = timeLeft;
    if (timeLeft <= 10) timerEl.classList.add('warn');
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function scheduleSpawn() {
  if (!gameActive) return;

  const elapsed    = GAME_DURATION - timeLeft;
  const difficulty = Math.min(elapsed / 18, 3);
  const minDelay   = Math.max(280, 750 - difficulty * 140);
  const maxDelay   = Math.max(550, 1350 - difficulty * 200);
  const delay      = minDelay + Math.random() * (maxDelay - minDelay);

  spawnTimeout = setTimeout(() => {
    if (!gameActive) return;
    spawnMole();
    scheduleSpawn();
  }, delay);
}

function spawnMole() {
  const available = holes.filter(h => !h.isUp);
  if (!available.length) return;

  const hole     = available[Math.floor(Math.random() * available.length)];
  const isGolden = Math.random() < GOLDEN_CHANCE;

  const elapsed      = GAME_DURATION - timeLeft;
  const difficulty   = Math.min(elapsed / 18, 3);
  const stayDuration = Math.max(550, 1150 - difficulty * 140);

  raiseMole(hole, isGolden);
  hole.upTimer = setTimeout(() => { if (hole.isUp) lowerMole(hole); }, stayDuration);
}

function raiseMole(hole, isGolden) {
  hole.isUp     = true;
  hole.isGolden = isGolden;
  hole.el.classList.add('up');
  if (isGolden) hole.el.classList.add('golden');
  hole.el.querySelector('.mole-face').textContent = isGolden ? '✦' : '◈';
}

function lowerMole(hole, instant) {
  if (hole.upTimer) { clearTimeout(hole.upTimer); hole.upTimer = null; }
  hole.isUp     = false;
  hole.isGolden = false;
  if (instant) {
    hole.el.className = 'hole';
  } else {
    hole.el.classList.remove('up', 'golden', 'hit');
  }
}

function whack(idx) {
  if (!gameActive) return;
  const hole = holes[idx];
  if (!hole.isUp || hole.el.classList.contains('hit')) return;

  const isGolden = hole.isGolden;
  const pts      = isGolden ? POINTS_GOLDEN : POINTS_NORMAL;
  score += pts;

  if (window.SFX) SFX.play(isGolden ? 'goldenWhack' : 'whack');
  if (navigator.vibrate) navigator.vibrate(isGolden ? [20, 10, 30] : 25);
  if (window.Achievements) {
    if (score >= 50) Achievements.unlock('mole_50');
    if (isGolden) Achievements.unlock('mole_golden');
  }

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bestMole', bestScore);
    document.getElementById('best').textContent = bestScore;
  }
  document.getElementById('score').textContent = score;

  hole.el.classList.add('hit');
  showPointPopup(hole.el, pts, isGolden);

  clearTimeout(hole.upTimer);
  hole.upTimer = setTimeout(() => lowerMole(hole), 280);
}

function showPointPopup(el, pts, isGolden) {
  const pop = document.createElement('div');
  pop.className = 'point-popup ' + (isGolden ? 'golden' : 'normal');
  pop.textContent = '+' + pts;
  el.appendChild(pop);
  setTimeout(() => pop.remove(), 700);
}

function endGame() {
  gameActive = false;
  clearInterval(countdownTimer);
  clearTimeout(spawnTimeout);
  holes.forEach(h => lowerMole(h));
  if (window.SFX) SFX.play('timeUp');
  if (navigator.vibrate) navigator.vibrate([60, 30, 60]);

  document.getElementById('overlay-title').textContent = 'ГОТОВО!';
  document.getElementById('overlay-score').textContent =
    `СЧЁТ: ${score} // РЕКОРД: ${bestScore}`;
  document.getElementById('start-btn').textContent = '[ ЗАНОВО ]';
  document.getElementById('overlay').style.display = 'flex';
}

buildGrid();
document.getElementById('start-btn').addEventListener('click', () => { if (window.SFX) SFX.play('start'); localStorage.setItem('plays_mole', (+localStorage.getItem('plays_mole') || 0) + 1); startGame(); });
