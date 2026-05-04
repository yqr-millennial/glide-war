# Glide War

## What This Is

A 2D plane battle game where the player controls a plane that flies and shoots at enemy planes. The game features a scoring system, collision detection, and progressively challenging enemy waves. Built for browser play using HTML5 Canvas and JavaScript.

## Core Value

Player controls a plane, shoots enemies, and scores points — responsive, satisfying arcade combat that feels immediate and fun.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Player can control a plane with left/right movement
- [ ] Player can fire bullets at enemies
- [ ] Enemy planes spawn and move down the screen
- [ ] Bullets collide with and destroy enemy planes
- [ ] Player plane collides with enemy planes (game over)
- [ ] Score tracks enemy kills
- [ ] Game over screen with final score

### Out of Scope

- Power-ups and weapon upgrades — v2
- Multiple player lives — v2
- Boss enemies — v2
- Mobile support — web only for v1
- Multiplayer — v2
- Sound effects / music — v2

## Context

Greenfield project. The user has specified clear phase breakdown: Phase 1 covers the game canvas and player plane with movement. Phase 2 covers enemy spawning, bullet firing, and bullet-enemy collision. Built as a standalone browser game using HTML5 Canvas — no frameworks, no build tools, plain HTML/CSS/JS for simplicity.

## Constraints

- **Tech stack**: HTML5 Canvas, vanilla JavaScript, CSS — no frameworks or build tools
- **Platform**: Browser (desktop)
- **Controls**: Keyboard (arrow keys for movement, spacebar to fire)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| HTML5 Canvas + vanilla JS | Simple 2D game, no framework overhead needed | — Pending |
| Coarse phase granularity (5 phases) | Game has natural layering: canvas→enemies→collision→scoring→polish | — Pending |
| Keyboard-only controls | Desktop-first, classic arcade feel | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 after initialization*
