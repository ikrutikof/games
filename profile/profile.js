'use strict';

const GAMES = [
  { key: 'snake',     name: 'Змейка',           bestKey: null,         playKey: 'plays_snake' },
  { key: 'tetris',    name: 'Тетрис',            bestKey: null,         playKey: 'plays_tetris' },
  { key: 'breakout',  name: 'Арканоид',          bestKey: null,         playKey: 'plays_breakout' },
  { key: 'tictactoe', name: 'Крестики-нолики',   bestKey: null,         playKey: 'plays_tictactoe' },
  { key: '2048',      name: '2048',              bestKey: 'best2048',   playKey: 'plays_2048' },
  { key: 'mole',      name: 'Шлёп',             bestKey: 'bestMole',   playKey: 'plays_mole' },
];

// Nickname
const nickInput = document.getElementById('nickInput');
const nickSave  = document.getElementById('nickSave');
const savedNick = localStorage.getItem('arcade_nick') || '';
nickInput.value = savedNick;

nickSave.addEventListener('click', () => {
  const val = nickInput.value.trim().toUpperCase().replace(/[^A-ZА-ЯЁ0-9_\-]/g, '').slice(0, 16);
  nickInput.value = val;
  if (val) {
    localStorage.setItem('arcade_nick', val);
    nickSave.textContent = '[ ✓ ]';
    setTimeout(() => { nickSave.textContent = '[ OK ]'; }, 1200);
  }
});
nickInput.addEventListener('keydown', e => { if (e.key === 'Enter') nickSave.click(); });

// Stats grid
const statsGrid = document.getElementById('statsGrid');
GAMES.forEach(g => {
  const best = g.bestKey ? (localStorage.getItem(g.bestKey) || '—') : '—';
  const plays = localStorage.getItem(g.playKey) || '0';
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.innerHTML = `
    <a class="stat-link" href="/${g.key}/"></a>
    <div class="stat-name">${g.name}</div>
    <div class="stat-row"><span class="stat-label">Рекорд</span><span class="stat-val">${best}</span></div>
    <div class="stat-row"><span class="stat-label">Сессий</span><span class="stat-val">${plays}</span></div>`;
  statsGrid.appendChild(card);
});

// Achievements grid
const achGrid = document.getElementById('achGrid');
const unlocked = Achievements.getAll();
const defs = Achievements.getDefs();

Object.entries(defs).forEach(([id, def]) => {
  const done = !!unlocked[id];
  const el = document.createElement('div');
  el.className = 'ach-card' + (done ? ' done' : '');
  el.innerHTML = `
    <div class="ach-card-icon">${done ? def.icon : '?'}</div>
    <div class="ach-card-name">${done ? def.name : '???'}</div>
    <div class="ach-card-desc">${done ? def.desc : 'Не открыта'}</div>
    ${done ? `<div class="ach-card-date">${new Date(unlocked[id]).toLocaleDateString('ru')}</div>` : ''}`;
  achGrid.appendChild(el);
});

const total = Object.keys(defs).length;
const got   = Object.keys(unlocked).length;
const pct   = Math.round(got / total * 100);
const summary = document.createElement('div');
summary.className = 'ach-summary';
summary.textContent = `${got} / ${total} — ${pct}%`;
achGrid.before(summary);
