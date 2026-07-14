/**
 * Crash System — Detects crashes, handles rider ejection and respawn
 */

const crashState = {
  isCrashing: false,
  crashTimer: 0,
  crashDuration: 2.0, // seconds of crash sequence
  lastImpactVelocity: 0,
  maxSafeSpeed: 15, // m/s — above this triggers crash animation
};

export class CrashSystem {
  static scene = null;
  static bikeGroup = null;

  init(scene) {
    this.scene = scene;
  }

  /**
   * Check for crash conditions and return true if crashed
   */
  static checkForCrash(velocity, onGround, pitch, leanAngle) {
    const speed = velocity.length();
    
    // High-speed impact while on ground
    if (onGround && speed > CrashSystem.maxSafeSpeed) {
      const impactSeverity = (speed - CrashSystem.maxSafeSpeed) / CrashSystem.maxSafeSpeed;
      
      if (impactSeverity > 0.3 || Math.abs(pitch) > 1.0 || Math.abs(leanAngle) > 1.5) {
        CrashSystem.triggerCrash(velocity, impactSeverity);
        return true;
      }
    }
    
    // Rider off bike (extreme pitch or lean while airborne)
    if (!onGround && (Math.abs(pitch) > 2.0 || Math.abs(leanAngle) > 2.5)) {
      CrashSystem.triggerCrash(velocity, 1.0);
      return true;
    }
    
    // Landing crash (high vertical velocity)
    if (onGround && velocity.y < -8) {
      CrashSystem.triggerCrash(velocity, Math.min(1.5, Math.abs(velocity.y) / 10));
      return true;
    }
    
    return false;
  }

  /**
   * Trigger crash animation sequence
   */
  static triggerCrash(velocity, severity = 0.5) {
    if (crashState.isCrashing) return; // Already crashing
    
    crashState.isCrashing = true;
    crashState.crashTimer = crashState.crashDuration;
    crashState.lastImpactVelocity = velocity.length();
    
    console.log(`💥 CRASH! Severity: ${severity.toFixed(2)}, Speed: ${velocity.length().toFixed(1)} km/h`);
    
    // Emit sparks at impact point
    if (typeof emitSparks === 'function') {
      const position = new THREE.Vector3(0, 0.5, 0); // Impact at ground level
      emitSparks(position, Math.floor(severity * 10));
    }
    
    // Screen shake effect (via post effects if available)
    if (typeof PostEffects !== 'undefined' && PostEffects.triggerShake) {
      PostEffects.triggerShake(severity * 3);
    }
    
    // Emit landing dust
    if (typeof emitLandingDust === 'function') {
      const position = new THREE.Vector3(0, 0, 0);
      emitLandingDust(position, severity);
    }
  }

  /**
   * Update crash timer and state each frame
   */
  static update(dt) {
    if (!crashState.isCrashing) return;
    
    crashState.crashTimer -= dt;
    
    // Shake camera during crash sequence
    if (crashState.crashTimer > 0 && crashState.crashTimer < crashState.crashDuration * 0.5) {
      const shakeIntensity = (crashState.crashTimer / (crashState.crashDuration * 0.5)) * 1.5;
      if (typeof CameraSystem !== 'undefined' && CameraSystem.applyShake) {
        CameraSystem.applyShake(shakeIntensity);
      }
    }
    
    // End crash sequence
    if (crashState.crashTimer <= 0) {
      crashState.isCrashing = false;
      
      // Respawn bike if damaged too much
      const speedRatio = crashState.lastImpactVelocity / CrashSystem.maxSafeSpeed;
      if (speedRatio > 2.0) {
        console.log('🔄 Bike crashed — respawning...');
        respawnBike();
      }
      
      // Resume normal gameplay
      if (typeof UI !== 'undefined') {
        UI.updateHUD(0, { throttle: 0, brake: 0, steer: 0 });
      }
    }
  }

  /**
   * Check if currently in crash sequence
   */
  static isCurrentlyCrashing() {
    return crashState.isCrashing;
  }

  /**
   * Get crash severity for UI display
   */
  static getSeverity() {
    return crashState.lastImpactVelocity / CrashSystem.maxSafeSpeed;
  }

  /**
   * Reset all crash state (new race)
   */
  static reset() {
    crashState.isCrashing = false;
    crashState.crashTimer = 0;
    crashState.lastImpactVelocity = 0;
  }
}
