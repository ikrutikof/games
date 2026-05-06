'use strict';

(function () {
  const DEFS = {
    snake_eat10:       { name: 'Обжора',         desc: 'Набрал 100 очков в Змейке',    icon: '🐍' },
    snake_length30:    { name: 'Удав',            desc: 'Длина змейки 30+',             icon: '🐍' },
    tetris_4lines:     { name: 'Тетрис!',         desc: 'Убрал 4 линии за один раз',   icon: '▬' },
    tetris_level5:     { name: 'Мастер блоков',   desc: 'Достиг 5 уровня в Тетрисе',   icon: '▬' },
    breakout_levelup:  { name: 'Разрушитель',     desc: 'Перешёл на новый уровень',    icon: '🧱' },
    tictactoe_ai_hard: { name: 'Шахматист',       desc: 'Победил AI на сложном',        icon: '✕' },
    mole_50:           { name: 'Молоточник',      desc: 'Набрал 50+ очков в Шлёпе',    icon: '◈' },
    mole_golden:       { name: 'Охотник',         desc: 'Поймал золотого мутанта',      icon: '✦' },
    game2048_1024:     { name: 'Полпути',         desc: 'Собрал плитку 1024 в 2048',   icon: '🟦' },
    game2048_win:      { name: '2048!',           desc: 'Собрал плитку 2048',           icon: '🏆' },
    konami:            { name: 'Читер',           desc: 'Ввёл код Konami',              icon: '🎮' },
    all_games:         { name: 'Arcade Master',   desc: 'Открыл все 6 игр',             icon: '⭐' },
  };

  const STORE_KEY = 'arcade_achievements';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function unlock(id) {
    if (!DEFS[id]) return;
    const data = load();
    if (data[id]) return;
    data[id] = Date.now();
    save(data);
    showToast(DEFS[id]);
    if (window.SFX) SFX.play('win');
    trackAllGames(data);
  }

  function trackAllGames(data) {
    const games = ['snake_eat10', 'tetris_4lines', 'breakout_levelup',
                   'tictactoe_ai_hard', 'mole_50', 'game2048_1024'];
    if (games.every(k => data[k]) && !data['all_games']) {
      setTimeout(() => unlock('all_games'), 1200);
    }
  }

  function showToast(def) {
    const el = document.createElement('div');
    el.className = 'ach-toast';
    el.innerHTML = `
      <div class="ach-icon">${def.icon}</div>
      <div class="ach-body">
        <div class="ach-label">// АЧИВКА //</div>
        <div class="ach-name">${def.name}</div>
        <div class="ach-desc">${def.desc}</div>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 500);
    }, 3600);
  }

  function getAll() { return load(); }
  function getDefs() { return DEFS; }

  window.Achievements = { unlock, getAll, getDefs };
})();
