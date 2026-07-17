# Dirt Bike Racing 3D — Project DOX Protocol v3.0

## 1. Repository Identity

| Field | Value |
|-------|-------|
| **Repo** | `dominick253/dirt-bike-racing` |
| **Branch** | `main` (direct push to GitHub Pages) |
| **Deploy URL** | https://dominick253.github.io/dirt-bike-racing/ |
| **Primary File** | `index.html` — single-file HTML5 game |
| **Source** | `src/` — TypeScript source code |
| **Test File** | `tests/core.test.ts` — Vitest unit tests |
| **CI/CD** | `.github/workflows/test-and-deploy.yml` — GitHub Actions |
| **Config** | `.htaccess` — MIME types for GitHub Pages |
| **Plan** | `REWRITE_PLAN.md` — Development roadmap |
| **Status** | Green field rewrite with TypeScript + Three.js r160 |

## Quick Start for AI Agents

1. **Read `src/main.ts`** — Main game controller
2. **Run tests**: `npm test`
3. **Run dev server**: `npm run dev`
4. **Build for deploy**: `npm run build`
5. **Verify in browser**: Navigate to http://localhost:5173

**Key files to know:**
- `index.html` — Entry point HTML
- `src/main.ts` — Main game controller
- `src/physics/bike.ts` — Bike physics system
- `src/world/terrain.ts` — Terrain generation
- `src/core/input.ts` — Input handling
- `src/render/camera.ts` — Camera system
- `src/world/particles.ts` — Particle system
- `tests/core.test.ts` — Unit tests
- `REWRITE_PLAN.md` — Development roadmap

---

## 2. Architecture

### 2.1 Modern TypeScript Architecture

Green field rewrite using:
- **TypeScript** for type safety and better IDE support
- **Three.js r160** via ES modules (importmap from CDN)
- **Vite** for bundling and development server
- **Vitest** for browser testing with Playwright
- **GitHub Pages** for deployment

### 2.2 File Layout

```
dirt-bike-racing/
  index.html          # Entry point HTML
  package.json        # Dependencies and scripts
  vite.config.ts      # Vite configuration
  vitest.config.ts    # Vitest configuration
  tsconfig.json       # TypeScript configuration
  .github/
    workflows/
      test-and-deploy.yml  # CI/CD pipeline
  .htaccess           # MIME type headers
  tests/
    core.test.ts      # Unit tests
    setup.ts          # Test setup
  src/                # TypeScript source code
    main.ts           # Main game controller
    core/
      input.ts        # Input handling
    physics/
      bike.ts         # Bike physics
    world/
      terrain.ts      # Terrain generation
      particles.ts    # Particle system
    render/
      camera.ts       # Camera system
    utils/
      noise.ts        # Simplex noise
```

### 2.3 JS Architecture

All game code uses TypeScript with ES modules:

- **GameController** — Main game controller, orchestrates all systems
- **InputSystem** — Keyboard and touch input handling
- **BikePhysics** — Bike movement, suspension, terrain interaction
- **TerrainSystem** — FBM noise heightmap, track generation
- **CameraSystem** — Chase camera with dynamic FOV
- **ParticleSystem** — Object-pooled particle effects

Key classes:
- `GameController` — Main game loop, renderer, scene setup
- `InputSystem` — Keyboard state management
- `BikePhysics` — Arcade physics with terrain adaptation
- `TerrainSystem` — Heightmap generation and track carving
- `CameraSystem` — Chase camera with speed-based FOV
- `ParticleSystem` — Object-pooled particle effects

---

## 3. Visual Design System

### 3.1 Design Fusion: BMW M × PlayStation × Spotify

| Element | Specification |
|---------|--------------|
| **Canvas** | Pure black `#000000` |
| **Surface 1** | `#121212` — Spotify dark immersion |
| **Surface 2** | `#181818` |
| **Surface 3** | `#1f1f1f` |
| **Accent** | PlayStation Blue `#0070d1` |
| **Danger** | M Red `#e22718` |
| **Success** | `#0fa336` |
| **Warning** | `#f4b400` |
| **Typography** | Inter font — weight 700 display, weight 300 body |
| **Geometry** | Pill buttons (9999px radius), 8px cards, circular controls |

---

## 4. Core Systems

### 4.1 FBM Noise Terrain

