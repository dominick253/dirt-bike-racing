/**
 * HUD Dashboard — Speed display, gear indicator, lap timer, minimap, state bar, race completion overlay
 */

// DOM elements cache
let hudEl = null;
let speedValueEl = null;
let gearValueEl = null;
let lapValueEl = null;
let timeValueEl = null;
let stateBarEl = null;
let minimapCanvas = null;
let minimapCtx = null;
let raceCompleteEl = null;

// Game state references
let currentLapTime = 0;
let totalTime = 0;
let startTime = 0;
let lapCount = 0;
let totalLaps = 3;
let bikeSpeed = 0;
let bikeGear = 'N';
let bikeStateText = 'READY';

export function init() {
  hudEl = document.getElementById('hud');
  speedValueEl = document.getElementById('speed-value');
  gearValueEl = document.getElementById('gear-value');
  lapValueEl = document.getElementById('lap-value');
  stateBarEl = document.getElementById('state-bar');
  minimapCanvas = document.getElementById('minimap-canvas');
  raceCompleteEl = document.getElementById('race-complete');
  
  if (minimapCanvas) {
    minimapCtx = minimapCanvas.getContext('2d');
  }
}

export function show(mode) {
  // mode: 'active', 'results'
  if (mode === 'active') {
    hudEl.classList.add('active');
  } else if (mode === 'results') {
    raceCompleteEl.classList.add('show');
  } else if (mode === 'hide') {
    hudEl.classList.remove('active');
  }
}

export function hide(mode) {
  // mode: 'hud', 'race-complete'
  if (mode === 'hud') {
    hudEl.classList.remove('active');
  } else if (mode === 'race-complete') {
    raceCompleteEl.classList.remove('show');
  } else if (mode === 'all') {
    hudEl.classList.remove('active');
    raceCompleteEl.classList.remove('show');
  }
}

export function updateHUD(dt, input) {
  // Update lap time and total time
  totalTime += dt;
  currentLapTime += dt;
  
  // Get speed from game state (convert from m/s to km/h for display)
  if (Game.engine && Game.engine.getBikeSpeed) {
    bikeSpeed = Math.round(Game.engine.getBikeSpeed() * 3.6);
  }
  
  // Determine gear based on speed
  const gear = calculateGear(bikeSpeed, input.throttle);
  bikeGear = gear;
  
  // Calculate current lap time for display
  const lapMinutes = Math.floor(currentLapTime / 60);
  const lapSeconds = Math.floor(currentLapTime % 60);
  const lapMs = Math.floor((currentLapTime % 1) * 10);
  
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = Math.floor(totalTime % 60);
  
  // Update speed display
  if (speedValueEl) {
    speedValueEl.textContent = bikeSpeed;
    // Color coding: normal/green < 200, warning/yellow 200-250, red > 250
    if (bikeSpeed > 250) {
      speedValueEl.style.color = '#ff4444';
    } else if (bikeSpeed > 200) {
      speedValueEl.style.color = '#ffcc00';
    } else {
      speedValueEl.style.color = '#ff8c00';
    }
  }
  
  // Update gear display
  if (gearValueEl) {
    gearValueEl.textContent = bikeGear;
    gearValueEl.style.color = bikeGear === 'N' ? '#888' : '#ff8c00';
  }
  
  // Update lap counter
  if (lapValueEl) {
    lapValueEl.textContent = `${Math.min(lapCount + 1, totalLaps)}/${totalLaps}`;
  }
  
  // Update time display
  const timeStr = formatTime(totalMinutes, totalSeconds);
  if (timeValueEl || document.getElementById('hud-time')) {
    document.getElementById('hud-time').textContent = timeStr;
  }
  
  // Update state bar with current bike status
  if (stateBarEl) {
    let stateText = 'GROUND';
    let stateClass = '';
    
    if (bikeSpeed < 1) {
      stateText = 'READY';
      stateBarEl.className = 'hud-bottom';
    } else if (input.wheelie && bikeSpeed > 5) {
      stateText = '🔥 WHEELIE';
      stateClass = 'state-wheelie';
    } else if (input.compression) {
      stateText = '⬇️ COMPRESSION';
      stateClass = '';
    } else if (isAirborne()) {
      stateText = '🚀 AIRBORNE';
      stateClass = 'state-airborne';
    } else if (bikeSpeed > 150) {
      stateText = `MAX SPEED ${bikeSpeed} km/h`;
    } else if (bikeSpeed > 80) {
      stateText = `🏍️ ${bikeSpeed} km/h`;
    } else {
      stateText = 'ACCELERATING';
    }
    
    stateBarEl.textContent = stateText;
    stateBarEl.className = `hud-bottom ${stateClass}`;
  }
  
  // Update minimap every few frames for performance
  if (Math.floor(totalTime * 10) % 2 === 0 && minimapCtx) {
    renderMinimap();
  }
}

