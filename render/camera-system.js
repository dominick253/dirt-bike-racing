/**
 * Camera System — Follow-cam with multiple modes, shake, and dynamic FOV
 */

// ==================== CAMERA STATE ====================
const cameraState = {
  mode: 'chase', // 'chase' | 'cinematic' | 'cockpit'
  followTarget: new THREE.Vector3(), // Position to follow
  offsetDistance: 8, // Distance behind bike
  offsetHeight: 3.5, // Height above bike
  smoothness: 0.08, // Camera lerp speed (lower = smoother/slower)
  shakeIntensity: 0, // Current shake amplitude
  shakeDecay: 0.92, // Shake decay per frame
  fov: 60, // Current field of view
  targetFov: 60, // Target FOV for transitions
  aspectRatio: 1, // Aspect ratio for projection
  isLocked: false, // Pointer lock state
  yaw: 0, // Camera rotation angle around bike (chase mode)
  pitch: 0.2, // Vertical angle offset (cinematic)
  targetSpeed: 0, // Current bike speed for dynamic FOV
  maxSpeedFov: 78, // Max FOV at top speed
  minSpeedFov: 60, // Base FOV at low speeds
  cinematicTransition: 0, // Smooth transition progress
  cinematicMode: false
};

// ==================== CAMERA CONSTANTS ====================
const DEFAULTS = {
  chaseDistance: 8,
  chaseHeight: 3.5,
  chaseSmoothness: 0.08,
  cinematicDistance: 12,
  cinematicHeight: 5,
  cockpitHeight: 1.2,
  fovBase: 60,
  fovHighSpeed: 78,
  shakeMaxIntensity: 2.5,
  shakeDecayRate: 0.92
};

export class CameraSystem {
  static scene = null;
  static camera = null;
  static target = new THREE.Vector3(); // Position to follow
  static initialized = false;

  /**
   * Initialize the camera system
   */
  static init(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.target.copy(cameraState.followTarget);
    this.initialized = true;
    
    // Apply default settings
    this.setMode('chase');
    
    console.log('🎥 Camera system initialized — mode:', this.state.mode);
  }

  /**
   * Set camera mode (chase, cinematic, cockpit)
   */
  static setMode(mode) {
    if (!['chase', 'cinematic', 'cockpit'].includes(mode)) return;
    
    cameraState.cinematicMode = false;
    cameraState.mode = mode;
    
    switch (mode) {
      case 'chase':
        this.setFollowParams(DEFAULTS.chaseDistance, DEFAULTS.chaseHeight, DEFAULTS.chaseSmoothness);
        break;
      case 'cinematic':
        this.setFollowParams(DEFAULTS.cinematicDistance, DEFAULTS.cinematicHeight, 0.05); // Smoother for cinematic
        break;
      case 'cockpit':
        this.setFollowParams(2, DEFAULTS.cockpitHeight, 0.15); // Closer, tighter tracking
        break;
    }
    
    console.log(`📷 Camera mode switched to: ${mode}`);
  }

  /**
   * Switch to cinematic mode with smooth transition
   */
  static startCinematic(targetPos) {
    this.setMode('cinematic');
    this.target.copy(targetPos);
    cameraState.cinematicMode = true;
    cameraState.cinematicTransition = 0;
    
    console.log('🎬 Cinematic mode activated');
  }

  /**
   * End cinematic mode, return to previous mode
   */
  static endCinematic(previousMode) {
    if (previousMode) {
      this.setMode(previousMode);
    } else {
      this.setMode('chase');
    }
    cameraState.cinematicMode = false;
    console.log('🎬 Cinematic mode ended, returned to:', this.state.mode);
  }

