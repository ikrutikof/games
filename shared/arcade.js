(function () {
  'use strict';

  // ── Block iOS page scroll on game pages ─────────────────────
  // On game pages touchmove on document would scroll the page even when
  // touch-action:none is set on child elements. Prevent it entirely.
  if (!document.querySelector('.games-grid')) {
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  }

  // ── Corner bracket decorations (all pages) ──────────────────
  ['tl', 'tr', 'bl', 'br'].forEach(pos => {
    const el = document.createElement('div');
    el.className = 'corner-deco ' + pos;
    document.body.appendChild(el);
  });

  // ── Konami code easter egg ──────────────────────────────────
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let ki = 0;
  document.addEventListener('keydown', e => {
    ki = e.key === KONAMI[ki] ? ki + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (ki === KONAMI.length) { ki = 0; konamiActivate(); }
  });

  function konamiActivate() {
    if (document.querySelector('.konami-msg')) return;
    if (window.Achievements) Achievements.unlock('konami');
    const el = document.createElement('div');
    el.className = 'konami-msg';
    el.innerHTML = '// CHEAT CODE //<br><span>▲▲▼▼◄►◄► BA</span>';
    document.body.appendChild(el);
    document.body.classList.add('konami-active');
    setTimeout(() => {
      el.classList.add('out');
      document.body.classList.remove('konami-active');
      setTimeout(() => el.remove(), 600);
    }, 2800);
  }

  // ── Fullscreen button (game pages only) ────────────────────
  if (!document.querySelector('.games-grid')) {
    const nav = document.querySelector('.nav-bar');
    if (nav && document.fullscreenEnabled) {
      const fsBtn = document.createElement('button');
      fsBtn.className = 'nav-btn fs-btn';
      fsBtn.textContent = '[ ⛶ ]';
      fsBtn.title = 'Fullscreen';
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          fsBtn.textContent = '[ ✕ ]';
        } else {
          document.exitFullscreen();
          fsBtn.textContent = '[ ⛶ ]';
        }
      });
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) fsBtn.textContent = '[ ⛶ ]';
      });
      nav.appendChild(fsBtn);
    }
  }

  // ── Cursor trail (desktop, catalog + game pages) ────────────
  if (!('ontouchstart' in window)) {
    const trail = [];
    const TRAIL_N = 12;
    for (let i = 0; i < TRAIL_N; i++) {
      const d = document.createElement('div');
      d.className = 'cursor-trail';
      d.style.opacity = (1 - i / TRAIL_N) * 0.6;
      d.style.width = d.style.height = (6 - i * 0.35) + 'px';
      document.body.appendChild(d);
      trail.push({ el: d, x: -100, y: -100 });
    }
    let mx = -100, my = -100;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function animTrail() {
      let px = mx, py = my;
      trail.forEach((t, i) => {
        const nx = px + (t.x - px) * 0.4;
        const ny = py + (t.y - py) * 0.4;
        t.x = i === 0 ? mx : px;
        t.y = i === 0 ? my : py;
        t.el.style.transform = `translate(${t.x - 3}px, ${t.y - 3}px)`;
        px = t.x; py = t.y;
      });
      requestAnimationFrame(animTrail);
    })();
  }

  // ── Catalog-only features ───────────────────────────────────
  const grid = document.querySelector('.games-grid');
  if (!grid) return;

  // Typewriter effect on subtitle
  const sub = document.querySelector('.subtitle');
  if (sub) {
    const txt = sub.textContent.trim();
    sub.textContent = '';
    let i = 0;
    const iv = setInterval(() => {
      sub.textContent += txt[i++];
      if (i >= txt.length) clearInterval(iv);
    }, 80);
  }

  // Fake live player counter
  const liveEl = document.querySelector('.live-count');
  if (liveEl) {
    let val = 12 + Math.floor(Math.random() * 35);
    liveEl.textContent = val;
    setInterval(() => {
      val = Math.max(5, Math.min(99, val + (Math.random() < 0.5 ? 1 : -1)));
      liveEl.textContent = val;
    }, 2800);
  }

  // 3D card tilt + click ripple
  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(500px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) translateY(-6px) scale(1.03)`;
      card.style.boxShadow = `${-x * 30}px ${-y * 20}px 50px rgba(0,245,255,0.22)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
    card.addEventListener('pointerdown', e => {
      const r = card.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      card.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
  });

  // ── Terminal widget ─────────────────────────────────────────
  const termInput  = document.getElementById('term-input');
  const termOutput = document.getElementById('term-output');

  const TERM_CMDS = {
    help: () => [
      { t: 'info', v: 'Доступные команды:' },
      { t: 'out',  v: '  games       — список игр' },
      { t: 'out',  v: '  scores      — твои рекорды' },
      { t: 'out',  v: '  achievements — разблокированные ачивки' },
      { t: 'out',  v: '  stats       — статистика сессий' },
      { t: 'out',  v: '  clear       — очистить терминал' },
      { t: 'out',  v: '  konami      — ??'},
    ],
    games: () => [
      { t: 'info', v: '[ ИГРЫ ]' },
      { t: 'out',  v: '  /tictactoe/ — Крестики-нолики' },
      { t: 'out',  v: '  /tetris/    — Тетрис' },
      { t: 'out',  v: '  /snake/     — Змейка' },
      { t: 'out',  v: '  /breakout/  — Арканоид' },
      { t: 'out',  v: '  /2048/      — 2048' },
      { t: 'out',  v: '  /mole/      — Шлёп' },
    ],
    scores: () => {
      const keys = [
        ['bestSnake','Змейка'], ['bestTetris','Тетрис'],
        ['bestBreakout','Арканоид'], ['best2048','2048'],
        ['bestMole','Шлёп'],
      ];
      const lines = [{ t: 'info', v: '[ РЕКОРДЫ ]' }];
      keys.forEach(([k, name]) => {
        const v = localStorage.getItem(k);
        lines.push({ t: 'out', v: `  ${name.padEnd(12)} ${v ? v : '—'}` });
      });
      return lines;
    },
    achievements: () => {
      if (!window.Achievements) return [{ t: 'err', v: 'Achievements не загружены.' }];
      const all = Achievements.getAll();
      const defs = Achievements.getDefs();
      const lines = [{ t: 'info', v: `[ АЧИВКИ: ${Object.values(all).filter(Boolean).length} / ${Object.keys(defs).length} ]` }];
      Object.entries(defs).forEach(([id, def]) => {
        const unlocked = !!all[id];
        lines.push({ t: unlocked ? 'out' : 'err', v: `  ${unlocked ? '✓' : '?'} ${def.name}` });
      });
      return lines;
    },
    stats: () => {
      const keys = [
        ['plays_tictactoe','Крестики'], ['plays_snake','Змейка'],
        ['plays_tetris','Тетрис'], ['plays_breakout','Арканоид'],
        ['plays_2048','2048'], ['plays_mole','Шлёп'],
      ];
      const lines = [{ t: 'info', v: '[ СЕССИИ ]' }];
      let total = 0;
      keys.forEach(([k, name]) => {
        const v = parseInt(localStorage.getItem(k) || '0');
        total += v;
        lines.push({ t: 'out', v: `  ${name.padEnd(12)} ${v}` });
      });
      lines.push({ t: 'info', v: `  Итого: ${total} сессий` });
      return lines;
    },
    clear: () => { termOutput.innerHTML = ''; return []; },
    konami: () => {
      setTimeout(() => konamiActivate && konamiActivate(), 100);
      return [{ t: 'info', v: '// активируется... //' }];
    },
  };

  function termPrint(lines) {
    lines.forEach(({ t, v }) => {
      const el = document.createElement('div');
      el.className = `term-line ${t}`;
      el.textContent = v;
      termOutput.appendChild(el);
    });
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  if (termInput) {
    termInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const raw = termInput.value.trim();
      termInput.value = '';
      if (!raw) return;
      termPrint([{ t: 'cmd', v: `$ ${raw}` }]);
      const cmd = raw.toLowerCase().split(/\s+/)[0];
      const fn = TERM_CMDS[cmd];
      if (fn) {
        const out = fn();
        if (out && out.length) termPrint(out);
      } else {
        termPrint([{ t: 'err', v: `Команда не найдена: ${raw}. Введи "help".` }]);
      }
    });
    termPrint([{ t: 'info', v: '// ARCADE TERMINAL v1.0 // введи "help"' }]);
  }

  // ── Particle network canvas ─────────────────────────────────
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const mouse = { x: -999, y: -999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  const N = Math.min(55, Math.max(20, Math.floor(W * H / 22000)));
  const pts = Array.from({ length: N }, () => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    r:  Math.random() * 1.4 + 0.5,
  }));

  const DIST = 130, MR = 100;

  (function frame() {
    ctx.clearRect(0, 0, W, H);

    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d  = Math.hypot(dx, dy);
      if (d < MR && d > 0) {
        const f = (MR - d) / MR * 0.6;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 1.6) { p.vx = (p.vx / sp) * 1.6; p.vy = (p.vy / sp) * 1.6; }
    });

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < DIST) {
          ctx.strokeStyle = `rgba(0,245,255,${0.18 * (1 - d / DIST)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.shadowColor = 'rgba(0,245,255,0.9)';
    ctx.shadowBlur  = 8;
    pts.forEach(p => {
      ctx.fillStyle = 'rgba(0,245,255,0.7)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    requestAnimationFrame(frame);
  })();

  // ── Matrix rain screensaver (idle 30s on catalog) ───────────
  const ssCanvas = document.createElement('canvas');
  ssCanvas.id = 'screensaver';
  ssCanvas.style.cssText = 'position:fixed;inset:0;z-index:8000;display:none;cursor:none;';
  document.body.appendChild(ssCanvas);
  const sctx = ssCanvas.getContext('2d');
  let ssActive = false, ssAnim = null, idleTimer = null;
  const IDLE_MS = 30000;
  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMN0123456789';

  function ssResize() {
    ssCanvas.width  = window.innerWidth;
    ssCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', ssResize);
  ssResize();

  function startScreensaver() {
    if (ssActive) return;
    ssActive = true;
    ssCanvas.style.display = 'block';
    const cols = Math.floor(ssCanvas.width / 16);
    const drops = Array(cols).fill(1);
    function ssFrame() {
      sctx.fillStyle = 'rgba(5,5,16,0.08)';
      sctx.fillRect(0, 0, ssCanvas.width, ssCanvas.height);
      sctx.font = '14px Jura, monospace';
      drops.forEach((y, i) => {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const bright = Math.random() > 0.05;
        sctx.fillStyle = bright ? '#00f5ff' : 'rgba(0,245,255,0.4)';
        sctx.fillText(ch, i * 16, y * 16);
        if (y * 16 > ssCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      ssAnim = requestAnimationFrame(ssFrame);
    }
    ssFrame();
  }

  function stopScreensaver() {
    if (!ssActive) return;
    ssActive = false;
    ssCanvas.style.display = 'none';
    cancelAnimationFrame(ssAnim);
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    stopScreensaver();
    idleTimer = setTimeout(startScreensaver, IDLE_MS);
  }

  ['mousemove','keydown','touchstart','click'].forEach(ev =>
    document.addEventListener(ev, resetIdle, { passive: true })
  );
  ssCanvas.addEventListener('click', stopScreensaver);
  ssCanvas.addEventListener('touchstart', stopScreensaver, { passive: true });
  resetIdle();
})();
