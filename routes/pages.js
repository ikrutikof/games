'use strict';

const GAMES = require('../config/games');

exports.index = (req, res) => {
  res.render('index', { games: GAMES, title: 'ARCADE // CYBERPUNK' });
};

exports.leaderboard = (req, res) => {
  res.render('leaderboard', { games: GAMES.filter(g => g.leaderboard), title: 'LEADERBOARD // ARCADE' });
};

exports.profile = (req, res) => {
  res.render('profile', { title: 'ПРОФИЛЬ // ARCADE' });
};
