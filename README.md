<h1 align="center">Snake Game</h1>

<p align="center">
  A classic Snake game in vanilla JavaScript, with three difficulty levels, bonus food and a saved high score.<br />
  Steer with the arrow keys, eat red food for 10 points, and catch the orange bonus food before its value drops.
</p>

<p align="center">
  <a href="#running-it">Run it</a>
  ·
  <a href="#controls">Controls</a>
  ·
  <a href="#how-it-works">How it works</a>
</p>

Snake Game is a browser version of the arcade classic. You steer a snake around a grid, eat food to grow, and lose the round if the snake runs into a wall or into its own body. The snake gets faster as your score climbs, and your best score stays in your browser between visits.

The whole game is three static files, `index.html`, `styles.css` and `game.js`, plus five sound effects in `sound/`. It runs in any modern browser. There is no build step, no package to install and no account.

## What you get

- **Three speeds.** Easy, Normal and Hard start the snake at 5, 7 and 10 moves per second. Each time red food takes your score to a multiple of 50, the speed rises by 0.5, 1 or 1.5 and stops once it reaches 15.
- **Bonus food that loses value.** Once 150, 180 or 220 moves have passed since the last bonus, each move has a 15 percent chance to place one. It is worth up to 100 points, drops in steps of 10 toward 10 points over its 10 second lifetime, and disappears when the timer runs out. A blue bar across the top of the board shows the time left.
- **Pause and resume.** Esc freezes the round and opens the menu, and Continue Game picks it up again. If you change difficulty while paused, the new speed applies on resume and is recalculated from your current score.
- **Queued turns.** Up to three arrow presses wait in a queue between moves, so fast turns happen in the order you pressed them. A press that would reverse the snake into its own neck is ignored.
- **A game over animation.** The board shakes and flashes red for 50 animation frames, under a second on a 60 Hz screen, and then shows your final score. Press Enter to start a new round at the same difficulty.
- **A high score saved in your browser.** The best score is stored in `localStorage` under `snakeHighscore`, and your difficulty under `snakeDifficulty`. The Highscore panel resets the score after a confirmation. A sound plays the first time a round beats your saved best.
- **Five sound effects.** Eating red food, collecting bonus food, every 100 points, beating your best in a round and game over each have a sound in `sound/`. They need the page served from a web server. See [Running it](#running-it).

## Running it

There is no install step. Clone the repository, or download it as a ZIP and extract it.

```sh
git clone https://github.com/Anuraj-dev/Snake-game.git
cd Snake-game
```

Open `index.html` in your browser and click New Game.

### Sound

The sound effects load from root-relative paths such as `/sound/eat.wav`. When you open `index.html` straight from disk, those paths resolve to the root of your file system, so the sounds fail to load and the game stays silent. To hear sound, serve the folder with a local web server. For example, run `python3 -m http.server` inside `Snake-game` and open `http://localhost:8000`.

## Controls

| Key | What it does |
| --- | --- |
| Arrow keys | Turn the snake. |
| Esc | Pause or resume. The pause menu has Continue Game, Difficulty Level and Highscore. |
| Enter | Start a new round after game over. |

Red food is worth 10 points. Bonus food is worth up to 100 points while it lasts.

## Difficulty levels

Speed is measured in moves per second.

| Level | Starting speed | Speed added per 50 points | Moves before bonus food can appear |
| --- | --- | --- | --- |
| Easy | 5 | 0.5 | 150 |
| Normal | 7 | 1 | 180 |
| Hard | 10 | 1.5 | 220 |

Pick a level from the Difficulty Level menu before you start, or while paused. A change made during a round takes effect when you resume. Normal is the default when you have not picked one before.

## How it works

Snake Game runs on two timers. A `setInterval` moves the snake every `1000 / speed` milliseconds, and a `requestAnimationFrame` loop redraws the canvas and counts down the bonus timer. Changing speed replaces the interval, so the snake always moves at the current rate.

The snake is an array of grid cells with the head first. Each move adds a new head cell. If the head lands on food, the tail stays and the snake grows. Otherwise the tail is removed. After each move, the game checks the walls and the snake's own cells.

All of the logic sits in one `DOMContentLoaded` handler in `game.js`. The page loads no libraries.

### Files

- `index.html`: the page, score bar, canvas and menu overlay.
- `styles.css`: layout, canvas, buttons and the menu overlay.
- `game.js`: game state, movement, collisions, drawing, input and storage.
- `sound/`: the five WAV files.

## Changing the game

- Edit `snakeColors` in `game.js` to recolor the snake.
- Edit `difficulties` in `game.js` to change the starting speed, the speed added per 50 points and the bonus food wait.
- Edit `MAX_GAME_OVER_FRAMES` in `game.js` to make the game over animation longer or shorter.
- Edit the `width` and `height` attributes on `#gameCanvas` in `index.html` to resize the play area.

## License

Snake Game is released under the [MIT License](LICENSE).
