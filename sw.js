'use strict';

const CACHE = 'arcade-v2';
const PRECACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/style.css',
  '/shared/style.css',
  '/shared/arcade.js',
  '/shared/sound.js',
  '/shared/achievements.js',
  '/tetris/',
  '/tetris/style.css',
  '/tetris/game.js',
  '/snake/',
  '/snake/style.css',
  '/snake/game.js',
  '/breakout/',
  '/breakout/style.css',
  '/breakout/game.js',
  '/tictactoe/',
  '/tictactoe/style.css',
  '/tictactoe/game.js',
  '/2048/',
  '/2048/style.css',
  '/2048/game.js',
  '/mole/',
  '/mole/style.css',
  '/mole/game.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Skip API and external requests
  if (e.request.url.includes('/api/') || !e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }))
      .catch(() => caches.match('/'))
  );
});
