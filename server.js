'use strict';

const express = require('express');
const path    = require('path');
const pages   = require('./routes/pages');

const app  = express();
const PORT = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('strict routing', false);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for API
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://coldline.cc');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// API routes
app.use('/api', require('./routes/api'));

// Page routes — before static to prevent directory redirects
app.get(['/', '/index.html'],              pages.index);
app.get(['/leaderboard', '/leaderboard/'], pages.leaderboard);
app.get(['/profile', '/profile/'],         pages.profile);

// Static files (games served with index.html, pages handled by EJS above)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Arcade server running on 127.0.0.1:${PORT}`);
});
