/**
 * Constants — Central configuration for game physics, dimensions, colors
 */

// ==================== WORLD DIMENSIONS ====================
export const WORLD_SIZE = 600; // World radius in game units
export const TERRAIN_RES = 200; // Terrain mesh segments
export const TRACK_RADIUS = 170; // Main track circular path radius
export const TRACK_WIDTH = 18; // Track lane width

// ==================== BIKE PHYSICS ====================
export const WHEEL_R = 0.38; // Wheel radius in game units
export const BIKE_MASS = 180; // Motorcycle mass in kg
export const RIDER_MASS = 85; // Rider mass in kg
export const TOTAL_MASS = BIKE_MASS + RIDER_MASS; // Combined for physics

// Speed and force values
export const MAX_SPEED_KMH = 280; // Max speed in km/h (game units scaled)
export const MAX_SPEED_MS = MAX_SPEED_KMH / 3.6; // Max speed in m/s
export const ENGINE_POWER = 35; // Acceleration force units/sec²
export const BRAKE_FORCE = 25; // Deceleration force units/sec²
export const CLUTCH_FORCE = 8; // Reverse/reverse power
export const AERODYNAMIC_DRAG = 0.015; // Air resistance coefficient

// ==================== SUSPENSION ====================
export const SUSPENSION_STIFFNESS = 800; // Spring constant N/m (game units)
export const SUSPENSION_DAMPING = 45; // Shock absorber damping
export const MAX_SUSPENSION_TRAVEL = 0.4; // Max compression/extension in game units

// ==================== STEERING & GRIP ====================
export const MAX_STEER_ANGLE = 30 * (Math.PI / 180); // 30 degrees in radians
export const STEER_RATE = 2.5; // Degrees per second for steering response
export const TURN_RADIUS_FACTOR = 4; // Turn radius multiplier at max speed
export const GRIP_FACTOR_ONROAD = 0.92; // Tire grip on paved surfaces
export const GRIP_FACTOR_OFFROAD = 0.65; // Tire grip on dirt/grass
export const GRIP_FACTOR_MUD = 0.45; // Low grip terrain

// ==================== PHYSICS ====================
export const GRAVITY = -9.81 * 3; // Scaled gravity (game units/sec²)
export const AIR_RESISTANCE = 0.99; // Velocity multiplier per frame in air
export const GROUND_FRICTION = 0.95; // Rolling resistance per frame on ground
export const WIND_FORCE = { x: 0, y: 0, z: -2 }; // Default wind vector

// ==================== COLLISION & BOUNCE ====================
export const BOUNCE_COEFFICIENT_GROUND = 0.3; // Energy retained on ground impact
export const BOUNCE_COEFFICIENT_AIR = 0.6; // Energy retained on air landing
export const MAX_IMPACT_VELOCITY = 15; // Max safe landing speed (m/s)
export const RESPAWN_HEIGHT_LIMIT = -15; // Height below which bike respawns

// ==================== CAMERA SETTINGS ====================
export const CAMERA_DISTANCE_CHASE = 8; // Chase cam distance from bike
export const CAMERA_OFFSET_ABOVE = 3.5; // Camera height offset above bike
export const CAMERA_FOV_BASE = 60; // Base field of view angle
export const CAMERA_FOV_HIGH_SPEED = 78; // FOV at maximum speed (motion effect)
export const CAMERA_LERP_SMOOTHNESS = 0.08; // Smoothness of camera transitions
export const CAMERA_MIN_HEIGHT = -5; // Minimum camera Y position
export const CAMERA_MAX_DISTANCE = 20; // Maximum chase cam distance

// ==================== TRACK & RACING ====================
export const LAP_COUNT_NATIONAL = 3; // Default laps for national race
export const LAP_COUNT_ENDURO = 5; // Default laps for enduro challenge
export const CHECKPOINT_RADIUS = 15; // Checkpoint detection radius
export const START_LINE_WIDTH = 10; // Width of start/finish line area

// ==================== STUNT SYSTEM ====================
export const TRICK_THRESHOLD_AIRBORNE_TIME = 0.3; // Minimum air time for trick scoring (seconds)
export const POINTS_ROTATION_180 = 50; // Points for 180° rotation
export const POINTS_ROTATION_360 = 150; // Points for full rotation
export const POINTS_ROTATION_720 = 400; // Points for two rotations
export const POINTS_WHEELIE_DISTANCE = 100; // Points per 10m wheelie distance
export const POINTS_COMBO_MULTIPLIER = 1.5; // Multiplier for consecutive tricks