Simplex-like permutation LUT with 512 entries. 5/3/2 octaves for rolling hills, bumps, and detail. Track path carved into terrain with ramps and jumps. Height lookup via bilinear interpolation (O(1)).

### 4.2 Track

Sinusoidal loop carved into terrain. Raised curbs, track markers, starting grid lines, checkpoint flags. Track width varies with terrain elevation.

### 4.3 Bike Physics

Arcade-style throttle/brake/steer. Slope-adaptive pitch/roll. Suspension compression on landing. Wheel rotation animated based on speed. Three bike models with different speed/handling/suspension stats.

### 4.4 Particle System

Object-pooled canvas 2D overlay — zero Three.js allocations during gameplay. Pre-allocated 200 particles. Dust trails, landing impacts, boost effects.

### 4.5 Audio

Web Audio API — sawtooth engine mapped to RPM, landing thuds, countdown beeps, UI click sounds. Oscillator-based, no audio files needed.

### 4.6 AI Opponents

Three circle-following bots with lap progress tracking. Each AI follows a fixed radius circle on the track with varying speed. Position calculated for HUD display.

### 4.7 Camera

Chase cam with mouse override. Dynamic FOV based on speed (wider at high speed). Smooth interpolation between camera positions.

### 4.8 Minimap

Canvas 2D overlay showing bike position on track. Rotating view scaled to track bounds. AI positions shown as colored dots.

---

## 5. UI Screens

| Screen | Behavior |
|--------|----------|
| **Loading** | Progress bar with M stripe gradient. Hides itself via class toggle after 500ms. |
| **Title** | BMW M × PlayStation fusion. Needs `classList.add('active')` to become visible. |
| **Countdown** | 3-2-1-GO with audio beeps. Large animated text with pulse animation. |
| **HUD** | Speed (48px), gear, lap counter, timer, minimap, position, air/launch indicators. |
| **Mode Select** | National, Stunt, Enduro, Supercross. Pill buttons. |
| **Garage** | 3 bikes with speed/handling/suspension stats bars. |
| **Career** | Wins, best laps per mode. localStorage persistence. |
| **Race Complete** | Position, time, retry/menu options. |
| **Mobile Controls** | Touch joystick + gas/brake buttons overlay. |

---

## 6. Gotchas and Constraints

### Critical
- **renderer.render(scene, camera)** must be called at end of every animation frame.
- **Three.js r160 from CDN** — Use importmap for ES modules.
- **WebGL not available in headless browsers** — Browser tool cannot render 3D.
- **Canvas CSS** — `display:block; position:fixed; top:0; left:0; width:100%; height:100%; z-index:1`

### Performance
- **Object pooling** for particles — never allocate during gameplay loop.
- **Capped delta time** — `Math.min(dt, 0.05)` prevents physics spiral.
- **Pixel ratio capping** — `Math.min(devicePixelRatio, 2)`.
- **Shadow map** — 1024² (not 2048²) for performance.
- **InstancedMesh** for vegetation — 2 draw calls for 500+ trees.

### localStorage
- Career data stored under key `mx3d_career`.
- Version field included for future schema migrations.

---

## 7. Testing

### 7.1 Test Framework

Vitest with Playwright browser automation. Test file: `tests/core.test.ts`.

### 7.2 Test Coverage

- Noise generation consistency
- Bike physics updates
- Terrain height sampling
- Track mesh creation

### 7.3 Running Tests

```bash
npm test  # Run tests
npm run test:watch  # Watch mode
```

---

## 8. Deployment

### 8.1 GitHub Pages

- **Branch**: `main` (direct push, no build step)
- **URL**: https://dominick253.github.io/dirt-bike-racing/
- **MIME types**: `.htaccess` configured for GitHub Pages
- **CDN**: Three.js r160 from cdnjs.cloudflare.com

### 8.2 Deployment Checklist

1. Verify `index.html` is complete and valid HTML
2. Confirm no JS errors in browser console
3. Test keyboard controls (WASD/Arrows)
4. Test touch controls on mobile
5. Verify career persistence (localStorage)
6. Check rendering at multiple screen sizes
7. Vision analysis: screenshot deployed game

---

## 9. Development Workflow

### 9.1 Editing Rules

