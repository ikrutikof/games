'use strict';

window.LB = {
  submit(game, score) {
    const nick = localStorage.getItem('arcade_nick') || 'АНОНИМ';
    fetch(`/api/scores/${game}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, score }),
    }).catch(() => {});
  },
};