  /**
   * Update camera position and orientation every frame
   */
  static update(dt) {
    if (!this.camera || !this.target) return;
    
    // Dynamic FOV based on speed
    this.updateFov();
    
    // Apply shake decay
    cameraState.shakeIntensity *= Math.pow(cameraState.shakeDecay, dt * 60);
    if (cameraState.shakeIntensity < 0.01) {
      cameraState.shakeIntensity = 0;
    }
    
    // Calculate camera position based on mode
    switch (cameraState.mode) {
      case 'chase':
        this.updateChaseCamera(dt);
        break;
      case 'cinematic':
        this.updateCinematicCamera(dt);
        break;
      case 'cockpit':
        this.updateCockpitCamera();
        break;
    }
    
    // Apply camera shake if any
    if (cameraState.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * cameraState.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * cameraState.shakeIntensity;
      this.camera.position.z += (Math.random() - 0.5) * cameraState.shakeIntensity;
    }
    
    // Update projection matrix with current aspect and FOV
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.fov = cameraState.fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Chase camera — standard follow-behind view
   */
  static updateChaseCamera(dt) {
    // Position behind bike based on heading
    const heading = this.getBikeHeading();
    
    // Calculate offset position behind bike
    const offsetX = -Math.sin(heading) * cameraState.offsetDistance;
    const offsetZ = -Math.cos(heading) * cameraState.offsetDistance;
    
    const targetX = this.target.x + offsetX;
    const targetY = this.target.y + cameraState.offsetHeight;
    const targetZ = this.target.z + offsetZ;
    
    // Smoothly interpolate to target position
    const smoothFactor = 1 - Math.pow(1 - cameraState.smoothness, dt * 60);
    
    this.camera.position.x += (targetX - this.camera.position.x) * smoothFactor;
    this.camera.position.y += (targetY - this.camera.position.y) * smoothFactor;
    this.camera.position.z += (targetZ - this.camera.position.z) * smoothFactor;
    
    // Look ahead of bike position for dynamic feel
    const lookAheadX = this.target.x + Math.sin(heading) * 5;
    const lookAheadY = this.target.y + 1.5;
    const lookAheadZ = this.target.z + Math.cos(heading) * 5;
    
    this.camera.lookAt(lookAheadX, lookAheadY, lookAheadZ);
  }

  /**
   * Cinematic camera — slower, wider arc around bike
   */
  static updateCinematicCamera(dt) {
    // Add slow orbit to cinematic view
    const orbitSpeed = 0.3; // radians per second
    const currentTime = performance.now() / 1000;
    
    const offsetX = Math.sin(currentTime * orbitSpeed) * cameraState.offsetDistance;
    const offsetZ = Math.cos(currentTime * orbitSpeed) * cameraState.offsetDistance;
    
    const targetX = this.target.x + offsetX;
    const targetY = this.target.y + cameraState.offsetHeight;
    const targetZ = this.target.z + offsetZ;
    
    // Very smooth interpolation for cinematic feel
    const smoothFactor = 1 - Math.pow(0.95, dt * 60);
    
    this.camera.position.x += (targetX - this.camera.position.x) * smoothFactor;
    this.camera.position.y += (targetY - this.camera.position.y) * smoothFactor;
    this.camera.position.z += (targetZ - this.camera.position.z) * smoothFactor;
    
    // Always look at bike center for dramatic framing
    this.camera.lookAt(this.target.x, this.target.y + 1, this.target.z);
  }

  /**
   * Cockpit camera — mounted on rider's helmet
   */
  static updateCockpitCamera() {
    const heading = this.getBikeHeading();
    
    // Position at rider's head position (slightly above and forward)
    const cockpitOffsetX = Math.sin(heading) * 0.5;
    const cockpitOffsetY = 1.2;
    const cockpitOffsetZ = Math.cos(heading) * 0.5;
    
    this.camera.position.set(
      this.target.x + cockpitOffsetX,
      this.target.y + cockpitOffsetY,
      this.target.z + cockpitOffsetZ
    );
    
    // Look directly ahead from rider's perspective
    const lookX = this.target.x + Math.sin(heading) * 10;
    const lookY = this.target.y + 0.5;
    const lookZ = this.target.z + Math.cos(heading) * 10;
    
    this.camera.lookAt(lookX, lookY, lookZ);
  }

  /**
   * Get bike heading angle from velocity or rotation
   */
  static getBikeHeading() {
    // Try to get from physics state (assuming Game.bikeState exists)
    if (typeof Game !== 'undefined' && Game.engine?.bikeState) {
      return Game.engine.bikeState.heading || 0;
    }
    
    // Fallback: calculate heading from velocity vector
    const vel = this.camera.position.clone().sub(this.target);
    if (vel.length() > 0.1) {
      return Math.atan2(vel.x, vel.z);
    }
    
    // Default: facing south
    return -Math.PI / 2;
  }

  /**
   * Update FOV based on bike speed for motion effect
   */
  static updateFov() {
    const speed = this.getBikeSpeed();
    const maxSpeed = Game?.engine?.getMaxSpeed?.() || MAX_SPEED_KMH / 3.6;
    
    // Map speed to FOV range with smoothing
    if (maxSpeed > 0) {
      const speedRatio = Math.min(speed / maxSpeed, 1);
      cameraState.targetFov = DEFAULTS.fovBase + speedRatio * (DEFAULTS.fovHighSpeed - DEFAULTS.fovBase);
      
      // Smooth FOV transition
      cameraState.fov += (cameraState.targetFov - cameraState.fov) * 0.05;
    } else {
      // Fade back to base FOV when stopped
      cameraState.fov += (DEFAULTS.fovBase - cameraState.fov) * 0.1;
    }
  }

  /**
   * Trigger screen shake on impact/landing
   */
  static triggerShake(intensity) {
    if (intensity > 0 && intensity <= DEFAULTS.shakeMaxIntensity) {
      cameraState.shakeIntensity = intensity;
    }
  }

  /**
   * Get current bike speed in m/s
   */
  static getBikeSpeed() {
    if (typeof Game !== 'undefined' && Game.engine?.getBikeSpeed) {
      return Game.engine.getBikeSpeed();
    }
    
    // Fallback: estimate from distance to camera over time
    // This would need timestamp tracking, simplified here
    return 0;
  }

  /**
   * Set follow target position (called by physics update)
   */
  static setTarget(pos) {
    this.target.copy(pos);
  }

  /**
   * Switch to mode and save previous for cinematic return
   */
  static switchMode(mode, fromCinematic = false) {
    const prevMode = cameraState.mode;
    
    if (fromCinematic) {
      this.endCinematic(prevMode);
    } else {
      this.setMode(mode);
    }
  }

  /**
   * Toggle between chase and cockpit views
   */
  static toggleCamera() {
    if (cameraState.mode === 'chase') {
      this.setMode('cockpit');
    } else if (cameraState.mode === 'cockpit') {
      this.setMode('chase');
    }
  }

  /**
   * Check current camera mode for UI display
   */
  static getMode() {
    return cameraState.mode;
  }
}