function calculateGear(speed, throttle) {
  if (speed < 5) return 'N'; // Neutral at very low speeds
  if (throttle === 0 && speed > 5) return 'B'; // Brake/coast gear
  
  if (speed < 30) return '1';
  if (speed < 60) return '2';
  if (speed < 95) return '3';
  if (speed < 135) return '4';
  if (speed < 180) return '5';
  if (speed < 230) return '6';
  return '7'; // Top speed gear
}

function isAirborne() {
  return Game.engine?.bikeState?.onGround === false;
}

export function formatTime(minutes, seconds) {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Render the minimap — circular radar-style display showing track and player position
 */
function renderMinimap() {
  if (!minimapCtx) return;
  
  const ctx = minimapCtx;
  const width = minimapCanvas.width;
  const height = minimapCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 70; // Radius of the minimap circle
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background (dark terrain color)
  ctx.fillStyle = 'rgba(34, 68, 20, 0.7)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw track ring (simplified circular representation of the main track)
  const TRACK_RADIUS = 170; // from constants
  const trackScale = radius / (TRACK_RADIUS + 30); // Scale to fit
  
  // Outer boundary of world
  ctx.strokeStyle = 'rgba(139, 105, 60, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const worldRadius = WORLD_SIZE * 0.4 * trackScale;
  ctx.arc(centerX, centerY, worldRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Main circular track path
  ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, TRACK_RADIUS * trackScale, 0, Math.PI * 2);
  ctx.stroke();
  
  // Track details — inner and outer edges
  ctx.strokeStyle = 'rgba(255, 106, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, (TRACK_RADIUS - TRACK_WIDTH/2) * trackScale, 0, Math.PI * 2);
  ctx.stroke();
  
  // Jump markers on track
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const jumpX = centerX + Math.cos(angle) * TRACK_RADIUS * trackScale;
    const jumpY = centerY + Math.sin(angle) * TRACK_RADIUS * trackScale;
    
    ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(jumpX, jumpY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Player position and direction
  if (Game.engine && Game.engine.getBikePosition) {
    const bikePos = Game.engine.getBikePosition();
    const playerScreenX = centerX + (bikePos.x) * trackScale;
    const playerScreenY = centerY + (bikePos.z) * trackScale;
    
    // Draw player dot (bright orange-red)
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction indicator
    const heading = Game.engine.getBikeHeading?.() || 0;
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);
    ctx.lineTo(
      playerScreenX - Math.sin(heading) * 15,
      playerScreenY - Math.cos(heading) * 15
    );
    ctx.stroke();
  }
  
  // Border ring
  ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  
  // Compass indicators
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('N', centerX, centerY - radius + 12);
  ctx.fillText('S', centerX, centerY + radius - 2);
  ctx.fillText('E', centerX + radius - 8, centerY + 4);
  ctx.fillText('W', centerX - radius + 8, centerY + 4);
}

/**
 * Show lap flash notification (e.g., "LAP 1/3")
 */
export function showLapFlash(text) {
  const flashEl = document.getElementById('lap-flash');
  if (!flashEl) return;
  
  flashEl.textContent = text;
  flashEl.classList.add('show');
  
  setTimeout(() => {
    flashEl.classList.remove('show');
  }, 2000);
}

/**
 * Show trick flash for stunt mode (e.g., "BACKFLIP! +150")
 */
export function showTrickFlash(trickName, points) {
  // Create a temporary overlay element
  const existing = document.getElementById('trick-flash');
  if (existing) {
    existing.remove();
  }
  
  const flashEl = document.createElement('div');
  flashEl.id = 'trick-flash';
  flashEl.style.cssText = `
    position: fixed; top: 35%; left: 50%; transform: translate(-50%, -50%);
    z-index: 65; font-size: clamp(1.8rem, 5vw, 2.5rem); color: #ff8c00;
    font-weight: 900; text-shadow: 0 0 20px rgba(255, 140, 0, 0.8);
    opacity: 0; transition: opacity 0.3s; pointer-events: none;
    text-transform: uppercase; letter-spacing: 0.1em;
  `;
  flashEl.textContent = `${trickName.toUpperCase()}! +${points}`;
  
  document.body.appendChild(flashEl);
  requestAnimationFrame(() => {
    flashEl.style.opacity = '1';
  });
  
  setTimeout(() => {
    flashEl.style.opacity = '0';
    setTimeout(() => flashEl.remove(), 500);
  }, 2000);
}

/**
 * Show jump height notification for supercross mode
 */
export function showJumpFlash(height, points) {
  const existing = document.getElementById('jump-flash');
  if (existing) existing.remove();
  
  const flashEl = document.createElement('div');
  flashEl.id = 'jump-flash';
  flashEl.style.cssText = `
    position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
    z-index: 65; font-size: clamp(1.5rem, 4vw, 2rem); color: #44ff88;
    font-weight: 900; text-shadow: 0 0 15px rgba(0, 255, 136, 0.6);
    opacity: 0; transition: opacity 0.3s; pointer-events: none;
  `;
  flashEl.textContent = `${Math.round(height)}m JUMP! +${points}`;
  
  document.body.appendChild(flashEl);
  requestAnimationFrame(() => {
    flashEl.style.opacity = '1';
  });
  
  setTimeout(() => {
    flashEl.style.opacity = '0';
    setTimeout(() => flashEl.remove(), 500);
  }, 1500);
}

/**
 * Show unlock notification for new bike/item unlock
 */
export function showUnlockNotification(itemName, itemId) {
  const existing = document.getElementById('unlock-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'unlock-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 85; display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, #1a1a2e, #16213e); 
    border: 2px solid #ff8c00; border-radius: 12px; padding: 2rem; max-width: 400px;
    text-align: center; box-shadow: 0 0 30px rgba(255, 140, 0, 0.3);
  `;
  
  content.innerHTML = `
    <h2 style="color: #ff8c00; font-size: 1.8rem; margin-bottom: 0.5rem;">🔓 UNLOCKED!</h2>
    <p style="font-size: 1.3rem; color: white;">${itemName}</p>
    <p style="font-size: 0.9rem; color: #aaa; margin-top: 1rem;">New bike available in the garage</p>
    <button onclick="this.closest('#unlock-overlay').remove(); UI.showBikeGarage();" 
            style="margin-top: 1.5rem; background: #ff8c00; color: white; border: none; padding: 0.8rem 2rem; 
                   border-radius: 6px; cursor: pointer; font-size: 1rem;">
      View Garage
    </button>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

/**
 * Show race results screen with final stats
 */
export function showResults(results) {
  const detailsEl = document.getElementById('race-result-details');
  if (!detailsEl || !results) return;
  
  let html = '';
  
  if (results.position) {
    html += `<p><strong>Position:</strong> #${results.position} of ${results.totalRaces || results.positions?.length || '?'}</p>`;
  }
  
  if (results.time || results.totalTime) {
    const time = typeof results.time === 'number' ? results.time : results.totalTime;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    html += `<p><strong>Finish Time:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}</p>`;
  }
  
  if (results.lapTime) {
    html += `<p><strong>Average Lap:</strong> ${results.lapTime.toFixed(2)}s</p>`;
  }
  
  if (results.totalLaps) {
    html += `<p><strong>Laps Completed:</strong> ${results.totalLaps}</p>`;
  }
  
  if (results.score !== undefined) {
    html += `<p><strong>Trick Score:</strong> ${results.score} points</p>`;
  }
  
  if (results.comboMax) {
    html += `<p><strong>Max Combo:</strong> x${results.comboMax.toFixed(1)}</p>`;
  }
  
  if (results.accuracy !== undefined) {
    html += `<p><strong>Accuracy:</strong> ${Math.round(results.accuracy * 100)}%</p>`;
  }
  
  if (results.earnings) {
    html += `<p style="color: #ff8c00; font-weight: bold;"><strong>Earnings:</strong> $${results.earnings}</p>`;
  }
  
  detailsEl.innerHTML = html;
  
  // Show the race complete overlay
  document.getElementById('race-complete').classList.add('show');
}

/**
 * Update position indicator for multiplayer (simplified)
 */
export function updatePositionBar(position, totalRacers) {
  const posBar = document.getElementById('pos-bar');
  if (!posBar) return;
  
  posBar.innerHTML = '';
  
  // Generate position pills
  for (let i = 1; i <= Math.min(totalRacers, 8); i++) {
    const pill = document.createElement('div');
    pill.className = `pos-pill ${i === position ? 'current' : ''}`;
    pill.textContent = i;
    posBar.appendChild(pill);
  }
}

/**
 * Reset HUD to initial state
 */
export function reset() {
  if (speedValueEl) speedValueEl.textContent = '0';
  if (gearValueEl) gearValueEl.textContent = 'N';
  if (lapValueEl) lapValueEl.textContent = `0/${totalLaps}`;
  currentLapTime = 0;
  totalTime = 0;
}