- **TypeScript source**: All game logic in `src/` directory
- **Single file deploy**: Vite bundles to single HTML file
- **ES modules**: Three.js r160 from CDN via importmap
- **Build step**: `npm run build` creates production bundle
- **Legacy folders**: `audio/`, `config/`, `core/`, `game/`, `physics/`, `render/`, `ui/`, `utils/`, `vendor/`, `world/` are DEPRECATED. Do not edit files in these folders.

### 9.2 File Operations

- **Read**: Use `read_file` to inspect existing code before editing.
- **Edit**: Use `patch` for targeted changes, `write_file` for full rewrites.
- **Verify**: Run tests after changes. Check browser console for errors.
- **Commit**: Only when user explicitly directs. Do not auto-commit.

### 9.3 Testing Protocol

1. Run tests: `npm test`
2. Verify in real browser (headless browser cannot render 3D)
3. Check console for JS errors
4. Vision analysis: screenshot deployed game

---

## 10. Code Reference

### 10.1 Key Classes by Category

**Initialization**: `GameController`, `setupRenderer()`, `setupScene()`, `setupCamera()`

**Scene Creation**: `createTerrain()`, `createTrack()`, `createBike()`, `createSky()`, `createVegetation()`

**Gameplay**: `startRace()`, `finishRace()`, `startCountdown()`, `gameLoop()`, `updatePhysics()`, `updateAI()`, `updateCamera()`

**Rendering**: `syncBikeMesh()`, `renderParticles()`, `updateAndRenderParticles()`, `drawMinimap()`, `resizeParticleCanvas()`

**UI**: `showScreen()`, `showGarage()`, `showCareer()`, `fade()`, `HUD update logic`

**Math/Noise**: `initLUT()`, `noise2D()`, `fbm()`, `lerp()`, `getTerrainHeight()`, `terrainNormalAt()`

### 10.2 Global Objects

- **GameController** — Main game loop, renderer, scene setup
- **InputSystem** — Keyboard state management
- **BikePhysics** — Arcade physics with terrain adaptation
- **TerrainSystem** — Heightmap generation and track carving
- **CameraSystem** — Chase camera with speed-based FOV
- **ParticleSystem** — Object-pooled particle effects

---

## 11. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Three.js CDN fails | Importmap from cdnjs.cloudflare.com (proven) |
| Missing renderer.render() | Checklist in boot sequence |
| GC pressure from particles | Object pool + canvas 2D overlay |
| Lap tracking bugs | Angle-based checkpoint validation |
| Physics ground collision | Terrain height sampling every frame |
| AI doesn't follow track | Parametric track path for all entities |
| Mobile not supported | Touch joystick + buttons |
| WebGL not in headless | Browser tool cannot render 3D |
| localStorage corruption | Version field in career key |
| Bundle size too large | Tree shaking, code splitting, minification |

---

## 12. Quick Reference

### Common Operations

**View game in browser**: Navigate to https://dominick253.github.io/dirt-bike-racing/

**Edit game code**: Read `src/main.ts`, use `patch` for targeted changes.

**Run tests**: `npm test`

**Build for deploy**: `npm run build`

**Verify deployment**: Vision analysis screenshot of deployed URL.

### Key Line Numbers in index.html

- Line 1-200: CSS — All screen styles
- Line 200-300: HTML — DOM elements
- Line 300-400: JavaScript — Loading simulation, button handlers

---

## 13. DOX Protocol Checklist

Before any code change, verify:

- [ ] Read `src/main.ts` to understand current state
- [ ] Identify exact line numbers for changes
- [ ] Match existing style (TypeScript, ES modules)
- [ ] Verify Three.js r160 from CDN (importmap)
- [ ] Ensure `renderer.render(scene, camera)` called every frame
- [ ] Test after changes (local server + vitest)
- [ ] Verify in real browser (not headless)
- [ ] No console errors
- [ ] Vision analysis of deployed game

After any code change, verify:

- [ ] Tests pass
- [ ] No JS errors in console
- [ ] Game renders correctly in browser
- [ ] Controls work (keyboard + touch)
- [ ] Career persistence intact
- [ ] Responsive at multiple screen sizes

---

*DOX Protocol v3.0 — Updated 2026-07-16. This file is the single source of truth for the Dirt Bike Racing 3D project. Update it when architecture changes.*
