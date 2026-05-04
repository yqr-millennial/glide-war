# Phase 3: Collision Detection - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Source:** Inline specifications

<domain>
## Phase Boundary

Implement collision detection between player bullets and enemy planes, increase score on enemy destruction, and handle game-over when the player plane is hit by an enemy.
</domain>

<decisions>
## Implementation Decisions

### Collision Detection
- Implement bounding-box collision detection between player bullets and enemy planes
- Implement bounding-box collision detection between player plane and enemy planes
- When a bullet hits an enemy plane: remove both from the game
- When an enemy hits the player plane: trigger game-over

### Scoring
- Increase score when a bullet destroys an enemy plane
- Score value per kill to be determined (suggest 100 points per enemy)

### Game Over
- Player-enemy collision triggers game-over
- Game stops immediately (no gradual death animation for v1)

### Claude's Discretion
- Exact bounding-box dimensions and collision tolerance
- Score increment value per kill
- How game-over state is communicated to other game systems
</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Project Artifacts
- `.planning/REQUIREMENTS.md` — COMB-01 through COMB-04, SCOR-01
- `.planning/ROADMAP.md` — Phase 3 definition and success criteria

</canonical_refs>

<specifics>
## Specific Ideas

- Bullet-enemy collision: use simple axis-aligned bounding box (AABB) collision
- Player-enemy collision: same AABB approach
- Both bullet and enemy are removed from their respective arrays on collision
- Score variable increments on confirmed bullet-enemy hit
</specifics>

<deferred>
## Deferred Ideas

- Particle effects on collision — Phase 5 or v2
- Sound effects on hit — v2
- Screen shake on player death — v2
</deferred>

---
*Phase: 03-collision-detection*
*Context gathered: 2026-05-04 via inline specifications*
