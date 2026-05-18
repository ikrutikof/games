'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH  = path.join(__dirname, 'arcade.db');
const db       = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    game    TEXT    NOT NULL,
    nick    TEXT    NOT NULL,
    score   INTEGER NOT NULL,
    ts      INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores(game, score DESC);
`);

// Migrate from scores.json if it exists and db is empty
const JSON_PATH = path.join(__dirname, '..', 'api', 'scores.json');
if (fs.existsSync(JSON_PATH) && db.prepare('SELECT COUNT(*) as c FROM scores').get().c === 0) {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const insert = db.prepare('INSERT INTO scores (game, nick, score, ts) VALUES (?, ?, ?, ?)');
  const migrate = db.transaction((data) => {
    for (const [game, entries] of Object.entries(data)) {
      for (const e of entries) {
        insert.run(game, e.nick, e.score, e.ts);
      }
    }
  });
  migrate(data);
  console.log('Migrated scores.json → arcade.db');
}

const MAX_PER_GAME = 10;

const stmts = {
  getScores:  db.prepare('SELECT nick, score, ts FROM scores WHERE game = ? ORDER BY score DESC LIMIT ?'),
  insertScore: db.prepare('INSERT INTO scores (game, nick, score, ts) VALUES (?, ?, ?, ?)'),
  countAbove: db.prepare('SELECT COUNT(*) as c FROM scores WHERE game = ? AND score > ?'),
  trimGame:   db.prepare(`
    DELETE FROM scores WHERE game = ? AND id NOT IN (
      SELECT id FROM scores WHERE game = ? ORDER BY score DESC LIMIT ?
    )
  `),
};

function getScores(game) {
  return stmts.getScores.all(game, MAX_PER_GAME);
}

function addScore(game, nick, score) {
  const ts = Date.now();
  stmts.insertScore.run(game, nick, score, ts);
  stmts.trimGame.run(game, game, MAX_PER_GAME);
  const rank = stmts.countAbove.get(game, score).c + 1;
  return rank <= MAX_PER_GAME ? rank : null;
}

module.exports = { getScores, addScore };
