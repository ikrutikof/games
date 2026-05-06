(function () {
  'use strict';

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
})();
