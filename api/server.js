'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = 3001;
const DB_FILE = path.join(__dirname, 'scores.json');
const MAX_PER_GAME = 10;

const ALLOWED_GAMES = ['snake','tetris','breakout','2048','mole','tictactoe'];

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return {}; }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://coldline.cc');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function sanitizeNick(nick) {
  return String(nick || 'АНОНИМ').replace(/[<>&"']/g, '').trim().slice(0, 20) || 'АНОНИМ';
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost`);
  const parts = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean);

  // GET /api/scores/:game
  if (req.method === 'GET' && parts[0] === 'scores' && parts[1]) {
    const game = parts[1];
    if (!ALLOWED_GAMES.includes(game)) return json(res, 400, { error: 'Unknown game' });
    const db = loadDB();
    return json(res, 200, db[game] || []);
  }

  // POST /api/scores/:game  { nick, score }
  if (req.method === 'POST' && parts[0] === 'scores' && parts[1]) {
    const game = parts[1];
    if (!ALLOWED_GAMES.includes(game)) return json(res, 400, { error: 'Unknown game' });

    let body = '';
    req.on('data', c => { body += c; if (body.length > 512) req.destroy(); });
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return json(res, 400, { error: 'Bad JSON' }); }

      const score = parseInt(data.score);
      if (!isFinite(score) || score < 0 || score > 9999999) return json(res, 400, { error: 'Invalid score' });

      const nick = sanitizeNick(data.nick);
      const db   = loadDB();
      if (!db[game]) db[game] = [];

      db[game].push({ nick, score, ts: Date.now() });
      db[game].sort((a, b) => b.score - a.score);
      db[game] = db[game].slice(0, MAX_PER_GAME);
      saveDB(db);
      return json(res, 200, { ok: true, rank: db[game].findIndex(e => e.nick === nick && e.score === score) + 1 });
    });
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Leaderboard API running on 127.0.0.1:${PORT}`);
});
