let SIZE = 3, WIN_LEN = 3;
let board, current, over;
let vsAI = false, hardMode = false;
let scores = {X:0, O:0, D:0};

const statusEl = document.getElementById('status');
const boardEl  = document.getElementById('board');
const labelX   = document.getElementById('label-x');
const labelO   = document.getElementById('label-o');
const diffRow  = document.getElementById('diff-row');

function setActive(groupIds, activeId) {
  groupIds.forEach(id => {
    const el = document.getElementById(id);
    el.classList.toggle('active', id === activeId);
  });
}

document.getElementById('mode-pvp').addEventListener('click', () => {
  vsAI = false;
  scores = {X:0,O:0,D:0}; updateScores();
  setActive(['mode-pvp','mode-ai'], 'mode-pvp');
  diffRow.classList.add('hidden');
  labelX.textContent = 'ИГРОК X';
  labelO.textContent = 'ИГРОК O';
  init();
});

document.getElementById('mode-ai').addEventListener('click', () => {
  vsAI = true;
  scores = {X:0,O:0,D:0}; updateScores();
  setActive(['mode-pvp','mode-ai'], 'mode-ai');
  diffRow.classList.remove('hidden');
  labelX.textContent = 'ВЫ (X)';
  labelO.textContent = 'КОМПЬЮТЕР';
  init();
});

document.getElementById('size-3').addEventListener('click', () => {
  if (SIZE === 3) return;
  SIZE = 3; WIN_LEN = 3;
  scores = {X:0,O:0,D:0}; updateScores();
  setActive(['size-3','size-5'], 'size-3');
  init();
});

document.getElementById('size-5').addEventListener('click', () => {
  if (SIZE === 5) return;
  SIZE = 5; WIN_LEN = 4;
  scores = {X:0,O:0,D:0}; updateScores();
  setActive(['size-3','size-5'], 'size-5');
  init();
});

document.getElementById('diff-easy').addEventListener('click', () => {
  hardMode = false;
  scores = {X:0,O:0,D:0}; updateScores();
  document.getElementById('diff-easy').classList.add('active');
  document.getElementById('diff-hard').classList.remove('active');
  init();
});

document.getElementById('diff-hard').addEventListener('click', () => {
  hardMode = true;
  scores = {X:0,O:0,D:0}; updateScores();
  document.getElementById('diff-hard').classList.add('active');
  document.getElementById('diff-easy').classList.remove('active');
  init();
});

document.getElementById('restart').addEventListener('click', init);

function init() {
  board   = Array(SIZE * SIZE).fill(null);
  current = 'X';
  over    = false;
  boardEl.className = `board size-${SIZE}`;

  boardEl.innerHTML = '';
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.i = i;
    cell.addEventListener('click', handleClick);
    boardEl.appendChild(cell);
  }

  setStatus('turn');
}

function cells() { return boardEl.querySelectorAll('.cell'); }

function setStatus(type, winner) {
  const name = p => (vsAI && p === 'O') ? 'КОМПЬЮТЕР' : `ИГРОК ${p}`;
  const map = {
    turn:     () => ({ cls: current==='X' ? 'x-turn':'o-turn', txt: `ХОД: ${name(current)}` }),
    thinking: () => ({ cls: 'o-turn', txt: 'КОМПЬЮТЕР ДУМАЕТ...' }),
    win:      () => ({ cls: winner==='X' ? 'x-win':'o-win',    txt: `ПОБЕДА: ${name(winner)}!` }),
    draw:     () => ({ cls: 'draw', txt: '// НИЧЬЯ //' }),
  };
  const {cls,txt} = map[type]();
  statusEl.className = `status ${cls}`;
  statusEl.textContent = txt;
}

const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

function checkWin(b) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = b[r*SIZE+c];
      if (!p) continue;
      for (const [dr,dc] of DIRS) {
        const line = [];
        for (let k = 0; k < WIN_LEN; k++) {
          const nr = r+dr*k, nc = c+dc*k;
          if (nr<0||nr>=SIZE||nc<0||nc>=SIZE||b[nr*SIZE+nc]!==p) break;
          line.push(nr*SIZE+nc);
        }
        if (line.length === WIN_LEN) return { winner: p, line };
      }
    }
  }
  return null;
}

