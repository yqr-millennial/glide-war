# Glide War

A 2D plane battle game built with HTML5 Canvas. Control your plane, shoot enemies, and survive as long as you can.

## How to Play

- **Arrow keys** — move left / right
- **Spacebar** — fire bullets
- Destroy enemies for 100 points each
- Difficulty increases every 500 points (faster spawns, faster enemies)
- Game over when an enemy hits your plane

## Play Now

Open `index.html` in any browser. No server, no install, no internet needed.

## Deploy

### Option 1: GitHub Pages (Free)

1. Push this repo to GitHub:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/glide-war.git
   git push -u origin main
   ```
2. Go to **Settings → Pages** in your GitHub repo
3. Under **Branch**, select `main` and click **Save**
4. Your game will be live at `https://YOUR_USERNAME.github.io/glide-war/`

### Option 2: Netlify (Free)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop this entire folder onto the Netlify dashboard
3. Your game is deployed instantly with a `*.netlify.app` URL

### Option 3: Any Static Host

This is a 100% static site. Drop these three files on any web server:

```
index.html
css/style.css
js/game.js
```

No build step. No dependencies. No server-side code.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Game page, canvas, UI overlays |
| `css/style.css` | Dark theme, layout, animations |
| `js/game.js` | Full game engine (Canvas, Audio, particles, difficulty) |

## Tech

- HTML5 Canvas for rendering
- Web Audio API for sound effects (all synthesized, no audio files)
- Zero external dependencies — works fully offline
