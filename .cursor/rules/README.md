# Dirt Bike Racing 3D — Specialized Agents

This directory contains specialized agents for Dirt Bike Racing 3D. Each agent OWNS one specific aspect of the application and is specialized in working on that one element effectively.

## Agent Index

| Agent | File | Scope |
|-------|------|-------|
| **Game Loop Agent** | `game-loop-agent.md` | Main animation frame, state machine, boot sequence |
| **Title Screen Agent** | `title-screen-agent.md` | Title screen UI, loading screen, animations |
| **HUD Agent** | `hud-agent.md` | Heads-up display, speed/gear/lap/timer |
| **Minimap Agent** | `minimap-agent.md` | Minimap canvas 2D overlay |
| **Particle System Agent** | `particle-system-agent.md` | Object-pooled particle system, dust/impact effects |
| **Audio Agent** | `audio-agent.md` | Web Audio API, engine sounds, countdown beeps |
| **Input Agent** | `input-agent.md` | Keyboard + touch input handling |
| **Terrain Agent** | `terrain-agent.md` | FBM noise heightmap, terrain generation |
| **Track Agent** | `track-agent.md` | Sinusoidal loop, curbs, markers, starting grid |
| **Bike Agent** | `bike-agent.md` | Bike model, wheel rotation, 3 bike types |
| **Physics Agent** | `physics-agent.md` | Arcade physics, slope adaptation, ground collision |
| **AI Agent** | `ai-agent.md` | Circle-following opponents, lap tracking |
| **Camera Agent** | `camera-agent.md` | Chase cam, dynamic FOV, camera shake |
| **UI Screens Agent** | `ui-screens-agent.md` | Garage, career, mode select, race complete |
| **Vegetation Agent** | `vegetation-agent.md` | InstancedMesh trees, sky dome |

## Usage

Each agent file is self-contained and can be used independently. When working on a specific aspect of the game, reference the corresponding agent file for constraints, gotchas, and responsibilities.

## Common Constraints

All agents share these constraints:
- **Single file**: All code in `index.html`. No separate JS files.
- **IIFE pattern**: Use global objects (Game, UI, Config, Audio, Input). No ES modules.
- **CSS inline**: All styles in `<style>` tag within `index.html`.
- **No em dashes**: Use hyphens with spaces.
- **Three.js r128 from CDN**: Always from cdnjs.cloudflare.com. No importmap.
- **No build step**: GitHub Pages serves the raw HTML file.

## Critical Gotchas

- **renderer.render(scene, camera) must be called at end of every animation frame** — this is the single most common failure mode.
- **WebGL not available in headless browsers** — verify in real browser.
- **Canvas CSS**: `display:block; position:fixed; top:0; left:0; width:100%; height:100%; z-index:1`
- **Always verify no console errors after changes**.
