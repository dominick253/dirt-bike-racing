# Dirt Bike Racing 3D — Rewrite Plan v4.0

## Current State Assessment

### What Works (Green)
- **Build pipeline**: Vite + TypeScript + Terser builds cleanly (6.27kB HTML + 473kB JS)
- **Tests**: 12 Vitest tests pass (jsdom environment, browser mode)
- **Noise generator**: Simplex noise with LUT + FBM works correctly
- **Terrain heightmap**: Bilinear interpolation sampling works
- **Basic physics**: Acceleration/brake/steer loop runs
- **Camera chase**: Basic lerp-based chase cam with FOV scaling
- **Particle pool**: Object pooling for 200 particles works
- **UI screens**: Loading bar, title screen, countdown DOM all present
- **CI/CD**: GitHub Actions workflow configured

### What's Broken / Janky (Red)
- **No bike model**: `createBike()` doesn't exist — no 3D bike mesh is ever created
- **No track mesh**: `createTrack()` doesn't exist — no track geometry rendered
- **Physics is stub**: No suspension, no slope adaptation, no ground collision, no air control
- **Terrain is flat**: 100x100 grid with noise height — no track carved into it
- **Vegetation is placeholder**: Random cone trees on flat terrain, no track integration
- **No audio**: Web Audio API never implemented (UI click handlers use `alert()`)
- **No lap tracking**: No checkpoints, no finish condition, no lap counter logic
- **No AI opponents**: AI module never created
- **No minimap**: HTML element exists but never rendered to
- **No mobile controls**: Touch joystick never implemented
- **No career persistence**: localStorage save/load never implemented
- **No bike 3D model**: No geometry, no materials, no bike mesh at all
- **No sky**: No sky dome, no gradient, no atmospheric effects
- **No post-processing**: No bloom, no tone mapping beyond basic
- **State machine broken**: Title screen buttons use `alert()` instead of real navigation
- **No game loop state**: No loading → title → countdown → race → results transitions
- **No bike selection**: Garage screen is `alert('Bike selection would open here')`
- **No career mode**: Career screen is `alert('Career mode would open here')`
- **No rendering of bike**: `renderer.render(scene, camera)` is called but nothing bike-shaped exists
- **No track visual**: Track is never rendered — just a flat noise terrain
- **No track boundaries**: No curbs, no barriers, no track markers
- **No ramp/jump geometry**: Terrain is uniform noise, no track carving
- **No bike animation**: No wheel rotation, no suspension animation, no lean-into-turn
- **No particle rendering**: Particles exist in pool but never rendered to screen
- **No HUD updates**: Speed/gear/lap displayed but never populated with real data
- **No sound**: Zero audio implementation

### Root Causes
1. **Skeleton project**: The current code is a skeleton with stub methods and placeholder DOM
2. **Missing critical systems**: Bike model, track geometry, audio, lap tracking, AI, minimap, mobile controls
3. **Physics incomplete**: No suspension, no slope adaptation, no ground collision
4. **No visual content**: No bike mesh, no track mesh, no sky, no vegetation integration
5. **UI is dead ends**: All navigation buttons use `alert()` — no real game flow
6. **No game state machine**: Loading → Title → Countdown → Race → Results chain never implemented

---

## Rewrite Vision

A **production-grade motocross game** that delivers the visceral thrill of Motocross Madness with modern 3D graphics. Every system must work end-to-end: bike physics feel real, terrain looks alive, AI pushes you, audio sells the experience, and the UI is buttery smooth.

### Tech Stack
- **Three.js r160** via importmap from CDN (proven on GitHub Pages)
- **TypeScript** for type safety and IDE support
- **Vite** for dev server + production build
- **Vitest** with Playwright browser for integration tests
- **Web Audio API** for procedural audio
- **localStorage** for career persistence
- **Single HTML** deployment to GitHub Pages

