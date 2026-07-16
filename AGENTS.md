# Dirt Bike Racing — Project AGENTS.md

## Architecture
Single-file HTML5 game (~60KB, 2143 lines) with inline CSS/JS. Three.js r128 loaded from cdncdnjs.cloudflare.com CDN. No ES modules, no build step, zero dependencies beyond CDN.

## Deployment
GitHub Pages: https://dominick253.github.io/dirt-bike-racing/
Branch: main (direct push)

## Key Patterns
- Single-file inline script for GitHub Pages reliability
- THREE.JS r128 from cdnjs.cloudflare.com — broadest browser compatibility
- All game state in global objects (Game, UI) since no modules
- localStorage for career persistence (mx3d_career key)
- **renderer.render(scene, camera) called every frame** — critical, verified working

## Visual Design
- **Fusion**: BMW M × PlayStation × Spotify design systems
- **Colors**: Pure black canvas (#000000), near-black surfaces (#121212–#1f1f1f), PlayStation Blue (#0070d1) accent, M Red (#e22718) danger
- **M Stripe**: 4px tricolor divider (light blue → dark blue → red)
- **Typography**: Inter font, weight 700 display, weight 300 body
- **Geometry**: Pill buttons (9999px), 8px cards, circular controls

## Core Systems
- **FBM Noise Terrain**: Simplex-like permutation LUT (512 entries), 5/3/2 octaves
- **Track**: Sinusoidal loop carved into terrain with ramps and jumps
- **Bike Physics**: Arcade-style throttle/brake/steer, slope-adaptive pitch/roll, suspension compression
- **Particle System**: Object-pooled canvas 2D overlay (zero Three.js allocations during gameplay)
- **Audio**: Web Audio API — sawtooth engine mapped to RPM, landing thuds, countdown beeps
- **AI Opponents**: 3 circle-following bots with lap progress tracking
- **Camera**: Chase cam with mouse override, dynamic FOV based on speed
- **Minimap**: Canvas 2D overlay showing bike + AI positions

## UI Screens
- Loading screen (progress bar with M stripe gradient)
- Title screen (BMW M × PlayStation fusion)
- Countdown (3-2-1-GO with audio)
- HUD (speed, gear, lap, timer, minimap, position, air/launch indicators)
- Mode select (National, Stunt, Enduro, Supercross)
- Garage (3 bikes with speed/handling/suspension stats)
- Career stats (wins, best laps per mode)
- Race complete (position, time, retry/menu)
- Mobile controls (touch joystick + gas/brake buttons)

## Gotchas
- **Critical**: Must call `renderer.render(scene, camera)` at end of animation loop
- **Three.js r128 from CDN** — do NOT use importmap on GitHub Pages
- **WebGL not available in headless browsers** — browser tool cannot render 3D, verify in real browser
- **Canvas CSS**: `display:block; position:fixed; top:0; left:0; width:100%; height:100%; z-index:1`
- **Loading screen hides itself** via class toggle after 500ms
- **Title screen needs `classList.add('active')`** to become visible
- **No em dashes** — use hyphens with spaces

## Files
- `index.html` — Complete game (~60KB, 2143 lines)
- `AGENTS.md` — This file
- `REWRITE_PLAN.md` — Complete rewrite plan and roadmap
- `AUDIT.md` — Previous version audit report
- `bikes/CarbonFrameBike.glb` — Original bike model (unused in rewrite)