function placeMove(i, player) {
  board[i] = player;
  const cell = boardEl.querySelector(`[data-i="${i}"]`);
  cell.textContent = player;
  cell.classList.add('taken', player.toLowerCase(), 'pop');
}

function finishTurn() {
  const result = checkWin(board);
  if (result) {
    over = true;
    scores[result.winner]++;
    updateScores();
    result.line.forEach(idx => {
      boardEl.querySelector(`[data-i="${idx}"]`).classList.add('win-cell');
    });
    setStatus('win', result.winner);
    return true;
  }
  if (board.every(Boolean)) {
    over = true; scores.D++; updateScores();
    setStatus('draw'); return true;
  }
  return false;
}

function handleClick(e) {
  const i = +e.currentTarget.dataset.i;
  if (over || board[i]) return;
  placeMove(i, 'X');
  if (finishTurn()) return;
  current = 'O';
  if (vsAI) {
    boardEl.classList.add('thinking');
    setStatus('thinking');
    setTimeout(aiMove, SIZE === 5 ? 300 : 420);
  } else {
    setStatus('turn');
  }
}

function aiMove() {
  boardEl.classList.remove('thinking');
  const i = hardMode ? bestMoveHard() : bestMoveEasy();
  placeMove(i, 'O');
  if (!finishTurn()) { current = 'X'; setStatus('turn'); }
}

function bestMoveEasy() {
  const empty = board.map((v,i) => v==null ? i : null).filter(i => i!==null);
  for (const i of empty) {
    board[i]='O'; if (checkWin(board)) { board[i]=null; return i; } board[i]=null;
  }
  for (const i of empty) {
    board[i]='X'; if (checkWin(board)) { board[i]=null; return i; } board[i]=null;
  }
  return empty[Math.floor(Math.random()*empty.length)];
}

function bestMoveHard() {
  const maxDepth = SIZE === 3 ? 9 : 4;
  let best = -Infinity, move = -1;
  const empty = board.map((v,i) => v==null ? i : null).filter(i => i!==null);
  empty.sort((a,b) => centerScore(b) - centerScore(a));
  for (const i of empty) {
    board[i] = 'O';
    const s = minimax(board, 0, false, -Infinity, Infinity, maxDepth);
    board[i] = null;
    if (s > best) { best = s; move = i; }
  }
  return move;
}

function centerScore(i) {
  const r = Math.floor(i/SIZE), c = i%SIZE, mid = (SIZE-1)/2;
  return -(Math.abs(r-mid) + Math.abs(c-mid));
}

function minimax(b, depth, isMax, alpha, beta, maxDepth) {
  const r = checkWin(b);
  if (r) return r.winner==='O' ? 100-depth : depth-100;
  if (b.every(Boolean) || depth===maxDepth) return depth===maxDepth ? heuristic(b) : 0;

  const empty = b.map((v,i) => v==null ? i : null).filter(i => i!==null);
  if (isMax) {
    let best = -Infinity;
    for (const i of empty) {
      b[i]='O'; best = Math.max(best, minimax(b,depth+1,false,alpha,beta,maxDepth)); b[i]=null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      b[i]='X'; best = Math.min(best, minimax(b,depth+1,true,alpha,beta,maxDepth)); b[i]=null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function heuristic(b) {
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      for (const [dr,dc] of DIRS) {
        let oCount=0, xCount=0;
        for (let k=0; k<WIN_LEN; k++) {
          const nr=r+dr*k, nc=c+dc*k;
          if (nr<0||nr>=SIZE||nc<0||nc>=SIZE) { oCount=xCount=-1; break; }
          const v=b[nr*SIZE+nc];
          if (v==='O') oCount++; else if (v==='X') xCount++;
        }
        if (xCount===0 && oCount>0) score += Math.pow(10,oCount);
        if (oCount===0 && xCount>0) score -= Math.pow(10,xCount);
      }
    }
  }
  return score;
}

function updateScores() {
  document.getElementById('score-x').textContent = scores.X;
  document.getElementById('score-o').textContent = scores.O;
  document.getElementById('score-d').textContent = scores.D;
}

init();
