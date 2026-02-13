# Pause Menu Implementation Plan

## Goal
Implement a basic pause menu system for gun-run game that works on both mobile and desktop.

## Acceptance Criteria
1. Pause button appears when game starts
2. Clicking pause button pauses game (enemies, bullets, everything stops)
3. Clicking resume continues game from where left off
4. ESC/P keys toggle pause
5. Restart button restarts game
6. Quit to menu returns to start screen
7. Pause button hides on game over
8. App going to background on mobile pauses game

## Implementation Steps

### Step 1: HTML Structure (index.html)
- [ ] Add pause button
- [ ] Add pause menu overlay
- [ ] Add pause menu buttons (resume, restart, quit)

### Step 2: CSS Styling (style.css)
- [ ] Style pause button
- [ ] Style pause menu overlay
- [ ] Style pause menu buttons with hover/active states

### Step 3: JavaScript Logic (game.js)
- [ ] Add pause state variable
- [ ] Add element references
- [ ] Add pause/resume functions
- [ ] Add restart from pause function
- [ ] Add quit to menu function
- [ ] Add event listeners for buttons
- [ ] Add keyboard shortcuts (ESC/P)
- [ ] Modify startGame() to show pause button
- [ ] Modify gameOver() to hide pause button
- [ ] Modify update() function to stop all updates when paused
- [ ] Add visibility change listener for mobile

### Step 4: Verification
- [ ] Test pause button functionality
- [ ] Test keyboard shortcuts
- [ ] Test mobile app visibility change
- [ ] Verify all pause menu options work correctly

## Working Notes
- Need to ensure pause state properly stops all game updates
- Make sure UI updates are also paused appropriately
- Ensure mobile visibility change only pauses when game is running and not already paused