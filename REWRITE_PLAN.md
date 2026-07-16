# MOTOCROSS MADNESS 3D — Complete Rewrite Plan

## Vision: "The Best Dirt Bike Game on the Web"

A single-file HTML5 game that looks, feels, and plays like a premium mobile racing game — but runs in any browser with zero dependencies beyond Three.js r128 CDN.

---

## 1. DESIGN FUSION: BMW M × PlayStation × Spotify

### Visual Identity
- **Canvas**: Pure black `#000000` — BMW M's near-black canvas
- **Surface**: `#121212` → `#181818` → `#1f1f1f` — Spotify's dark immersion
- **Accent**: PlayStation Blue `#0070d1` for primary CTAs, M Red `#e22718` for danger/warning states
- **M Stripe**: 4px tricolor stripe (light blue → dark blue → red) as brand divider
- **Typography**: Inter (free, Google Fonts) — weight 700 for display, weight 300 for body
- **Buttons**: Pill geometry (PlayStation/Spotify fusion) — `9999px` radius
- **No em dashes** — user requirement, use hyphens with spaces

### In-Game Visual Style
- **Terrain**: Procedural FBM noise heightmap (per the threejs-arcade-games skill) — dirt track with realistic bumps, ramps, jumps
- **Bike**: Low-poly but detailed — wheel rotation animation, suspension compression, lean into turns
- **Lighting**: Dynamic directional light + ambient + fogExp2 for depth
- **Particles**: Object-pooled dust system (NO per-frame allocation) — canvas 2D overlay for performance
- **Post-processing**: Screen shake on landing, speed-based FOV distortion
- **Sky**: Procedural gradient sky dome with time-of-day cycle
- **Vegetation**: InstancedMesh trees with 3-4 variants (trunk + canopy colors)
- **Track markers**: Reflective posts, starting grid lines, checkpoint flags

---

## 2. CORE ARCHITECTURE

### Single HTML File Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MOTOCROSS MADNESS 3D</title>
  <style>/* All CSS inline */</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <!-- Loading screen -->
  <!-- Title screen -->
  <!-- HUD overlay -->
  <!-- Minimap canvas -->
  <script>
    // All game code inline — IIFE pattern
    // 1. Constants & Config
    // 2. Noise / Heightmap (Simplex-like FBM)
    // 3. Terrain Generation
    // 4. Bike Model & Physics
    // 5. Track Definition
    // 6. Camera System
    // 7. Particle System (object pool)
    // 8. Audio System (Web Audio API)
    // 9. Input System
    // 10. Game State Machine
    // 11. UI / HUD Manager
    // 12. Boot Sequence
  </script>
</body>
</html>
```

### State Machine
```
LOADING → TITLE → COUNTDOWN → RACING → LAP_COMPLETE → RACE_COMPLETE
                                      ↓
                              GARAGE → TITLE
                                      ↓
                              MODE_SELECT → TITLE
                                      ↓
                              CAREER → TITLE
