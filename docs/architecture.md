# Arcade Platform — Architecture

## Structure

Single monorepo for all games on [coldline.cc](https://coldline.cc).

```
/home/projects/games/
├── index.html          → coldline.cc/          (catalog)
├── tictactoe/
│   └── index.html      → coldline.cc/tictactoe/
├── snake/
│   └── index.html      → coldline.cc/snake/
├── tetris/
│   └── index.html      → coldline.cc/tetris/
└── docs/
    └── architecture.md
```

Each game is a **single self-contained `index.html`** — inline CSS and JS, no build step, no dependencies except Google Fonts.

## Deployment

Editing any `index.html` makes changes **live immediately** — nginx serves files directly.

Nginx reload is only needed when editing `/etc/nginx/sites-available/coldline.conf`:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

Adding a new game:
1. Create `games/<name>/index.html`
2. Add `location /<name>/` block in `coldline.conf` pointing to `/home/projects/games/<name>/`
3. Add a card to `games/index.html`

## Nginx

Config: `/etc/nginx/sites-available/coldline.conf`
Listens on `79.132.141.127:80` and `:443` (specific IP — required by Fornex hosting panel).

## Git & GitHub

Repo: `ikrutikof/games` — single repo for all games and the catalog.

```bash
cd /home/projects/games
git add .
git commit -m "description"
git push
```

GitHub CLI (`gh`) authenticated as `ikrutikof`, token expires 2026-07-19.

## Visual Design System

All games share the same cyberpunk aesthetic:

| Token | Value |
|-------|-------|
| `--cyan` | `#00f5ff` |
| `--magenta` | `#ff00a0` |
| `--yellow` | `#f5e642` |
| `--dark` | `#050510` |

**Fonts:** `Orbitron` (headings/UI), `Share Tech Mono` (body)

**Background:** dark base + scanline `::before` + grid `::after` (both `position: fixed`, `pointer-events: none`)

**Viewport:** always include `viewport-fit=cover` and `overflow-x: hidden; overflow-y: auto` on body (Telegram WebView compatibility)

**Safe area:** `padding-bottom: max(40px, env(safe-area-inset-bottom, 20px))` on main container

## Game Architectures

### Tic-tac-toe (`tictactoe/index.html`)

**State:** `SIZE`, `WIN_LEN`, `board[]` (flat `SIZE*SIZE`), `current`, `vsAI`, `hardMode`, `scores`

**Key functions:**
- `init()` — rebuilds board DOM; call after any `SIZE`/`WIN_LEN` change
- `checkWin(b)` — scans 4 directions for `WIN_LEN` consecutive symbols
- `bestMoveHard()` — minimax + alpha-beta; depth 9 for 3×3 (perfect play), depth 4 for 5×5

### Tetris (`tetris/index.html`)

Canvas-based (300×600). Pieces defined as matrices in `SHAPES`, colors in `COLORS`.

**Key functions:**
- `rotate(matrix)` — pure rotation, used for all piece rotations
- `collides(mat, ox, oy)` — collision check against board and walls
- `lockPiece()` → calls `clearLines()` → calls `spawnPiece()`
- `ghostY()` — calculates hard-drop landing row for ghost preview
- Drop interval: `max(100, 800 - (level-1) * 70)` ms

### Snake Run (`snake/index.html`)

Canvas-based (300×540). Endless runner: snake always advances upward; camera follows head.

**Core model:**
- `snake[]` — array of `{x, wy}` (world Y), head-first
- `objects[]` — `{x, wy, type}` where type is `'food'` | `'soft'` | `'hard'`
- `camWY` — world Y of the top screen row; updated each tick to keep head at `ROWS-3` from top
- `inputDX` — `-1 | 0 | 1`, set by held arrow keys

**Key functions:**
- `generateAhead()` / `spawnRow(wy)` — procedurally fills objects 2 screens ahead
- `tick()` — advances snake, resolves collisions, cleans off-screen objects
- Speed: `max(80, 220 - (speedLevel-1) * 18)` ms/tick; `speedLevel = floor(score/150) + 1`

Soft blocks: destroy on contact (score +5, brief grow). Hard blocks = death. Food = grow + score +10.
