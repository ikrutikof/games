'use strict';

const router = require('express').Router();
const { getScores, addScore } = require('../db/database');
const GAMES = require('../config/games').map(g => g.id);

function sanitizeNick(nick) {
  return String(nick || 'АНОНИМ').replace(/[<>&"']/g, '').trim().slice(0, 20) || 'АНОНИМ';
}

router.get('/scores/:game', (req, res) => {
  const { game } = req.params;
  if (!GAMES.includes(game)) return res.status(400).json({ error: 'Unknown game' });
  res.json(getScores(game));
});

router.post('/scores/:game', (req, res) => {
  const { game } = req.params;
  if (!GAMES.includes(game)) return res.status(400).json({ error: 'Unknown game' });

  const score = parseInt(req.body.score);
  if (!isFinite(score) || score < 0 || score > 9999999)
    return res.status(400).json({ error: 'Invalid score' });

  const nick = sanitizeNick(req.body.nick);
  const rank = addScore(game, nick, score);
  res.json({ ok: true, rank });
});

module.exports = router;
