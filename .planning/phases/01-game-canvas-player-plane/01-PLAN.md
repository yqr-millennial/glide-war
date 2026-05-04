---
phase: 1
wave: 1
files_modified:
  - index.html
  - css/style.css
  - js/game.js
requirements_addressed:
  - CORE-01
  - CORE-02
  - CORE-03
  - CORE-04
  - CORE-05
  - CORE-06
  - CORE-07
  - COMB-01
  - COMB-02
  - COMB-03
  - COMB-04
  - SCOR-01
  - SCOR-02
  - SCOR-03
  - FLOW-01
  - FLOW-02
  - FLOW-03
autonomous: true
---

# Plan 01: Glide War — Full Game Build

## Objective

Build the complete Glide War 2D plane battle game with canvas rendering, player controls, enemy spawning, bullet firing, collision detection, scoring, and game flow (start/game-over/restart).

## Tasks

### Task 1: Create HTML structure with game canvas
- **`<read_first>`**: None (new file)
- **`<action>`**: Create `index.html` with:
  - DOCTYPE html, lang="en"
  - `<title>Glide War</title>`
  - Link to `css/style.css`
  - `<canvas id="gameCanvas" width="480" height="720"></canvas>`
  - Score display div: `<div id="scoreDisplay">Score: 0</div>`
  - Game over overlay: `<div id="gameOver"><h1>Game Over</h1><p>Score: <span id="finalScore">0</span></p><button id="restartBtn">Play Again</button></div>`
  - Start screen overlay: `<div id="startScreen"><h1>Glide War</h1><p>Arrow keys to move<br>Spacebar to fire</p><button id="startBtn">Start Game</button></div>`
  - Script tag: `<script src="js/game.js"></script>`
- **`<acceptance_criteria>`**:
  - `index.html` contains `<canvas id="gameCanvas"`
  - `index.html` contains `width="480" height="720"`
  - `index.html` contains `<div id="scoreDisplay">`
  - `index.html` contains `<div id="gameOver">`
  - `index.html` contains `<div id="startScreen">`

### Task 2: Create CSS styling
- **`<read_first>`**: `index.html`
- **`<action>`**: Create `css/style.css` with:
  - Body: dark background (#1a1a2e), flexbox center, no margin overflow hidden
  - Canvas: border 2px solid #16213e, display block
  - Score display: absolute positioned top-right, color white, font 20px Arial
  - Game over overlay: absolute centered, hidden by default, dark bg
  - Start screen: absolute centered, visible by default
  - Buttons: styled with padding, border-radius, hover effect
- **`<acceptance_criteria>`**:
  - `css/style.css` exists
  - `css/style.css` contains `#gameCanvas`
  - `css/style.css` contains `#scoreDisplay`
  - `css/style.css` contains `#gameOver`

### Task 3: Implement game engine and all game logic
- **`<read_first>`**: `index.html`
- **`<action>`**: Create `js/game.js` with complete game:

  **Canvas & Context:**
  - Get canvas element, get 2d context
  - Game state: `{ running, score, gameOver }`

  **Player Plane:**
  - Object: `{ x: 240, y: 640, width: 40, height: 50, speed: 5 }`
  - Draw as a triangle/plane shape with color #00d4ff
  - Arrow key listeners for left/right movement
  - Clamp to canvas bounds (0 to canvasWidth - planeWidth)

  **Bullets:**
  - Array of `{ x, y, width: 4, height: 12, speed: 7 }`
  - Spacebar fires new bullet from player center position
  - 250ms cooldown between shots
  - Move upward each frame, remove when off-screen (y < 0)

  **Enemies:**
  - Array of `{ x, y, width: 36, height: 36, speed: 2 }`
  - Spawn every 1000ms at random X position at top
  - Move downward each frame
  - Remove when off-screen (y > canvasHeight)

  **Collision Detection:**
  - AABB collision function
  - Bullet vs enemy: on hit, remove both, score += 100
  - Player vs enemy: on hit, trigger gameOver

  **Game Loop (requestAnimationFrame):**
  - Clear canvas
  - If running: update bullets, enemies, collisions, score
  - Draw player, bullets, enemies
  - If gameOver: show overlay

  **Game Flow:**
  - Start button: set running=true, hide start screen
  - Game over: set running=false, show overlay with final score
  - Restart: reset all state, hide overlay, set running=true
- **`<acceptance_criteria>`**:
  - `js/game.js` contains `getElementById('gameCanvas')`
  - `js/game.js` contains `requestAnimationFrame`
  - `js/game.js` contains `addEventListener('keydown'`
  - `js/game.js` contains collision detection logic (`function checkCollision` or AABB check)
  - `js/game.js` contains `score +=`
  - `js/game.js` contains `gameOver = true`
  - `js/game.js` handles restart flow

### Verification
- Open `index.html` in browser
- Start screen shows with title and controls
- Plane moves left/right with arrow keys
- Spacebar fires bullets upward
- Enemies spawn from top and move down
- Bullets destroy enemies with score increment
- Player-enemy collision triggers game over
- Restart works from game over screen
