# Roadmap: Glide War

**Created:** 2026-05-04
**Granularity:** Coarse (5 phases)
**Execution:** Parallel where possible

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Game Canvas & Player Plane | Render a game canvas with a player-controlled plane | CORE-01, CORE-02, CORE-03 | 3 |
| 2 | Enemies & Bullets | Spawn enemies and let the player fire bullets | CORE-04, CORE-05, CORE-06, CORE-07 | 4 |
| 3 | Collision Detection | Handle bullet-enemy and player-enemy collisions | COMB-01, COMB-02, COMB-03, COMB-04 | 3 |
| 4 | Scoring System | Track and display score during gameplay and on game over | SCOR-01, SCOR-02, SCOR-03 | 3 |
| 5 | Game Flow & Polish | Start screen, game over screen, and restart functionality | FLOW-01, FLOW-02, FLOW-03 | 3 |

## Phase Details

### Phase 1: Game Canvas & Player Plane

**Goal:** Render a game canvas with a player-controlled plane that moves left and right.

**Requirements:** CORE-01, CORE-02, CORE-03

**Success Criteria:**
1. A canvas of fixed size (e.g., 480x720) renders in the browser
2. A player plane sprite/shape appears at the bottom-center of the canvas
3. Arrow keys move the plane left and right within the canvas bounds

**UI hint:** yes

---

### Phase 2: Enemies & Bullets

**Goal:** Enemy planes spawn randomly at the top and move downward. Player can fire bullets with the spacebar.

**Requirements:** CORE-04, CORE-05, CORE-06, CORE-07

**Success Criteria:**
1. Enemy planes appear at random X positions at the top of the canvas at regular intervals
2. Enemy planes move downward at a consistent speed
3. Pressing spacebar fires a bullet from the player's position that moves upward
4. Multiple bullets can be on screen simultaneously (with a fire rate limit)

**UI hint:** yes

---

### Phase 3: Collision Detection

**Goal:** Bullets destroy enemies on hit. Player-enemy collision ends the game.

**Requirements:** COMB-01, COMB-02, COMB-03, COMB-04

**Success Criteria:**
1. When a bullet overlaps an enemy plane, both are removed from the canvas
2. When an enemy plane overlaps the player plane, the game stops
3. Collision detection is visually accurate (no false positives/misses within reasonable bounds)

**Depends on:** Phase 1, Phase 2

---

### Phase 4: Scoring System

**Goal:** Track and display score. Show final score on game over.

**Requirements:** SCOR-01, SCOR-02, SCOR-03

**Success Criteria:**
1. Score increments by a defined amount each time an enemy is destroyed
2. Current score is visible on screen during gameplay
3. Final score is prominently displayed on the game over screen

**Depends on:** Phase 3

---

### Phase 5: Game Flow & Polish

**Goal:** Start screen, game over screen, and restart functionality.

**Requirements:** FLOW-01, FLOW-02, FLOW-03

**Success Criteria:**
1. Game opens with a start screen (title + "Press Start" prompt)
2. On player death, a game over screen appears with final score
3. Player can restart the game from the game over screen without refreshing the browser

**UI hint:** yes

**Depends on:** Phase 4

---

## Coverage Validation

| Total v1 Requirements | Mapped | Unmapped |
|----------------------|--------|----------|
| 17 | 17 | 0 ✓ |

---
*Roadmap created: 2026-05-04*