```

---

## 3. GAMEPLAY FEATURES (Prioritized)

### M1: Core Racing (MVP)
- **Procedural track**: Sinusoidal loop with ramps, jumps, chicanes
- **Bike physics**: Arcade-style — throttle, brake, steer, wheelie, air control
- **Terrain collision**: Raycast heightmap lookup, slope-adaptive pitch/roll
- **Lap system**: 3 checkpoints, proper angle-based detection
- **Finish condition**: Fixed lap count → race complete screen
- **Timer**: Accurate elapsed time tracking
- **Speed display**: Derived from velocity magnitude

### M2: Visual Polish
- **Wheel rotation**: Torus geometry rotates based on speed
- **Suspension animation**: Bike body compresses on landing
- **Dust particles**: Object-pooled canvas 2D overlay (NOT Three.js meshes)
- **Screen shake**: On landing impact
- **Dynamic FOV**: Camera FOV widens with speed
- **Sky gradient**: Changes based on in-game time
- **Fog**: Atmospheric depth with fogExp2
- **Shadow maps**: 1024² for performance

### M3: Audio
- **Engine sound**: Web Audio API — sawtooth oscillator mapped to RPM
- **Tire noise**: Filtered noise buffer when sliding
- **Landing thud**: Short noise burst on impact
- **Countdown beeps**: Simple oscillator tones
- **UI clicks**: Short blips for menu navigation

### M4: Game Modes
- **National**: Standard 3-lap race
- **Stunt**: Score-based — big air tricks, wheelies
- **Enduro**: Time attack — beat the clock
- **Supercross**: Tighter track, more jumps
- **Baja**: Long track, varied terrain

### M5: Career System
- **Persistent stats**: localStorage with version field
- **Bike garage**: 3 bikes with different stats (speed, handling, suspension)
- **Leaderboard**: Best lap times per mode
- **Achievements**: "First Win", "Big Air", "Perfect Lap"

---

## 4. TECHNICAL DEBT FIXES (From Audit)

### Critical
1. **Particle system**: Replace per-frame allocation with object pool
   - Pre-allocate 200 canvas 2D particles
   - Reuse positions, colors, lifetimes
   - Zero GC pressure during gameplay

2. **Lap tracking**: Fix operator precedence bug
   - Proper checkpoint angle detection with parentheses
   - 3 checkpoints: start/finish, halfway, 3/4

3. **Race finish**: Implement proper end condition
   - Lap counter → finishRace() → race complete screen

4. **UI.clock**: Fix dangling reference
   - Reference Game.clock directly, not UI.clock

### High Priority
5. **Terrain**: Replace sin/cos with real FBM noise
   - Simplex-like permutation LUT (512 entries)
   - 5 octaves for rolling hills, 3 for bumps, 2 for detail
   - Track path carved into terrain

6. **Track**: Replace torus with proper track path
   - Sine-wave loop track
   - Terrain matches track geometry
   - Track width with raised curbs

7. **Bike model**: Add wheel rotation + suspension
   - Wheels rotate based on speed
   - Body leans into turns
   - Suspension compression on landing

8. **Game modes**: Implement mode-specific logic
   - Different track parameters per mode
   - Different scoring per mode

### Medium Priority
9. **Minimap**: Actually draw the minimap
   - Canvas 2D overlay showing bike position on track
   - Rotating view, scale to track bounds

10. **Position tracking**: Add AI opponents
    - Simple circle-following bots
    - Position pills update based on lap progress

11. **Touch controls**: Virtual joystick for mobile
    - On-screen steering pad
    - Throttle/brake buttons

12. **Error handling**: CDN fallback
    - If Three.js fails to load, show error message

---

## 5. PERFORMANCE OPTIMIZATIONS

### Rendering
- **InstancedMesh** for vegetation (2 draw calls for 500+ trees)
- **flatShading: true** on all materials
- **Pixel ratio capping**: Math.min(devicePixelRatio, 2)
- **Shadow map**: 1024² (not 2048²) for performance
- **Particle system**: Canvas 2D overlay (NOT Three.js meshes)
  - Zero Three.js allocations during gameplay
  - Pre-allocate 200 particles
  - Reuse geometry/materials

### Physics
- **Heightmap cache**: O(1) bilinear interpolation
- **Fixed dt**: 1/60 constant, not variable
- **Capped delta time**: Math.min(dt, 0.05)
- **Speed clamp**: Global cap after position integration

### Memory
- **Object pooling**: Particles, UI elements, temporary objects
- **No per-frame allocations** during gameplay loop
- **Dispose old geometries**: When changing bikes/modes

---

## 6. TDD WORKFLOW

### Test Categories
1. **Unit tests**: Physics calculations, noise functions, lap detection
2. **Integration tests**: Game loop state transitions
3. **Visual tests**: Screenshot comparison (manual, via vision analysis)
4. **Performance tests**: FPS monitoring, GC pressure

### Testing Framework
- **Vitest** for unit tests (fast, browser-compatible)
- **Custom game loop harness**: Headless Three.js for physics testing
- **Screenshot comparison**: Puppeteer for visual regression

### CI/CD
- **GitHub Actions**: Run tests on every push
- **Browser test**: Headless Chrome for visual testing
- **Performance benchmark**: FPS logging over 60-second run

---

## 7. DEPLOYMENT

### GitHub Pages
- **Branch**: main (direct push)
- **URL**: https://dominick253.github.io/dirt-bike-racing/
- **No build step**: Single HTML file, CDN Three.js r128
- **.htaccess**: Already configured for MIME types

### Verification
1. **Vision analysis**: Screenshot the deployed game
2. **Console check**: No JS errors in browser console
3. **Performance**: 60 FPS on mid-range laptop
4. **Controls**: Keyboard + touch input verified
5. **Career persistence**: localStorage read/write verified

---

## 8. DEVELOPMENT MILESTONES

### Phase 1: Foundation (Days 1-3)
- [ ] Noise/heightmap system (FBM)
- [ ] Terrain generation with track carving
- [ ] Basic bike physics (throttle, brake, steer)
- [ ] Ground collision + slope adaptation
- [ ] Camera chase system

### Phase 2: Visual Polish (Days 4-6)
- [ ] Bike model with wheel rotation
- [ ] Particle dust system (object pool)
- [ ] Lighting + fog + shadows
- [ ] Sky gradient
- [ ] Vegetation (instanced trees)

### Phase 3: Game Systems (Days 7-9)
- [ ] Lap tracking (proper checkpoint system)
- [ ] Race finish condition
- [ ] Timer + speed display
- [ ] Audio system (Web Audio API)
- [ ] Countdown sequence

### Phase 4: UI/UX (Days 10-12)
- [ ] Title screen (BMW M × PlayStation fusion)
- [ ] Mode selection
- [ ] Garage (3 bikes)
- [ ] Career stats
- [ ] HUD (speed, gear, lap, timer, minimap)

### Phase 5: Game Modes (Days 13-15)
- [ ] National (3-lap race)
- [ ] Stunt (big air scoring)
- [ ] Enduro (time attack)
- [ ] Supercross (tight track)
- [ ] Baja (long track)

### Phase 6: Polish & Deploy (Days 16-18)
- [ ] Touch controls
- [ ] AI opponents (basic)
- [ ] Achievement system
- [ ] Performance optimization
- [ ] GitHub Pages deployment
- [ ] Vision analysis verification
- [ ] Console error check

---

## 9. RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Three.js CDN fails on GitHub Pages | Use plain `<script src>` tag (r128) |
| Missing renderer.render() | Checklist item in boot sequence |
| GC pressure from particles | Object pool + canvas 2D overlay |
| Lap tracking bugs | Proper parentheses, unit tests |
| Timer shows 0:00.0 | Reference Game.clock directly |
| Bike selection has no effect | Bike model + physics stats per bike |
| No finish condition | Lap counter → finishRace() |
| Mobile not supported | Virtual joystick from Day 10 |

---

## 10. DESIGN TOKENS (Fusion: BMW M × PlayStation × Spotify)

### Colors
```css
:root {
  --color-canvas: #000000;
  --color-surface-1: #121212;
  --color-surface-2: #181818;
  --color-surface-3: #1f1f1f;
  --color-accent: #0070d1;        /* PlayStation Blue */
  --color-accent-hover: #0064b7;
  --color-danger: #e22718;        /* M Red */
  --color-danger-hover: #ff3b2e;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;
  --color-text-muted: #7e7e7e;
  --color-border: #3c3c3c;
  --color-border-strong: #262626;
  --color-success: #0fa336;
  --color-warning: #f4b400;
  --color-m-stripe-1: #0066b1;
  --color-m-stripe-2: #1c69d4;
  --color-m-stripe-3: #e22718;
}
```

### Typography
- **Display**: Inter 700, uppercase, 0 letter-spacing
- **Body**: Inter 300, sentence case
- **Buttons**: Inter 700, uppercase, 1.5px letter-spacing
- **Micro labels**: Inter 700, uppercase, 1.5px letter-spacing

### Geometry
- **Buttons**: Pill (9999px radius)
- **Cards**: 8px radius
- **Inputs**: 500px radius (pill)
- **Icons**: 50% radius (circular)

---

*Plan generated 2026-07-16. Target: 18-day development sprint → GitHub Pages deployment → Vision analysis verification.*
