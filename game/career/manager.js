/**
 * Career Manager — Persistent career progression, earnings tracking, unlockables
 */

// Default career data structure
const DEFAULT_CAREER = {
  totalRaces: 0,
  racesWon: 0,
  racesPodium: 0,
  totalEarnings: 0,
  currentMoney: 500, // Starting money
  bestFinish: {},
  fastestLapTimes: {},
  trickScores: {},
  unlockedBikes: ['mx450'], // Default unlocked bike
  settings: {
    difficulty: 'normal', // easy, normal, hard
    cameraMode: 'chase',
    audioEnabled: true,
    postEffectsEnabled: true,
    controls: {}
  },
  lastPlayed: null
};

// Current career instance
let career = null;

/**
 * Initialize the career manager
 */
export class CareerManager {
  static data = null;

  static init() {
    // Load saved career or create new one
    this.data = loadCareerData() || {...DEFAULT_CAREER};
    
    console.log('📊 Career manager initialized —', 
      `Races: ${this.data.totalRaces}, ` +
      `Earnings: $${this.data.currentMoney}`);
  }

  /**
   * Record a race result
   */
  static addResult(mode, position, time, earnings) {
    if (!this.data) return;
    
    this.data.totalRaces++;
    this.data.totalEarnings += earnings;
    this.data.currentMoney += earnings;
    
    // Update best finishes per mode
    if (!this.data.bestFinish[mode]) {
      this.data.bestFinish[mode] = { position: 10, time: Infinity };
    }
    
    if (position <= this.data.bestFinish[mode].position) {
      this.data.bestFinish[mode].position = position;
    }
    
    // Update fastest lap times
    if (time < this.data.fastestLapTimes[mode]?.time || !this.data.fastestLapTimes[mode]) {
      this.data.fastestLapTimes[mode] = { time, date: new Date().toISOString() };
    }
    
    // Track race wins and podiums
    if (position === 1) {
      this.data.racesWon++;
    }
    
    if (position <= 3) {
      this.data.racesPodium++;
    }
    
    // Track trick scores for stunt mode
    if (mode === 'stunt') {
      const currentScore = this.data.trickScores[mode] || 0;
      this.data.trickScores[mode] = Math.max(currentScore, earnings);
    }
    
    // Update last played timestamp
    this.data.lastPlayed = new Date().toISOString();
    
    // Check for unlocks
    this.checkUnlocks();
    
    // Save career data
    saveCareerData(this.data);
    
    console.log('📊 Race result recorded —', 
      `Mode: ${mode}, Position: #${position}, Earnings: $${earnings}`);
  }

  /**
   * Check if player has unlocked new bikes/content
   */
  static checkUnlocks() {
    const unlocks = [
      { id: 'zx250', name: 'ZX-250 R', condition: () => this.data.racesWon >= 3 },
      { id: 'dr800', name: 'DR-800 Monster', condition: () => this.data.totalEarnings >= 10000 },
      { id: 'fx310', name: 'FX-310 Classic', condition: () => this.data.trickScores?.stunt >= 5000 },
      { id: 'xt550', name: 'XT-550 Rally', condition: () => this.data.bestFinish?.baja?.time < 180 } // Sub-3min in baja
    ];
    
    for (const unlock of unlocks) {
      if (!this.data.unlockedBikes.includes(unlock.id)) {
        if (unlock.condition()) {
          this.unlockItem(unlock.id, unlock.name);
        }
      }
    }
  }

  /**
   * Unlock a bike or item
   */
  static unlockItem(itemId, itemName) {
    if (!this.data.unlockedBikes.includes(itemId)) {
      this.data.unlockedBikes.push(itemId);
      
      console.log(`🔓 UNLOCKED: ${itemName} (${itemId})`);
      
      // Trigger notification UI event
      if (typeof UI !== 'undefined') {
        UI.showUnlockNotification(itemName, itemId);
      }
    }
  }

  /**
   * Get current career stats
   */
  static getStats() {
    return {
      totalRaces: this.data?.totalRaces || 0,
      racesWon: this.data?.racesWon || 0,
      racesPodium: this.data?.racesPodium || 0,
      totalEarnings: this.data?.totalEarnings || 0,
      currentMoney: this.data?.currentMoney || 0,
      unlockedBikes: this.data?.unlockedBikes || ['mx450'],
      lastPlayed: this.data?.lastPlayed
    };
  }

  /**
   * Reset career to defaults
   */
  static reset() {
    this.data = {...DEFAULT_CAREER};
    saveCareerData(this.data);
    console.log('🔄 Career reset — all progress cleared');
  }

  /**
   * Update settings
   */
  static updateSettings(newSettings) {
    if (!this.data.settings) {
      this.data.settings = {...DEFAULT_CAREER.settings};
    }
    
    Object.assign(this.data.settings, newSettings);
    saveCareerData(this.data);
  }

  /**
   * Get current settings
   */
  static getSettings() {
    return this.data?.settings || {...DEFAULT_CAREER.settings};
  }
}

// Initialize career manager on module load
CareerManager.init();

/**
 * Export functions for external use
 */
export function loadCareer() {
  return CareerManager.getStats();
}

export function saveCareer(career) {
  if (career && typeof career === 'object') {
    // Merge with current career data
    Object.assign(CareerManager.data, career);
    saveCareerData(CareerManager.data);
  }
}

/**
 * Load career data from localStorage
 */
function loadCareerData() {
  try {
    const saved = localStorage.getItem('mx3d_career');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load career data:', error);
  }
  
  return null;
}

/**
 * Save career data to localStorage
 */
function saveCareerData(data) {
  try {
    localStorage.setItem('mx3d_career', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save career data:', error);
  }
}

export function calculateEarnings(position, mode = 'national') {
  switch (mode) {
    case 'national':
      switch (position) {
        case 1: return 2000;
        case 2: return 1200;
        case 3: return 700;
        default: return 300;
      }
    case 'stunt':
      // Stunt mode earnings based on trick score (simplified)
      return Math.floor(Math.random() * 500) + 100;
    case 'baja':
      // Baja mode earnings based on completion time
      return Math.floor(Math.random() * 800) + 200;
    case 'enduro':
      // Enduro earnings based on consistency
      return Math.floor(Math.random() * 600) + 150;
    case 'supercross':
      switch (position) {
        case 1: return 3000;
        case 2: return 1800;
        case 3: return 900;
        default: return 400;
      }
    default:
      return 100; // Base minimum earnings
  }
}

export function getTotalTime() {
  const stats = CareerManager.getStats();
  const totalLaps = stats.totalRaces * 3; // Assuming average 3 laps per race
  return Math.floor(totalLaps * 60); // Rough estimate of total time in seconds
}