### Design Principles
1. **Red/Green TDD**: Write failing test → write code → make it pass → refactor
2. **No stubs in production**: Every system must be complete, not placeholder
3. **Object pooling everywhere**: Zero GC pressure during gameplay
4. **Delta time capped**: 50ms max to prevent physics spiral
5. **Pixel ratio capped**: 2x for mobile performance
6. **Modular architecture**: Each system testable in isolation

---

## Architecture: Entity-Component-System Lite

```
dirt-bike-racing/
  index.html                    # Deployed single-file game
  package.json                  # Dev dependencies
  vite.config.ts               # Vite configuration
  vitest.config.ts             # Vitest configuration
  tsconfig.json                # TypeScript configuration
  .github/
    workflows/
      test-and-deploy.yml      # CI/CD pipeline
  .htaccess                    # MIME types
  tests/
    core.test.ts               # Unit tests
    setup.ts                   # Test setup
  src/
    main.ts                    # Boot sequence, entry point
    core/
      engine.ts                # Three.js renderer initialization
      clock.ts                 # Delta time, frame timing, cap
      input.ts                 # Keyboard + touch + gamepad
      audio.ts                 # Web Audio API procedural audio
      state.ts                 # State machine: LOADING→TITLE→RACE→RESULTS
    physics/
      bike.ts                  # Bike physics: throttle, brake, steer, suspension
      suspension.ts            # Spring-damper model
      ground.ts                # Ground collision, slope adaptation
      aircontrol.ts            # Air control, trick scoring, wheelie detection
      momentum.ts              # Momentum conservation, friction, traction
    world/
      terrain.ts               # FBM noise heightmap (5/3/2 octaves)
      track.ts                 # Parametric track with checkpoints
      vegetation.ts            # InstancedMesh trees with terrain integration
      sky.ts                   # Procedural sky dome + atmospheric fog
      particles.ts             # Object-pooled particle effects (canvas 2D overlay)
    render/
      camera.ts                # Chase cam with dynamic FOV
      minimap.ts               # Canvas 2D minimap overlay
      hud.ts                   # Speed, gear, lap, timer HUD
      screens.ts               # Title, countdown, results screen rendering
    bike/
      model.ts                 # 3D bike model: chassis, wheels, suspension
      animation.ts             # Wheel rotation, lean, suspension visual
    ai/
      opponent.ts              # Track-following AI with speed variation
      laptracker.ts            # AI lap progress tracking
    utils/
      noise.ts                 # Simplex noise + FBM
      math.ts                  # Lerp, clamp, angle helpers
      pool.ts                  # Object pooling utilities
      save.ts                  # localStorage career manager
      dom.ts                   # DOM manipulation helpers
    styles/
      main.css                 # All game CSS (BMW M × PlayStation × Spotify)
    types/
      game.d.ts                # Game type definitions
      physics.d.ts             # Physics type definitions
      world.d.ts               # World type definitions
```

---

## Development Phases: Red/Green TDD

### Phase 1: Foundation (Tests First)
**Goal**: Build the skeleton that all other phases depend on.

1. **Clock system** — Delta time, frame timing, cap at 50ms
   - Test: `ClockTest` — verifies delta time calculation, cap behavior
   - Green: Returns correct delta time, caps at 50ms

2. **State machine** — LOADING → TITLE → COUNTDOWN → RACE → RESULTS
   - Test: `StateMachineTest` — verifies transitions, events
   - Green: Transitions fire correct events, rejects invalid transitions

3. **Input system** — Keyboard + touch + gamepad
   - Test: `InputTest` — verifies key state, touch coordinates, gamepad axes
   - Green: Returns correct state for all input types

4. **Audio system** — Web Audio API procedural audio
   - Test: `AudioTest` — verifies oscillator creation, gain control, frequency mapping
   - Green: Creates oscillators, maps RPM to frequency, handles silence

5. **Engine initialization** — Three.js renderer setup
   - Test: `EngineTest` — verifies renderer creation, pixel ratio, shadow maps
   - Green: Creates WebGL renderer with correct settings

