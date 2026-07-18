# Dirt Bike Racing 3D — Execution Plan

**Date:** 2026-07-18
**Status:** Skeleton project. Good spec, good plan, zero execution.
**Goal:** A playable motocross game. Not a skeleton. Not stubs. Actual game.

---

## Autopsy

### What exists

- 2,287 lines of TypeScript across ~20 source files
- 12 passing Vitest tests (clock, input, noise — trivial stuff)
- 17 TypeScript compile errors (missing properties, wrong signatures)
- Vite build pipeline configured, CI workflow configured
- Good spec (`dirtbike-spec-v2.md`) — single-file, Motocross Madness homage
- Detailed rewrite plan (`REWRITE_PLAN.md`) — 7 phases, 33 tasks

### What's broken

- **No bike model** — `createBike()` doesn't exist, no 3D mesh rendered
- **No track** — flat 100x100 noise grid, no carving, no ramps
- **Physics stub** — no suspension, no ground collision, no air control
- **UI dead ends** — every button calls `alert()`
- **No audio** — zero Web Audio implementation
- **No game flow** — no state machine transitions, no countdown, no lap tracking
- **No AI** — AI module never created
- **Particles exist but never render**
- **HUD never updates** — empty DOM elements

### Root cause

The project was scaffolded but never filled in. Every critical system is a stub. The rewrite plan is thorough but was never started — the code still has the old skeleton.

---

## Decision: Ship Strategy

**Go single-file.** The spec says single-file. The repo drifted to multi-file TS. That drift is the problem — too many files, too many interfaces, too many things to wire up. A single HTML file keeps everything tight. No module wiring bugs. No build config. Just code.

**But use the good parts.** Noise generator, input system, clock, particle pool — these work. Rip them in.

---

## Phases

### Phase 1: Fix the Foundation (Day 1)

**Deliverable: A bike on terrain you can drive.**

1. **Kill the multi-file TS.** Delete `src/`, keep working utilities (`noise.ts`, `input.ts` patterns) and rebuild as single HTML.
2. **Terrain that looks like a track.** FBM heightmap, 600x600, with a parametric track carved through it. Vertex colors: dirt track, grass everywhere else. At least 8 jump ramps.
3. **Bike model from primitives.** Box/cylinder geometry. Chassis, wheels, forks, exhaust, fenders. Under 500 triangles.
4. **Custom raycast physics.** Ray down to terrain heightmap cache every frame. Ground/air state machine. Throttle, brake, steer, friction, gravity. Slope-adaptive pitch.
5. **Camera follow.** Chase cam with damping, dynamic FOV based on speed.

**Verification:** Open `index.html` in Chrome. See a bike on a track. Drive it with WASD. Camera follows. Terrain has hills and jumps.

### Phase 2: Feel (Day 2)

**Deliverable: It feels like a motocross game.**

1. **Suspension bounce on landing.** Spring-damper model. Visual suspension geometry that compresses.
2. **Air control.** Pitch/roll in air. Wheelie on Space, lean on Shift.
3. **Dust particles.** Object-pooled planes near rear wheel. Acceleration dust, landing impact clouds.
4. **Engine audio.** Web Audio API oscillator. RPM mapped to frequency. Throttle up = pitch up.
5. **Screen shake on hard landings.**

**Verification:** Launch off a jump. Hear engine rev. See dust. Feel landing impact. Air control works.

### Phase 3: Game Systems (Day 3)

**Deliverable: A complete racing experience.**

 1. **Lap tracking.** Angle-based checkpoints around the track loop. Lap counter in HUD.
 2. **HUD.** Speed (km/h), gear indicator, lap counter, timer. Air time display with "BIG AIR!" callout.
 3. **Title screen → countdown → race flow.** State machine: LOADING → TITLE → COUNTDOWN → RACE → RESULTS.
 4. **AI opponents (2-3).** Follow parametric track path. Varying speeds.

**Verification:** Start from title screen. Countdown. Race for 3 laps against AI. See positions update. Results screen.

### Phase 4: Polish (Day 4)

**Deliverable: It looks alive.**

 1. **Vegetation.** 800+ instanced trees on terrain (not on track).
 2. **Sky + fog.** Exponential fog, sky dome gradient.
 3. **Track visuals.** Boundary markers, starting grid, curbs.
 4. **Bike animation.** Wheel spin, lean into turns, suspension visual.
 5. **Career mode.** localStorage persistence. Wins, best laps.
 6. **Mobile touch controls.** Virtual joystick + gas/brake buttons.

**Verification:** Full game on desktop and mobile. Career progress saves. Trees on hills. Fog creates depth.

### Phase 5: Ship (Day 5)

**Deliverable: Live on GitHub Pages.**

 1. **Performance check.** 60 FPS, bundle < 500KB gzipped.
 2. **Visual verification.** Screenshot confirms rendering.
 3. **Deploy to GitHub Pages.** Push to `main`.

---

## Rules

1. **One file.** Everything in `index.html`. No build steps.
2. **No stubs.** If it's in the file, it works.
3. **Test as you go.** Open in Chrome after each phase. Visual verification > unit tests for a game.
4. **Physics feel > accuracy.** Arcade responsive, not a simulation.
5. **Object pool everything.** Zero GC during gameplay.

---

## What to Delete

- `src/` directory (multi-file TS that doesn't work)
- `core/`, `physics/`, `render/`, `ui/` JS files (stale stubs)
- `dist/` (will be rebuilt)
- `.cursor/rules/` (16 agent rule files for dead code)
- `game.html` and scattered `.html` copies in `/home/dom/`
- Tests that reference dead source files

## What to Keep

- `package.json` (dependency reference)
- `dirtbike-spec-v2.md` (the spec is solid)
- Noise generator algorithm (works)
- Vite config patterns (for dev iteration)
- `.github/workflows/` (CI template)
