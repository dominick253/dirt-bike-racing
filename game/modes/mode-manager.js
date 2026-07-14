/**
 * Mode Manager — Central dispatcher for game modes and shared race state
 */

// Shared race state accessible by all mode implementations
const RaceState = {
  active: false,
  startTime: 0,
  elapsedTime: 0,
  lapCount: 0,
  totalLaps: 3,
  checkpointsPassed: new Set(),
  currentCheckpoint: 0,
  positions: [], // For multiplayer/AI position tracking
  mode: null,
  earnings: 0,
  tricksScored: 0,
  comboMultiplier: 1,
  lastTrickTime: 0,
  trickCooldown: 2,
  isComplete: false,
  results: null,

  reset() {
    this.active = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.lapCount = 0;
    this.checkpointsPassed.clear();
    this.currentCheckpoint = 0;
    this.positions = [];
    this.mode = null;
    this.earnings = 0;
    this.tricksScored = 0;
    this.comboMultiplier = 1;
    this.lastTrickTime = 0;
    this.isComplete = false;
    this.results = null;
  },

  start(mode, totalLaps = 3) {
    this.active = true;
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.totalLaps = totalLaps;
    this.mode = mode;
    this.lapCount = 0;
    this.checkpointsPassed.clear();
    this.currentCheckpoint = 0;
    this.positions = [];
    this.isComplete = false;
  },

  update(dt) {
    if (!this.active) return;
    
    // Update elapsed time
    this.elapsedTime += dt;
    
    // Check mode-specific conditions for race completion
    const modeLogic = getGameModeLogic(this.mode);
    if (modeLogic && modeLogic.isComplete?.()) {
      this.complete();
    }
  },

  complete() {
    this.active = false;
    this.isComplete = true;
    
    // Calculate final results based on mode
    switch (this.mode) {
      case 'national':
        this.results = calculateNationalResults(this);
        break;
      case 'stunt':
        this.results = calculateStuntResults(this);
        break;
      case 'baja':
        this.results = calculateBajaResults(this);
        break;
      case 'enduro':
        this.results = calculateEnduroResults(this);
        break;
      case 'supercross':
        this.results = calculateSupercrossResults(this);
        break;
    }
    
    // Award earnings and update career
    if (this.results) {
      CareerManager.addResult(this.mode, this.results.position, this.elapsedTime, this.results.earnings);
    }
  },

  _calculatePosition() {
    // Simplified: player is always position 1 for single-player mode
    return this.positions.length > 0 ? this.positions.findIndex(p => p.id === 'player') + 1 : 1;
  }
};

// Mode implementations registry
const modeImplementations = {};

/**
 * Register a game mode implementation
 */
export function registerMode(modeId, implementation) {
  if (modeId && typeof implementation === 'object') {
    modeImplementations[modeId] = implementation;
    console.log(`🏁 Game mode registered: ${modeId}`);
  }
}

/**
 * Get the logic object for a specific game mode
 */
export function getGameModeLogic(modeId) {
  if (modeId && modeImplementations[modeId]) {
    return modeImplementations[modeId];
  }
  return null;
}

/**
 * Execute a specific action within the current mode
 */
export function executeModeAction(action, data = {}) {
  const mode = getGameModeLogic(RaceState.mode);
  if (mode && typeof mode[action] === 'function') {
    return mode[action](data);
  }
  console.warn(`Mode action not found: ${action}`);
}

// ==================== MODE IMPLEMENTATIONS ====================

// National Mode — lap racing with checkpoints and positions
registerMode('national', {
  name: 'National Race',
  
  onStart() {
    RaceState.start('national', 3);
    console.log('🏁 National race started');
  },

  update(dt, input) {
    if (!RaceState.active || RaceState.mode !== 'national') return;
    
    // Update elapsed time
    RaceState.elapsedTime += dt;
    
    // Check checkpoint progress (simplified: every lap)
    // This would integrate with physics system for actual checkpoints
  },

  isComplete() {
    return RaceState.lapCount >= RaceState.totalLaps;
  },

  onCheckpoint(checkpointId) {
    if (!RaceState.checkpointsPassed.has(checkpointId)) {
      RaceState.checkpointsPassed.add(checkpointId);
      
      // Check if lap is complete (all checkpoints passed)
      if (RaceState.checkpointsPassed.size >= 4) { // Assuming 4 checkpoints per lap
        RaceState.lapCount++;
        RaceState.checkpointsPassed.clear();
        
        console.log(`✅ Lap ${RaceState.lapCount}/${RaceState.totalLaps} complete`);
        
        // Flash lap notification
        if (typeof UI !== 'undefined') {
          UI.showLapFlash(`LAP ${RaceState.lapCount}`);
        }
      }
    }
  }
});