### Phase 2: World Generation
**Goal**: Build the world the bike races on.

6. **Noise generator** — Simplex noise with LUT + FBM
   - Test: `NoiseTest` — verifies seed consistency, FBM output, terrain height
   - Green: Same seed produces same noise, FBM produces varied terrain

7. **Terrain heightmap** — 200x200 grid with FBM sampling
   - Test: `TerrainTest` — verifies height sampling, normal calculation
   - Green: getHeight returns correct values, getNormal returns unit vectors

8. **Track generation** — Parametric sinusoidal loop carved into terrain
   - Test: `TrackTest` — verifies track path, checkpoints, ramp placement
   - Green: Track follows parametric curve, checkpoints placed correctly

9. **Vegetation** — InstancedMesh trees placed on terrain
   - Test: `VegetationTest` — verifies tree placement, terrain height matching
   - Green: Trees placed on terrain surface, 500+ trees in 2 draw calls

10. **Sky + atmosphere** — Procedural sky dome + exponential fog
    - Test: `SkyTest` — verifies sky dome creation, fog parameters
    - Green: Sky dome renders correctly, fog creates depth

### Phase 3: Physics Engine
**Goal**: Make the bike feel real.

11. **Bike physics** — Throttle, brake, steer with terrain adaptation
    - Test: `BikePhysicsTest` — verifies acceleration, braking, steering
    - Green: Bike responds to input, speed clamps correctly

12. **Suspension system** — Spring-damper model
    - Test: `SuspensionTest` — verifies compression, rebound, damping
    - Green: Suspension compresses on impact, rebounds smoothly

13. **Ground collision** — Terrain height sampling every frame
    - Test: `GroundTest` — verifies height sampling, slope detection
    - Green: Bike stays on terrain, slope affects physics

14. **Air control** — Reduced steering while airborne, trick scoring
    - Test: `AirControlTest` — verifies airborne behavior, trick detection
    - Green: Air control works, tricks scored correctly

15. **Momentum** — Friction, traction, gravity, wheelie detection
    - Test: `MomentumTest` — verifies friction, traction, wheelie scoring
    - Green: Momentum conserved, wheelies detected and scored

### Phase 4: Game Systems
**Goal**: Make it a complete racing game.

16. **Lap tracking** — Angle-based checkpoints, anti-cheat
    - Test: `LapTest` — verifies checkpoint crossing, lap counting
    - Green: Lap counted only when all checkpoints crossed in order

17. **AI opponents** — Track-following with speed variation
    - Test: `AITest` — verifies AI follows track, speed variation
    - Green: AI follows parametric track, speed varies by skill level

18. **Particle system** — Object-pooled dust, impacts, boost
    - Test: `ParticleTest` — verifies pooling, emission, lifetime
    - Green: Pool recycles particles, effects render correctly

19. **Camera system** — Chase cam with dynamic FOV
    - Test: `CameraTest` — verifies chase cam, FOV scaling, lerp
    - Green: Camera follows bike smoothly, FOV widens at speed

20. **Minimap** — Canvas 2D overlay with bike + AI positions
    - Test: `MinimapTest` — verifies rendering, position mapping
    - Green: Minimap shows bike and AI positions correctly

### Phase 5: UI/UX
**Goal**: Make it look and feel premium.

21. **HUD** — Speed, gear, lap, timer, minimap overlay
    - Test: `HUDTest` — verifies HUD updates, position display
    - Green: HUD updates every frame with correct data

22. **Screens** — Loading, title, countdown, results
    - Test: `ScreenTest` — verifies screen transitions, animations
    - Green: Screens transition smoothly, countdown works

23. **Bike selection** — Garage with 3 bikes, stat bars
    - Test: `GarageTest` — verifies bike selection, stat display
    - Green: 3 bikes selectable, stats displayed correctly

24. **Career mode** — Wins, best laps, localStorage persistence
    - Test: `CareerTest` — verifies save/load, version handling
    - Green: Career data persists across sessions, version migration works

