# Аркадная платформа — Архитектура

## Структура

Единый монорепозиторий для всех игр на [coldline.cc](https://coldline.cc).

```
/home/projects/games/
├── index.html          → coldline.cc/          (каталог)
├── tictactoe/
│   └── index.html      → coldline.cc/tictactoe/
├── snake/
│   └── index.html      → coldline.cc/snake/
├── tetris/
│   └── index.html      → coldline.cc/tetris/
└── docs/
    └── architecture.ru.md
```

Каждая игра — **один самодостаточный `index.html`**: весь CSS и JS встроены, нет шага сборки, нет зависимостей кроме Google Fonts.

## Деплой

Любое изменение `index.html` сразу становится доступно — nginx раздаёт файлы напрямую.

Перезагрузка nginx нужна только при правке `/etc/nginx/sites-available/coldline.conf`:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

Добавление новой игры:
1. Создать `games/<название>/index.html`
2. Добавить блок `location /<название>/` в `coldline.conf`, указав на `/home/projects/games/<название>/`
3. Добавить карточку в `games/index.html`

## Nginx

Конфиг: `/etc/nginx/sites-available/coldline.conf`
Слушает на `79.132.141.127:80` и `:443` (конкретный IP — особенность хостинга Fornex).

## Git и GitHub

Репозиторий: `ikrutikof/games` — единый репо для всех игр и каталога.

```bash
cd /home/projects/games
git add .
git commit -m "описание"
git push
```

GitHub CLI (`gh`) авторизован как `ikrutikof`, токен истекает 19 июля 2026.

## Визуальная дизайн-система

Все игры используют единую киберпанк-эстетику:

| Переменная | Значение |
|------------|----------|
| `--cyan` | `#00f5ff` |
| `--magenta` | `#ff00a0` |
| `--yellow` | `#f5e642` |
| `--dark` | `#050510` |

**Шрифты:** `Orbitron` (заголовки/UI), `Share Tech Mono` (основной текст)

**Фон:** тёмная основа + сканлайны `::before` + сетка `::after` (оба `position: fixed`, `pointer-events: none`)

**Вьюпорт:** всегда добавлять `viewport-fit=cover` и `overflow-x: hidden; overflow-y: auto` на body (совместимость с Telegram WebView)

**Safe area:** `padding-bottom: max(40px, env(safe-area-inset-bottom, 20px))` на основном контейнере

## Архитектура игр

### Крестики-нолики (`tictactoe/index.html`)

**Состояние:** `SIZE`, `WIN_LEN`, `board[]` (плоский массив `SIZE*SIZE`), `current`, `vsAI`, `hardMode`, `scores`

**Ключевые функции:**
- `init()` — пересоздаёт DOM доски; вызывать при изменении `SIZE` или `WIN_LEN`
- `checkWin(b)` — сканирует 4 направления на `WIN_LEN` подряд идущих символов
- `bestMoveHard()` — минимакс + альфа-бета отсечение; глубина 9 для 3×3 (идеальная игра), глубина 4 для 5×5

### Тетрис (`tetris/index.html`)

Canvas-рендеринг (300×600). Фигуры заданы матрицами в `SHAPES`, цвета — в `COLORS`.

**Ключевые функции:**
- `rotate(matrix)` — чистый поворот матрицы, используется для всех фигур
- `collides(mat, ox, oy)` — проверка коллизий с полем и стенками
- `lockPiece()` → вызывает `clearLines()` → вызывает `spawnPiece()`
- `ghostY()` — вычисляет строку приземления для призрак-превью жёсткого сброса
- Интервал падения: `max(100, 800 - (level-1) * 70)` мс

### Змейка (`snake/index.html`)

Canvas-рендеринг (300×540). Бесконечный раннер: змейка всегда движется вверх в мировых координатах; камера следит за головой.

**Основная модель:**
- `snake[]` — массив `{x, wy}` (мировой Y), голова первая
- `objects[]` — `{x, wy, type}`, где type: `'food'` | `'soft'` | `'hard'`
- `camWY` — мировой Y верхней строки экрана; обновляется каждый тик, держа голову на `ROWS-3` от верха
- `inputDX` — `-1 | 0 | 1`, задаётся удерживаемыми стрелками

**Ключевые функции:**
- `generateAhead()` / `spawnRow(wy)` — процедурно заполняет объекты на 2 экрана вперёд
- `tick()` — двигает змейку, обрабатывает коллизии, чистит объекты за экраном
- Скорость: `max(80, 220 - (speedLevel-1) * 18)` мс/тик; `speedLevel = floor(score/150) + 1`

Мягкие блоки: уничтожаются при касании (очки +5, кратковременный рост). Твёрдые блоки = смерть. Еда = рост + очки +10.