// Stunt Mode — trick scoring with combos and rotation points
registerMode('stunt', {
  name: 'Stunt Quarry',
  
  onStart() {
    RaceState.start('stunt');
    console.log('🔥 Stunt quarry mode activated');
  },

  update(dt, input) {
    if (!RaceState.active || RaceState.mode !== 'stunt') return;
    
    RaceState.elapsedTime += dt;
    
    // Check for tricks based on input and physics state
    // This integrates with the physics system for actual trick detection
  },

  isComplete() {
    // Stunt mode: complete when timer expires or player quits
    return RaceState.elapsedTime >= 120; // 2 minute time limit
  },

  onTrickPerformed(trickName, difficulty = 1) {
    const now = performance.now();
    
    // Combo system — reset combo if no tricks for cooldown period
    if (now - RaceState.lastTrickTime > RaceState.trickCooldown * 1000) {
      RaceState.comboMultiplier = 1;
    }
    
    // Calculate points
    const basePoints = difficulty * 100;
    const comboBonus = RaceState.comboMultiplier;
    const totalPoints = Math.floor(basePoints * comboBonus);
    
    RaceState.tricksScored += totalPoints;
    RaceState.lastTrickTime = now;
    RaceState.comboMultiplier += 0.5; // Increase combo
    
    console.log(`🎯 Trick: ${trickName} — +${totalPoints} points (combo x${RaceState.comboMultiplier.toFixed(1)})`);
    
    // Flash trick name if UI available
    if (typeof UI !== 'undefined') {
      UI.showTrickFlash(trickName, totalPoints);
    }
  }
});

// Baja Mode — waypoint gate navigation with accuracy scoring
registerMode('baja', {
  name: 'Baja Run',
  
  waypoints: [], // Will be populated with waypoint positions
  
  onStart() {
    RaceState.start('baja');
    
    // Generate random waypoints for the race route
    const numWaypoints = 8;
    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i / numWaypoints) * Math.PI * 2;
      const radius = 150 + Math.random() * 50 - 25; // Random radius variation
      this.waypoints.push({
        x: Math.cos(angle) * radius,
        y: getTerrainHeight?.(Math.cos(angle) * radius, Math.sin(angle) * radius) || 0,
        z: Math.sin(angle) * radius,
        id: `wp_${i}`,
        passed: false
      });
    }
    
    console.log('🗺️ Baja run started with', numWaypoints, 'waypoints');
  },

  update(dt, input) {
    if (!RaceState.active || RaceState.mode !== 'baja') return;
    
    RaceState.elapsedTime += dt;
  },

  isComplete() {
    return RaceState.checkpointsPassed.size >= this.waypoints.length;
  },

  checkWaypointApproach(playerX, playerZ) {
    const currentWP = this.waypoints.find(wp => 
      !wp.passed && 
      Math.abs(playerX - wp.x) < 15 && 
      Math.abs(playerZ - wp.z) < 15
    );
    
    if (currentWP) {
      currentWP.passed = true;
      RaceState.checkpointsPassed.add(currentWP.id);
      console.log(`🚩 Waypoint reached: ${currentWP.id}`);
      
      // Award points for waypoint completion
      RaceState.earnings += 500;
    }
  },

  calculateAccuracy() {
    const totalWaypoints = this.waypoints.length;
    const passedWaypoints = this.waypoints.filter(wp => wp.passed).length;
    
    return Math.min(1, passedWaypoints / totalWaypoints);
  }
});