25. **Mobile controls** — Touch joystick + gas/brake buttons
    - Test: `MobileTest` — verifies touch input, button layout
    - Green: Touch joystick works, buttons respond to touch

### Phase 6: Polish & Integration
**Goal**: Make it AMAZING.

26. **Bike 3D model** — Chassis, wheels, suspension geometry
    - Test: `BikeModelTest` — verifies model creation, materials
    - Green: Bike model renders with correct geometry and materials

27. **Bike animation** — Wheel rotation, lean, suspension visual
    - Test: `BikeAnimationTest` — verifies wheel spin, lean angles
    - Green: Wheels rotate with speed, bike leans into turns

28. **Track visuals** — Track geometry, curbs, markers, starting grid
    - Test: `TrackVisualTest` — verifies track mesh, markers
    - Green: Track rendered with curbs, markers, starting grid

29. **Audio polish** — Engine sounds, landing thuds, countdown beeps
    - Test: `AudioPolishTest` — verifies engine mapping, impact sounds
    - Green: Engine sounds map to RPM, landing thuds play on impact

30. **Visual polish** — PBR materials, bloom, tone mapping
    - Test: `VisualPolishTest` — verifies materials, post-processing
    - Green: PBR materials render correctly, bloom visible

### Phase 7: Testing & Deployment
**Goal**: Ship it.

31. **Integration tests** — Full game flow in browser
    - Test: `IntegrationTest` — verifies complete game flow
    - Green: Full game plays end-to-end in browser

32. **Performance profiling** — FPS, memory, bundle size
    - Test: `PerfTest` — verifies 60fps, <200MB RSS, <150KB gzipped
    - Green: Meets all performance targets

33. **Build + deploy** — Single HTML to GitHub Pages
    - Test: `DeployTest` — verifies build output, deployment
    - Green: Builds to single HTML, deploys to GitHub Pages

---

## Test Strategy: Red/Green TDD

### Unit Tests (Vitest + jsdom)
- Test each system in isolation
- Mock Three.js where possible
- Verify logic correctness, not rendering

### Browser Tests (Vitest + Playwright)
- Test full game flow in real browser
- Verify rendering, interaction, audio
- Capture screenshots for visual verification

### Integration Tests
- Full game: loading → title → countdown → race → results
- Verify all systems work together
- Performance benchmarks

---

## Quality Gates

Every phase must pass these gates before moving to the next:

1. **All unit tests pass** — No red tests
2. **TypeScript compiles** — No type errors
3. **Build succeeds** — Vite produces output
4. **Browser test passes** — Full game flow works
5. **Performance verified** — 60fps, <200MB RSS, <150KB gzipped
6. **Visual verification** — Screenshot confirms rendering

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Three.js CDN fails | Importmap from cdnjs.cloudflare.com (proven) |
| Missing renderer.render() | Checklist in boot sequence |
| GC pressure from particles | Object pool + canvas 2D overlay |
| Lap tracking bugs | Angle-based checkpoint validation |
| Physics ground collision | Terrain height sampling every frame |
| AI doesn't follow track | Parametric track path for all entities |
| Mobile not supported | Touch joystick + buttons |
| WebGL not in headless | Browser tool cannot render 3D — use Playwright |
| localStorage corruption | Version field in career key |
| Bundle size too large | Tree shaking, code splitting, minification |
| Bike model missing | Phase 6: Build 3D bike model from primitives |
| Track not rendered | Phase 6: Build track geometry with curbs |
| No audio | Phase 6: Implement Web Audio API |
| State machine broken | Phase 1: Build proper state machine |

---

## Deployment

- **Branch**: `main` (direct push)
- **URL**: https://dominick253.github.io/dirt-bike-racing/
- **Build**: Vite bundles to single HTML
- **CI/CD**: GitHub Actions test + deploy

---

*Plan v4.0 — 2026-07-17. Red/Green TDD with comprehensive test strategy. Every system must work end-to-end.*
