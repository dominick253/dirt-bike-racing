# Dirt Bike Racing 3D — AGENTS.md

## Identity

| Field | Value |
| ------- | ------- |
| **Repo** | `dominick253/dirt-bike-racing` |
| **Branch** | `main` (GitHub Pages) |
| **Deploy** | <https://dominick253.github.io/dirt-bike-racing/> |
| **Architecture** | Single HTML file, no build step, no bundler |
| **Tech** | Three.js r160 (CDN ES modules), Web Audio API, Canvas 2D |

## Quick Start

1. `npx vite --port 5174` — dev server
2. Open <http://localhost:5174/>
3. Edit `index.html` directly — everything is in one file
4. Push to `main` — GitHub Pages auto-deploys

## Architecture

Everything in `index.html` — single file, ~2100 lines:

```
index.html/
  CSS — BMW M × PlayStation × Spotify design fusion
  HTML — Loading screen, title screen, HUD, mobile controls
  JS:
    boot() → init renderer, scene, camera, lights
    createTerrain() → FBM heightmap, vertex colors
    createTrack() → CatmullRom tube geometry
    createBike() → Box/cylinder primitives (~500 tris)
    createVegetation() → InstancedMesh trees
    gameLoop() → requestAnimationFrame loop
    updatePhysics(dt) → throttle/brake/steer, suspension, ground collision, slope adaptation
    updateAI(dt) → track-following AI opponents
    updateCamera() → chase cam with dynamic FOV
    syncBikeMesh() → position/orient bike model from physics state
    updateAndRenderParticles(dt) → dust particle pool (canvas 2D)
    updateHUD() → speed, gear, lap, timer, minimap
    updateEngineSound() → Web Audio oscillator mapped to RPM
    finishRace() → career stats, localStorage save
```

## Features Implemented

- ✅ FBM noise terrain with vertex colors (dirt track, grass, rock)
- ✅ Parametric track (CatmullRom tube)
- ✅ Bike model from primitives (chassis, wheels, forks, exhaust, fenders)
- ✅ Raycast ground collision via terrain heightmap cache
- ✅ Physics: throttle, brake, steer, friction, gravity, air friction, slope adaptation
- ✅ Air control (Space wheelie, Shift compress/lean)
- ✅ Camera: chase cam with dynamic FOV + mouse orbit mode
- ✅ 5 game modes: national, stunt, enduro, supercross, baja
- ✅ 3 bikes with stat differences (speed/handling/suspension)
- ✅ Lap tracking with 4 checkpoint quadrants
- ✅ HUD: speed, gear, lap counter, timer, minimap, position
- ✅ AI opponents (2-3 bikes)
- ✅ Particle system (dust) with object pooling
- ✅ Web Audio API engine sound
- ✅ State machine: loading → title → countdown → racing → race_complete
- ✅ Career persistence via localStorage
- ✅ Mobile touch controls (joystick + buttons)
- ✅ Screen shake on landing
- ✅ Instanced vegetation (800+ trees)

## Known Issues

- Speed recalculated after position integration (physics bug — creates drift)
- Track is a tube mesh overlaid on terrain, not carved into it
- No post-processing (bloom, tone mapping)
- Suspension visual doesn't compress (geometry stays static)

## Files

| File | Purpose |
| ------ | --------- |
| `index.html` | Complete game — single file |
| `package.json` | Vite dev server only |
| `vite.config.ts` | Dev server config |
| `PLAN.md` | Autopsy of old skeleton (stale — game was already built) |

## Conventions

- Single file only — no splitting into modules
- ES modules via CDN importmap for Three.js
- No TypeScript — pure JavaScript
- No build step — serve as-is
- Commit directly to `main` for GitHub Pages deploy