// ==================== BIKE UNLOCKS (career) ====================
export const INITIAL_EARNINGS = 500; // Starting cash in career mode
export const EARNINGS_BASE_RACE = {
  first: 2000, // First place prize
  second: 1200, // Second place prize
  third: 700, // Third place prize
  fourth: 300, // Fourth place prize
  fifth_or_below: 100 // Any other finish
};

export const UNLOCK_REQUIREMENTS = {
  zx250: { races: 3, earnings: 3000, description: "Win 3 races or earn $3000 total" },
  dr800: { races: 10, earnings: 10000, description: "Complete 10 races and earn $10k" },
  fx310: { tricks: 50, score: 5000, description: "Score 5000 trick points across runs" },
  xt550: { baya_wins: 5, time_bonus: 100, description: "Win 5 Baja runs with time bonus" }
};

// ==================== COLORS ====================
export const COLOR_ORANGE_PRIMARY = 0xff6a00;
export const COLOR_ORANGE_DARK = 0xcc4400;
export const COLOR_ORANGE_GLOW = 0xff4500;
export const COLOR_GREEN_BRIGHT = 0x00ff6a;
export const COLOR_YELLOW_WARNING = 0xffcc00;
export const COLOR_RED_CRITICAL = 0xff2200;

// Bike color schemes
export const BIKE_SCHEMES = {
  mx450: { frame: 0xcc2200, tank: 0xff4400, wheel: 0x1a1a1a, rim: 0xcccccc },
  zx250: { frame: 0x0066cc, tank: 0x0088ff, wheel: 0x111111, rim: 0xdddddd },
  dr800: { frame: 0xff6600, tank: 0xff8833, wheel: 0x222222, rim: 0xbbbbbb },
  fx310: { frame: 0x22aa44, tank: 0x44cc66, wheel: 0x151515, rim: 0xe0e0e0 },
  xt550: { frame: 0xff9900, tank: 0xffaa22, wheel: 0x181818, rim: 0xc8c8c8 }
};

// ==================== AUDIO SETTINGS ====================
export const ENGINE_MIN_RPM = 1200; // Idle RPM
export const ENGINE_MAX_RPM = 9500; // Redline RPM
export const ENGINE_PEAK_POWER_RPM = 7500; // Peak power RPM
export const GEAR_RATIO = {
  n: 0, // Neutral
  first: -4.5,
  second: -3.2,
  third: -2.4,
  fourth: -1.9,
  fifth: -1.6,
  sixth: -1.4,
  reverse: -5.5
};

// ==================== PARTICLE SYSTEM ====================
export const MAX_DUST_PARTICLES = 200; // Max dust particles in scene
export const MAX_SPARK_PARTICLES = 50; // Max spark particles in scene
export const MAX_TIRE_SMOKE_PARTICLES = 100; // Max tire smoke particles
export const DUST_LIFETIME_MIN = 1.5; // Minimum particle lifetime (seconds)
export const DUST_LIFETIME_MAX = 3.5; // Maximum particle lifetime

// ==================== SAVE SYSTEM ====================
export const SAVE_KEY_CAREER = 'mx3d_career_save';
export const SAVE_KEY_SETTINGS = 'mx3d_settings_save';
export const MAX_SAVE_SLOTS = 3; // Multiple save slot support

// ==================== PERFORMANCE ====================
export const TARGET_FRAME_RATE = 60; // Target FPS
export const MAX_FRAME_TIME_MS = 16.67; // ~60fps frame budget
export const PHYSICS_SUBSTEPS = 4; // Physics updates per frame for stability
export const PARTICLE_BATCH_SIZE = 50; // Particles emitted per batch

// ==================== AUDIO & VISUAL EFFECTS ====================
export const SCREEN_SHAKE_MAX_INTENSITY = 2.5; // Max camera shake on impact
export const SCREEN_SHAKE_DECAY = 0.92; // Shake intensity decay multiplier
export const LANDING_MIN_VELOCITY = 3; // Min velocity to trigger landing effects

// ==================== UI & HUD ====================
export const HUD_SPEED_DISPLAY_PRECISION = 0; // No decimal for km/h display
export const HUD_TIME_PRECISION_MS = 100; // Millisecond precision for timer
export const MINIMAP_ZOOM_FACTOR = 78 / TRACK_RADIUS; // Minimap scale factor
export const LAP_FLASH_DURATION_MS = 2000; // Duration of lap flash effect

console.log('🏁 MX3D Constants loaded —', Object.keys(constants).length, 'config values');
