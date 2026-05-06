'use strict';

(function () {
  let ctx = null;
  let muted = localStorage.getItem('sfx_muted') === 'true';

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'square', vol = 0.28, delay = 0) {
    if (muted) return;
    try {
      const a = ac();
      const osc  = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain);
      gain.connect(a.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, a.currentTime + delay);
      gain.gain.setValueAtTime(0, a.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, a.currentTime + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
      osc.start(a.currentTime + delay);
      osc.stop(a.currentTime + delay + dur + 0.01);
    } catch (_) {}
  }

  function chord(notes) {
    notes.forEach(([f, d, t, v, dl]) => tone(f, d, t, v, dl));
  }

  const SFX = {
    // Navigation / UI
    click:     () => tone(900, 0.05, 'square', 0.15),
    back:      () => chord([[400, 0.06, 'square', 0.15], [300, 0.08, 'square', 0.12, 0.04]]),

    // Snake
    eat:       () => chord([[523, 0.05, 'square', 0.2], [659, 0.08, 'square', 0.18, 0.04]]),
    die:       () => chord([[300, 0.1, 'sawtooth', 0.25], [200, 0.2, 'sawtooth', 0.2, 0.08], [150, 0.3, 'sawtooth', 0.15, 0.18]]),

    // Tetris
    move:      () => tone(400, 0.03, 'square', 0.12),
    rotate:    () => tone(650, 0.04, 'triangle', 0.14),
    lock:      () => tone(250, 0.06, 'square', 0.18),
    clear1:    () => chord([[440, 0.08, 'sine', 0.2], [550, 0.1, 'sine', 0.2, 0.05]]),
    clear4:    () => chord([[440, 0.1, 'sine', 0.25], [550, 0.1, 'sine', 0.25, 0.06], [660, 0.12, 'sine', 0.25, 0.12], [880, 0.15, 'sine', 0.3, 0.2]]),
    hardDrop:  () => chord([[180, 0.05, 'square', 0.2], [120, 0.08, 'square', 0.18, 0.03]]),

    // Breakout
    paddle:    () => tone(550, 0.03, 'square', 0.15),
    block:     () => chord([[440, 0.04, 'square', 0.18], [360, 0.05, 'square', 0.12, 0.02]]),
    loseLife:  () => chord([[300, 0.12, 'sawtooth', 0.2], [220, 0.18, 'sawtooth', 0.18, 0.1]]),
    levelUp:   () => chord([[523, 0.08, 'sine', 0.2], [659, 0.1, 'sine', 0.22, 0.1], [784, 0.14, 'sine', 0.25, 0.22]]),

    // Tictactoe
    place:     () => tone(600, 0.06, 'triangle', 0.18),
    win:       () => chord([[523, 0.1, 'sine', 0.2], [659, 0.1, 'sine', 0.22, 0.08], [784, 0.12, 'sine', 0.25, 0.18], [1046, 0.2, 'sine', 0.28, 0.3]]),
    draw:      () => chord([[400, 0.1, 'triangle', 0.15], [350, 0.12, 'triangle', 0.12, 0.08]]),

    // 2048
    slide:     () => tone(320, 0.04, 'sine', 0.1),
    merge:     () => chord([[440, 0.06, 'sine', 0.15], [550, 0.08, 'sine', 0.18, 0.04]]),
    reach2048: () => chord([[523, 0.1, 'sine', 0.2], [659, 0.1, 'sine', 0.22, 0.06], [784, 0.12, 'sine', 0.25, 0.14], [1046, 0.16, 'sine', 0.3, 0.24], [1318, 0.22, 'sine', 0.35, 0.36]]),

    // Mole
    whack:     () => chord([[700, 0.03, 'square', 0.2], [350, 0.07, 'square', 0.15, 0.03]]),
    goldenWhack: () => chord([[800, 0.05, 'sine', 0.2], [1000, 0.06, 'sine', 0.22, 0.05], [1200, 0.1, 'sine', 0.25, 0.12]]),
    timeUp:    () => chord([[400, 0.1, 'sawtooth', 0.2], [300, 0.15, 'sawtooth', 0.18, 0.1], [200, 0.22, 'sawtooth', 0.15, 0.22]]),

    // Generic
    gameOver:  () => chord([[300, 0.12, 'sawtooth', 0.22], [220, 0.2, 'sawtooth', 0.2, 0.1], [160, 0.3, 'sawtooth', 0.18, 0.22]]),
    start:     () => chord([[330, 0.06, 'square', 0.18], [440, 0.08, 'square', 0.2, 0.07], [550, 0.12, 'square', 0.22, 0.16]]),
  };

  function play(name) {
    if (muted || !SFX[name]) return;
    SFX[name]();
  }

  function setMuted(val) {
    muted = val;
    localStorage.setItem('sfx_muted', val);
    updateMuteBtn();
  }

  function toggleMute() { setMuted(!muted); }

  function updateMuteBtn() {
    document.querySelectorAll('.mute-btn').forEach(btn => {
      btn.textContent  = muted ? '[ 🔇 ]' : '[ 🔊 ]';
      btn.title        = muted ? 'Включить звук' : 'Выключить звук';
    });
  }

  // Inject mute button into every .nav-bar
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-bar').forEach(bar => {
      const btn = document.createElement('button');
      btn.className = 'btn mute-btn';
      btn.style.marginLeft = 'auto';
      btn.addEventListener('click', () => { toggleMute(); play('click'); });
      bar.appendChild(btn);
      updateMuteBtn();
    });
  });

  // Resume AudioContext on first interaction (iOS requirement)
  document.addEventListener('touchstart', () => { if (ctx) ctx.resume(); }, { once: true, passive: true });
  document.addEventListener('click',      () => { if (ctx) ctx.resume(); }, { once: true });

  window.SFX = { play, toggleMute, get muted() { return muted; } };
})();
