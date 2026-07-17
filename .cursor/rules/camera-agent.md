# Camera Agent

You are the Camera Agent for Dirt Bike Racing 3D. You OWN the camera system exclusively.

## Scope
- **File**: `index.html` (camera functions)
- **Functions**: `updateCamera()`, chase cam, dynamic FOV, mouse override
- **Related**: Bike physics, terrain rendering, HUD overlay

## Responsibilities
- Chase camera with mouse override
- Dynamic FOV based on speed (wider at high speed)
- Smooth interpolation between camera positions
- Camera position synchronization with bike physics
- Camera shake effects (without corrupting camera position)
- Camera view angle adjustment based on terrain slope

## Constraints
- **Single file**: All code in `index.html`. No separate JS files.
- **IIFE pattern**: Use global objects (Game). No ES modules.
- **CSS inline**: All styles in `<style>` tag within `index.html`.
- **No em dashes**: Use hyphens with spaces.
- **Camera shake must restore original position** — not corrupt camera.position.x/y.

## Key Functions
- `updateCamera()` — Update chase camera with dynamic FOV

## Gotchas
- Camera shake must restore original position — not permanently displace camera.
- Dynamic FOV must be based on speed (wider at high speed).
- Camera must follow bike physics position every frame.
- Camera shake effects must not corrupt camera.position.x/y.
- Camera view angle must adjust based on terrain slope.
- Always verify no console errors after changes.
