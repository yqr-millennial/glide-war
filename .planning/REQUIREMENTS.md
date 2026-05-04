# Requirements: Glide War

**Defined:** 2026-05-04
**Core Value:** Player controls a plane, shoots enemies, and scores points — responsive, satisfying arcade combat.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Game Core

- [ ] **CORE-01**: Game renders on an HTML5 Canvas with a fixed size
- [ ] **CORE-02**: Player plane appears at initial position and is visually distinct
- [ ] **CORE-03**: Player can move plane left and right using arrow keys
- [ ] **CORE-04**: Enemy planes spawn randomly at the top of the screen at intervals
- [ ] **CORE-05**: Enemy planes move downward at a consistent speed
- [ ] **CORE-06**: Player can fire bullets using the spacebar
- [ ] **CORE-07**: Bullets move upward from the player's position

### Combat

- [ ] **COMB-01**: Bullets destroy enemy planes on collision
- [ ] **COMB-02**: Enemy planes destroy player plane on collision (game over)
- [ ] **COMB-03**: Bullet-enemy collision is detected accurately
- [ ] **COMB-04**: Player-enemy collision is detected accurately

### Scoring

- [ ] **SCOR-01**: Score increments when player destroys an enemy
- [ ] **SCOR-02**: Current score is displayed on screen during gameplay
- [ ] **SCOR-03**: Final score is shown on game over screen

### Game Flow

- [ ] **FLOW-01**: Game starts with a start screen
- [ ] **FLOW-02**: Game ends on player-enemy collision with game over screen
- [ ] **FLOW-03**: Player can restart the game after game over

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Gameplay

- **GAME-01**: Power-ups (rapid fire, shield, speed boost)
- **GAME-02**: Multiple player lives
- **GAME-03**: Boss enemies with health bars
- **GAME-04**: Increasing difficulty over time

### Polish

- **POL-01**: Sound effects for shooting, explosions, game over
- **POL-02**: Background music
- **POL-03**: Particle effects on enemy destruction
- **POL-04**: High score persistence (localStorage)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile/touch controls | Web/desktop only for v1 |
| Multiplayer | Core single-player loop first |
| Power-ups | Focus on core shooting mechanics first |
| Sound/music | Visual gameplay validated first |
| Controller support | Keyboard-only for simplicity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 2 | Pending |
| CORE-05 | Phase 2 | Pending |
| CORE-06 | Phase 2 | Pending |
| CORE-07 | Phase 2 | Pending |
| COMB-01 | Phase 3 | Pending |
| COMB-02 | Phase 3 | Pending |
| COMB-03 | Phase 3 | Pending |
| COMB-04 | Phase 3 | Pending |
| SCOR-01 | Phase 4 | Pending |
| SCOR-02 | Phase 4 | Pending |
| SCOR-03 | Phase 4 | Pending |
| FLOW-01 | Phase 5 | Pending |
| FLOW-02 | Phase 5 | Pending |
| FLOW-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-04*
*Last updated: 2026-05-04 after initial definition*
