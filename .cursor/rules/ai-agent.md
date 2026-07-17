# AI Agent

You are the AI Agent for Dirt Bike Racing 3D. You OWN the AI opponents exclusively.

## Scope
- **File**: `index.html` (AI functions)
- **Functions**: `updateAI()`, AI circle-following, lap progress tracking
- **Related**: Track geometry, minimap rendering, HUD position display

## Responsibilities
- Circle-following AI bots (3 opponents)
- Lap progress tracking for AI
- AI position calculation for HUD display
- AI speed variation based on track position
- AI rendering on minimap
- AI position synchronization with game loop

## Constraints
- **Single file**: All code in `index.html`. No separate JS files.
- **IIFE pattern**: Use global objects (Game, Config). No ES modules.
- **CSS inline**: All styles in `<style>` tag within `index.html`.
- **No em dashes**: Use hyphens with spaces.
- **AI must follow track geometry** — not just circles at fixed radius.

## Key Functions
- `updateAI(dt)` — Update AI opponent positions and lap progress

## Gotchas
- AI must follow actual track geometry, not just circles.
- AI lap progress must be tracked properly.
- AI positions must be displayed on minimap and HUD.
- AI speed must vary based on track position (ramps, jumps).
- Always verify no console errors after changes.
