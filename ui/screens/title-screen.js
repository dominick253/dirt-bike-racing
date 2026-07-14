/**
 * Title Screen — Menu navigation, mode selection, bike garage, career dashboard
 */

export function init() {
  // Setup event listeners for title screen buttons (already wired in HTML via onclick)
  console.log('🎮 Title screen initialized');
}

/**
 * Hide title screen and transition to menu/game
 */
export function hide() {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
  
  // Show game HUD
  if (typeof UI !== 'undefined' && UI.show) {
    UI.showHUD(true);
  }
}

/**
 * Start a new race with the current mode and bike
 */
export function startRace() {
  const activeMode = Game.activeMode || 'national';
  
  // Hide title overlay
  hide();
  
  // Reset input state to prevent accidental starts
  if (typeof resetInput === 'function') {
    resetInput();
  }
  
  // Start countdown sequence then begin race
  console.log(`🏁 Starting race — Mode: ${activeMode}, Bike: Game.selectedBike || 'mx450'`);
}

/**
 * Show mode selection screen
 */
export function showModeSelect() {
  const titleScreen = document.getElementById('title-screen');
  const modeSelect = document.getElementById('mode-select');
  
  if (titleScreen) titleScreen.classList.add('hidden');
  if (modeSelect) modeSelect.classList.add('active');
}

/**
 * Hide the mode selection screen and return to title
 */
export function hideModeSelect() {
  const modeSelect = document.getElementById('mode-select');
  const titleScreen = document.getElementById('title-screen');
  
  if (modeSelect) modeSelect.classList.remove('active');
  if (titleScreen) titleScreen.classList.remove('hidden');
}

/**
 * Show bike garage screen
 */
export function showBikeGarage() {
  const titleScreen = document.getElementById('title-screen');
  const bikeGarage = document.getElementById('bike-garage');
  
  if (titleScreen) titleScreen.classList.add('hidden');
  if (bikeGarage) bikeGarage.classList.add('active');
  
  // Build bike list with current career progress
  buildBikeList();
}

/**
 * Hide the bike garage and return to title
 */
export function hideBikeGarage() {
  const bikeGarage = document.getElementById('bike-garage');
  const titleScreen = document.getElementById('title-screen');
  
  if (bikeGarage) bikeGarage.classList.remove('active');
  if (titleScreen) titleScreen.classList.remove('hidden');
}

/**
 * Show career dashboard with stats
 */
export function showCareerScreen() {
  const titleScreen = document.getElementById('title-screen');
  const careerScreen = document.getElementById('career-screen');
  
  if (titleScreen) titleScreen.classList.add('hidden');
  if (careerScreen) careerScreen.classList.add('active');
  
  // Build career stats display
  buildCareerStats();
}

/**
 * Hide the career screen and return to title
 */
export function hideCareerScreen() {
  const careerScreen = document.getElementById('career-screen');
  const titleScreen = document.getElementById('title-screen');
  
  if (careerScreen) careerScreen.classList.remove('active');
  if (titleScreen) titleScreen.classList.remove('hidden');
}

/**
 * Show race complete screen with results
 */
export function showRaceComplete(results) {
  const raceComplete = document.getElementById('race-complete');
  const resultDetails = document.getElementById('race-result-details');
  
  if (raceComplete && resultDetails) {
    // Format results display
    let html = '';
    
    if (results?.position) {
      html += `<p><strong>Finish Position:</strong> #${results.position}</p>`;
    }
    
    if (results?.time || results?.totalTime) {
      const time = typeof results.time === 'number' ? results.time : results.totalTime;
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      html += `<p><strong>Finish Time:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}</p>`;
    }
    
    if (results?.totalLaps) {
      html += `<p><strong>Laps Completed:</strong> ${results.totalLaps}</p>`;
    }
    
    if (results?.earnings) {
      html += `<p style="color: #ff8c00; font-weight: bold;"><strong>Earnings:</strong> $${results.earnings}</p>`;
    }
    
    resultDetails.innerHTML = html;
    raceComplete.classList.add('show');
  }
}

/**
 * Build the bike selection list in the garage
 */
function buildBikeList() {
  const bikeListEl = document.getElementById('bike-list');
  if (!bikeListEl) return;
  
  // Get bike data from constants or game state
  const bikes = Game.bikes || [
    { id: 'mx450', name: 'MX-450 Pro', stats: { speed: 7, accel: 8, handling: 6 }, unlocked: true },
    { id: 'zx250', name: 'ZX-250 R', stats: { speed: 5, accel: 9, handling: 7 }, unlocked: false },
    { id: 'dr800', name: 'DR-800 Monster', stats: { speed: 8, accel: 5, handling: 4 }, unlocked: false },
    { id: 'fx310', name: 'FX-310 Classic', stats: { speed: 5, accel: 7, handling: 8 }, unlocked: false }
  ];
  
  bikeListEl.innerHTML = '';
  
  bikes.forEach(bike => {
    const card = document.createElement('div');
    card.className = `bike-card${Game.selectedBike === bike.id ? ' selected' : ''}${!bike.unlocked ? ' locked' : ''}`;
    
    let statsHtml = '';
    Object.entries(bike.stats).forEach(([stat, value]) => {
      const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
      statsHtml += `
        <div class="stat-bar">
          <label>${statName}</label>
          <div class="bar">
            <div class="fill" style="width: ${value * 10}%"></div>
          </div>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="bike-name">${bike.unlocked ? bike.name : '🔒 LOCKED'}</div>
      ${statsHtml}
    `;
    
    if (bike.unlocked) {
      card.addEventListener('click', () => {
        Game.selectedBike = bike.id;
        
        // Remove selected class from all cards
        document.querySelectorAll('.bike-card').forEach(card => card.classList.remove('selected'));
        
        // Add selected class to this card
        card.classList.add('selected');
      });
    }
    
    bikeListEl.appendChild(card);
  });
}

/**
 * Build the career stats display
 */
function buildCareerStats() {
  const statsEl = document.getElementById('career-stats');
  if (!statsEl) return;
  
  // Get career data from global Game or default values
  const career = Game.career || {
    races: 0,
    wins: 0,
    podiums: 0,
    earnings: 0,
    tricks: 0,
    fastestLap: null
  };
  
  const stats = [
    { label: 'RACES', value: career.races || 0 },
    { label: 'WINS', value: career.wins || 0 },
    { label: 'PODIUMS', value: career.podiums || 0 },
    { label: 'EARNINGS', value: `$${(career.earnings || 0).toLocaleString()}` },
    { label: 'TRICKS SCORED', value: (career.tricks || 0).toLocaleString() }
  ];
  
  statsEl.innerHTML = '';
  
  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
      <div class="stat-value">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
    `;
    statsEl.appendChild(card);
  });
}

/**
 * Show/hide various UI screens (utility function)
 */
export function showScreen(screenId) {
  // Hide all screens first
  document.getElementById('mode-select').classList.remove('active');
  document.getElementById('bike-garage').classList.remove('active');
  document.getElementById('career-screen').classList.remove('active');
  
  // Show requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
  }
}

export function hideScreen(screenId) {
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('active');
    
    // Return to title screen
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen) {
      titleScreen.classList.remove('hidden');
    }
  }
}
