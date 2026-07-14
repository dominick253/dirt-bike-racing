/**
 * Save System — localStorage persistence for career data and settings
 */

// ==================== SAVE KEYS ====================
const KEYS = {
  CAREER: 'mx3d_career',
  SETTINGS: 'mx3d_settings',
  CONTROLS: 'mx3d_controls'
};

// Default values
const DEFAULTS = {
  career: {
    racesPlayed: 0,
    wins: 0,
    podiums: 0,
    totalEarnings: 0,
    unlockedBikes: ['mx450'],
    bestLapTimes: {},
    lastPlayDate: null
  },
  settings: {
    volume: 80,
    difficulty: 'normal', // easy, normal, hard
    cameraMode: 'chase', // chase, cinematic, cockpit
    postEffects: true,
    controls: {
      throttle: 'KeyW',
      brake: 'KeyS',
      steerLeft: 'KeyA',
      steerRight: 'KeyD',
      wheelie: 'Space',
      compression: 'ShiftLeft'
    }
  },
  controls: {
    keyboard: true,
    gamepad: false
  }
};

// ==================== SAVE/LOAD FUNCTIONS ====================

/**
 * Save career data to localStorage
 */
export function saveCareer(careerData) {
  try {
    const merged = { ...DEFAULTS.career, ...careerData };
    localStorage.setItem(KEYS.CAREER, JSON.stringify(merged));
    console.log('💾 Career saved');
  } catch (e) {
    console.error('Failed to save career:', e);
  }
}

/**
 * Load career data from localStorage
 */
export function loadCareer() {
  try {
    const saved = localStorage.getItem(KEYS.CAREER);
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULTS.career;
  } catch (e) {
    console.error('Failed to load career:', e);
    return DEFAULTS.career;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settingsData) {
  try {
    const merged = { ...DEFAULTS.settings, ...settingsData };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
    console.log('💾 Settings saved');
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Load settings from localStorage
 */
export function loadSettings() {
  try {
    const saved = localStorage.getItem(KEYS.SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULTS.settings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULTS.settings;
  }
}

/**
 * Save input configuration
 */
export function saveControls(controlData) {
  try {
    const merged = { ...DEFAULTS.controls, ...controlData };
    localStorage.setItem(KEYS.CONTROLS, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save controls:', e);
  }
}

/**
 * Load input configuration
 */
export function loadControls() {
  try {
    const saved = localStorage.getItem(KEYS.CONTROLS);
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULTS.controls;
  } catch (e) {
    console.error('Failed to load controls:', e);
    return DEFAULTS.controls;
  }
}

/**
 * Reset all saved data
 */
export function resetAll() {
  localStorage.removeItem(KEYS.CAREER);
  localStorage.removeItem(KEYS.SETTINGS);
  localStorage.removeItem(KEYS.CONTROLS);
  console.log('🔄 All saves cleared');
  return { ...DEFAULTS };
}

/**
 * Export save data as JSON (for backup)
 */
export function exportSave() {
  const career = loadCareer();
  const settings = loadSettings();
  const controls = loadControls();
  
  const exportData = {
    career,
    settings,
    controls,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import save data from JSON string (for restore)
 */
export function importSave(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.career) {
      localStorage.setItem(KEYS.CAREER, JSON.stringify(data.career));
    }
    if (data.settings) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.controls) {
      localStorage.setItem(KEYS.CONTROLS, JSON.stringify(data.controls));
    }
    
    console.log('📥 Save imported successfully');
    return true;
  } catch (e) {
    console.error('Failed to import save:', e);
    return false;
  }
}

/**
 * Get current timestamp for tracking play sessions
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}
