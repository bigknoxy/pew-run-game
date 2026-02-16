# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

**ALWAYS use port 8000** — it is the only port open on the firewall. If port 8000 is occupied, kill the existing process first (`kill $(lsof -t -i:8000)`), then start the server.

```bash
python3 -m http.server 8000
# Access at http://localhost:8000
```

No build step, bundler, or package manager — all files are served directly. No linter is configured.

**IMPORTANT: After completing any code change, always (re)start the dev server on port 8000 so the user can immediately test.**

## Testing

Manual test pages exist for individual features (open in browser):
- `test.html` — Delta time normalization
- `test-highscore.html` — High score system
- `test-pause.html` — Pause menu
- `test-tutorial.html` — Tutorial system
- `test-wave.html` — Wave system
- `test-shake.html` — Screen shake
- `test-player-visibility.html` — Player visibility

There is no automated test runner.

## Architecture

This is a vanilla JavaScript Canvas-based 2D browser game (PWA). The entire game lives in three files:

- **`game.js`** (~2000 lines) — All game logic in a single file
- **`index.html`** — DOM structure for all UI overlays
- **`style.css`** — Styling, animations, overlay layouts

### Game Loop

`gameLoop(currentTime)` → `update(deltaTime)` → `draw()` via `requestAnimationFrame`. Delta time normalization ensures frame-rate-independent physics. Spawn timing uses an accumulator pattern.

### Entity System

Entities (player, enemies, bullets, obstacles, power-ups, particles) are managed as plain arrays of objects. Collision detection is rectangular AABB via `checkCollision()`.

### Wave System

`getWaveConfig(waveNumber)` returns enemy composition and spawn parameters. Enemy types unlock progressively (Basic → Fast → Tank → Shooter). Boss waves occur every 5 waves. Difficulty scales with 5% speed increase per wave and progressive spawn rate increases.

### Enemy Types (defined in `EnemyTypes` constant)

Basic, Fast, Tank, Shooter, and Boss — each with distinct size, HP, speed, damage, and score values.

### Audio

All sound is synthesized via Web Audio API oscillators (no audio files). Boss music is a looping oscillator drone. Seven sound effect types are generated procedurally.

### UI/Screen System

Screens are implemented as HTML overlay divs toggled via display properties. Panels: splash, start, game canvas, pause menu, game over, settings, daily rewards, tutorial, wave announcements.

### Persistence

All state is stored in `localStorage`: settings (sound, music, graphics quality, vibration), high score, player stats, gems, daily reward streak, tutorial completion, splash shown flag.

### PWA

`manifest.json` configures standalone display mode with icons in `icons/` directory.