// Enduro Mode — multi-track endurance with lap times and total time
registerMode('enduro', {
  name: 'Enduro Challenge',
  
  onStart() {
    RaceState.start('enduro', 5); // 5 laps for enduro
    console.log('⏱️ Enduro challenge started — 5 laps');
  },

  update(dt, input) {
    if (!RaceState.active || RaceState.mode !== 'enduro') return;
    
    RaceState.elapsedTime += dt;
  },

  isComplete() {
    return RaceState.lapCount >= RaceState.totalLaps;
  },

  onLapComplete(lapNumber, lapTime) {
    console.log(`⏰ Enduro lap ${lapNumber} completed in ${lapTime.toFixed(2)}s`);
    
    // Award points based on lap time (faster = more points)
    const basePoints = 1000;
    const timeBonus = Math.max(0, 300 - lapTime * 5); // Bonus for sub-300 second laps
    const totalPoints = Math.floor(basePoints + timeBonus);
    
    RaceState.earnings += totalPoints;
  }
});

// Supercross Mode — stadium track with huge jumps and combo scoring
registerMode('supercross', {
  name: 'Supercross',
  
  onStart() {
    RaceState.start('supercross', 2); // Shorter race for supercross intensity
    console.log('🏟️ Supercross mode activated — stadium track');
  },

  update(dt, input) {
    if (!RaceState.active || RaceState.mode !== 'supercross') return;
    
    RaceState.elapsedTime += dt;
    
    // Check for big jumps and aerial tricks
    // This would integrate with physics for jump detection
  },

  isComplete() {
    return RaceState.lapCount >= RaceState.totalLaps;
  },

  onBigJump(height) {
    const points = Math.floor(height * 10); // Points based on jump height
    RaceState.earnings += points;
    
    console.log(`🚀 Big jump! +${points} points`);
    
    if (typeof UI !== 'undefined') {
      UI.showJumpFlash(Math.round(height), points);
    }
  }
});

// ==================== RESULT CALCULATION HELPERS ====================

function calculateNationalResults(state) {
  return {
    position: state.positions.length > 0 ? 
      state.positions.findIndex(p => p.id === 'player') + 1 : 1,
    lapTime: state.elapsedTime / (state.lapCount || 1),
    totalLaps: state.totalLaps,
    earnings: calculateEarnings(state.positions.length)
  };
}

function calculateStuntResults(state) {
  return {
    score: state.tricksScored || 0,
    comboMax: state.comboMultiplier || 1,
    totalTricks: state.tricksScored ? Math.floor(state.tricksScored / 100) : 0,
    timeLimitReached: true,
    earnings: calculateEarningsFromScore(state.tricksScored)
  };
}

function calculateBajaResults(state) {
  return {
    waypointsPassed: state.checkpointsPassed.size,
    totalWaypoints: 8, // Matches the number in startX
    totalTime: state.elapsedTime,
    accuracy: calculateAccuracy(),
    earnings: calculateEarningsFromAccuracy(calculateAccuracy())
  };
}

function calculateEnduroResults(state) {
  return {
    position: 1, // Player is always first place for single-player enduro
    totalTime: state.elapsedTime,
    totalLaps: state.totalLaps,
    avgLapTime: state.lapCount > 0 ? state.elapsedTime / state.lapCount : 0,
    earnings: calculateEarningsFromLaps(state.totalLaps)
  };
}

function calculateSupercrossResults(state) {
  return {
    position: state.positions.length > 0 ? 
      state.positions.findIndex(p => p.id === 'player') + 1 : 1,
    totalTime: state.elapsedTime,
    bigJumps: 0, // Would be tracked in race state
    earnings: calculateEarnings(state.positions.length)
  };
}

function calculateAccuracy() {
  return Math.min(1, RaceState.checkpointsPassed.size / (this.waypoints?.length || 8));
}

// Earnings helper functions
function calculateEarnings(positions) {
  switch (positions) {
    case 0: return 2000; // First place
    case 1: return 1200; // Second place
    case 2: return 700;  // Third place
    default: return 300; // Fourth or lower
  }
}

function calculateEarningsFromScore(score) {
  if (score > 5000) return 1500;
  if (score > 2000) return 800;
  if (score > 500) return 400;
  return 100;
}

function calculateEarningsFromAccuracy(accuracy) {
  if (accuracy >= 0.9) return 1000;
  if (accuracy >= 0.7) return 600;
  if (accuracy >= 0.5) return 300;
  return 100;
}

function calculateEarningsFromLaps(laps) {
  const base = laps * 200;
  return base > 1500 ? 1500 : base;
}

export { RaceState, getGameModeLogic, registerMode, executeModeAction };
