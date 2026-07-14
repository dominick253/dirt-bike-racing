/**
 * Particle Manager — Dust, sparks, tire smoke, landing impacts
 */

// ==================== PARTICLE TYPES ====================
const PARTICLE_TYPES = {
  DUST: 'dust',
  SPARKS: 'sparks',
  TIRE_SMOKE: 'tire_smoke',
  LANDING_DUST: 'landing_dust'
};

// ==================== PARTICLE POOL ====================
const particles = []; // Active particles
let dustLimit = 200; // Max simultaneous dust particles
let sparkLimit = 50; // Max sparks at once
let smokeLimit = 100; // Max tire smoke simultaneously

/**
 * Particle class — manages individual particle state
 */
class Particle {
  constructor(type, position, velocity, properties) {
    this.type = type;
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.life = properties.lifetime || 2.0;
    this.maxLife = this.life;
    this.size = properties.size || 0.3;
    this.decay = properties.decay || 1;
    this.material = this._createMaterial(properties);
    this.mesh = new THREE.Mesh(this._getGeometry(type, this.size), this.material);
    this.mesh.position.copy(this.position);
    
    // Rotation for visual variety (dust/sparks)
    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    
    // Gravity for some particles
    this.hasGravity = properties.hasGravity ?? true;
    this.gravity = properties.gravity || -9.81;
  }

  _getGeometry(type, size) {
    switch (type) {
      case PARTICLE_TYPES.DUST:
      case PARTICLE_TYPES.LANDING_DUST:
        // Dust — larger, irregular shapes using instanced approach later
        return new THREE.PlaneGeometry(size * 2, size * 2);
      
      case PARTICLE_TYPES.SPARKS:
        // Sparks — small bright points
        return new THREE.SphereGeometry(size * 0.15, 4, 3);
      
      case PARTICLE_TYPES.TIRE_SMOKE:
        // Tire smoke — larger translucent puffs
        return new THREE.SphereGeometry(size * 1.2, 6, 5);
      
      default:
        return new THREE.PlaneGeometry(size, size);
    }
  }

  _createMaterial(properties) {
    const color = properties.color || 0x8b7355; // Default brown (dirt)
    const opacity = properties.opacity ?? 0.6;
    
    let transparent = true;
    let blending = THREE.NormalBlending;
    let depthWrite = true;
    
    switch (this.type) {
      case PARTICLE_TYPES.SPARKS:
        transparent = false;
        blending = THREE.AdditiveBlending;
        depthWrite = false;
        break;
      
      case PARTICLE_TYPES.TIRE_SMOKE:
        transparent = true;
        opacity *= 0.4; // Smoke is more transparent
        depthWrite = false;
        break;
      
      case PARTICLE_TYPES.LANDING_DUST:
        opacity *= 0.8; // Landing dust is thicker
        break;
    }
    
    return new THREE.MeshBasicMaterial({
      color,
      transparent,
      opacity,
      blending,
      depthWrite,
      side: THREE.DoubleSide
    });
  }

  update(dt) {
    this.life -= dt;
    
    if (this.life <= 0) {
      return false; // Dead
    }
    
    // Update position based on velocity and gravity
    if (this.hasGravity) {
      this.velocity.y += this.gravity * dt;
    }
    
    // Add air resistance to velocity
    this.velocity.multiplyScalar(1 - 0.5 * dt);
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    
    // For dust and smoke, expand over time
    const lifeRatio = this.life / this.maxLife;
    const expansionFactor = 1 + (1 - lifeRatio) * 0.5; // Grow up to 50% as it dies
    
    // Update mesh position and scale
    this.mesh.position.copy(this.position);
    
    // Scale based on life and type
    let scale = expansionFactor * this.decay;
    if (this.type === PARTICLE_TYPES.TIRE_SMOKE) {
      scale *= 1.5 + (1 - lifeRatio) * 2; // Smoke expands more as it rises
    }
    this.mesh.scale.setScalar(Math.max(scale, 0.1)); // Prevent negative scale
    
    // Rotate for dust/sparks visual interest
    if (this.type === PARTICLE_TYPES.SPARKS || this.type === PARTICLE_TYPES.DUST) {
      this.mesh.rotation.x += this.rotationSpeed.x * dt;
      this.mesh.rotation.y += this.rotationSpeed.y * dt;
      this.mesh.rotation.z += this.rotationSpeed.z * dt;
    }
    
    // Update material opacity based on life (fade out)
    this.material.opacity = (lifeRatio * (this.type === PARTICLE_TYPES.TIRE_SMOKE ? 0.4 : 0.8));
    
    // For dust/sparks, fade to transparent at end of life
    if (this.life < this.maxLife * 0.3) {
      this.material.opacity *= (this.life / (this.maxLife * 0.3));
    }
    
    return true; // Still alive
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

// ==================== EMITTER FUNCTIONS ====================

/**
 * Emit dust particles behind a moving bike
 */
export function emitDust(position, speedRatio = 0.5) {
  if (particles.filter(p => p.type === PARTICLE_TYPES.DUST).length >= dustLimit) return;
  
  const count = Math.floor(1 + speedRatio * 2); // 1-3 particles per call
  
  for (let i = 0; i < count; i++) {
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2, // Slight random spread
      Math.random() * 1.5 + 0.5, // Upward motion
      (Math.random() - 0.5) * 2
    );
    
    // Add some backward bias relative to bike direction (if available)
    if (typeof Game !== 'undefined' && Game.engine?.bikeState) {
      const heading = Game.engine.bikeState.heading;
      velocity.z += Math.cos(heading) * speedRatio * 2;
      velocity.x += Math.sin(heading) * speedRatio * 2;
    }
    
    const particle = new Particle(PARTICLE_TYPES.DUST, position, velocity, {
      size: 0.2 + Math.random() * 0.3,
      lifetime: 1.5 + Math.random() * 1.5, // 1.5-3 seconds
      decay: 0.8 + Math.random() * 0.4, // Varying decay rate
      color: new THREE.Color().setHSL(0.07, 0.3 + Math.random() * 0.2, 0.3 + Math.random() * 0.2) // Dirt-like colors
    });
    
    Game.scene.add(particle.mesh);
    particles.push(particle);
  }
}

/**
 * Emit sparks from wheel-ground contact (hard landing or scraping)
 */
export function emitSparks(position, count = 5) {
  const existingSparks = particles.filter(p => p.type === PARTICLE_TYPES.SPARKS).length;
  if (existingSparks >= sparkLimit) return;
  
  for (let i = 0; i < Math.min(count, sparkLimit - existingSparks); i++) {
    // Sparks shoot outward from contact point with some upward velocity
    const angle = Math.random() * Math.PI * 2; // Random direction around contact
    const speed = 3 + Math.random() * 5; // Fast initial speed
    
    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
      2 + Math.random() * 4, // Upward component
      Math.sin(angle) * speed * (0.5 + Math.random() * 0.5)
    );
    
    const particle = new Particle(PARTICLE_TYPES.SPARKS, position.clone(), velocity, {
      size: 0.1 + Math.random() * 0.15, // Small sparks
      lifetime: 0.3 + Math.random() * 0.7, // Short-lived (sparks fly out fast)
      decay: 1, // No size decay for sparks
      hasGravity: true,
      gravity: -15, // Stronger gravity for sparks
      color: new THREE.Color().setHSL(
        Math.random() * 0.1 + 0.05, // Orange-yellow range (0.05-0.15)
        1, // Full saturation
        0.7 + Math.random() * 0.3 // Brightness
      )
    });
    
    Game.scene.add(particle.mesh);
    particles.push(particle);
  }
}

/**
 * Emit tire smoke during wheelies or hard acceleration
 */
export function emitTireSmoke(position, density = 1) {
  const existingSmokes = particles.filter(p => p.type === PARTICLE_TYPES.TIRE_SMOKE).length;
  if (existingSmokes >= smokeLimit) return;
  
  const count = Math.floor(density * 3); // 0-3 smokes per call based on density
  
  for (let i = 0; i < count; i++) {
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5, // Minimal horizontal movement
      Math.random() * 2 + 1, // Rise upward quickly
      (Math.random() - 0.5) * 0.5
    );
    
    const particle = new Particle(PARTICLE_TYPES.TIRE_SMOKE, position.clone(), velocity, {
      size: 0.4 + Math.random() * 0.6, // Larger puffs
      lifetime: 2 + Math.random() * 3, // Longer lasting (dissipates slowly)
      decay: 0.7 + Math.random() * 0.3, // Moderate decay
      hasGravity: false, // Smoke rises due to heat but we model upward velocity instead
      color: new THREE.Color(0x888888).lerp(new THREE.Color(0xcccccc), Math.random() * 0.5) // Grey smoke
    });
    
    Game.scene.add(particle.mesh);
    particles.push(particle);
  }
}

/**
 * Emit landing dust cloud — big burst on hard landing
 */
export function emitLandingDust(position, impactStrength = 1) {
  const existingDust = particles.filter(p => p.type === PARTICLE_TYPES.LANDING_DUST).length;
  const count = Math.floor(5 + impactStrength * 10); // 5-15 dust puffs on landing
  
  for (let i = 0; i < Math.min(count, dustLimit - existingDust); i++) {
    // Dust spreads outward in a ring pattern on landing
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const distance = Math.random() * 3; // Spread across ~6m diameter
    
    const velocity = new THREE.Vector3(
      Math.cos(angle) * (1 + Math.random() * 2), // Outward horizontal speed
      Math.random() * 3, // Upward burst
      Math.sin(angle) * (1 + Math.random() * 2)
    );
    
    const particle = new Particle(PARTICLE_TYPES.LANDING_DUST, position.clone(), velocity, {
      size: 0.3 + Math.random() * 0.5, // Larger dust puffs
      lifetime: 2 + Math.random() * 1.5, // Longer lasting impact dust
      decay: 0.6 + Math.random() * 0.4, // Varying dissipation rates
      color: new THREE.Color(0x8b7355).lerp(new THREE.Color(0x6b5b3a), Math.random() * 0.3) // Rich dirt tones
    });
    
    Game.scene.add(particle.mesh);
    particles.push(particle);
  }
}

// ==================== UPDATE & CLEANUP ====================

/**
 * Update all active particles and clean up dead ones
 */
export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    const alive = particle.update(dt);
    
    if (!alive) {
      // Remove from scene and clean up resources
      Game.scene.remove(particle.mesh);
      particle.dispose();
      particles.splice(i, 1);
    }
  }
  
  // Hard limit enforcement (cleanup oldest if over limit)
  _enforceLimits();
}

/**
 * Enforce particle type limits by removing oldest particles
 */
function _enforceLimits() {
  const dustParticles = particles.filter(p => p.type === PARTICLE_TYPES.DUST);
  const landingDustParticles = particles.filter(p => p.type === PARTICLE_TYPES.LANDING_DUST);
  
  // Combine dust types for limit
  if (dustParticles.length + landingDustParticles.length > dustLimit) {
    const totalDust = [...dustParticles, ...landingDustParticles];
    // Remove oldest particles until under limit
    while (totalDust.length > dustLimit && particles.length > 0) {
      const oldest = totalDust.shift();
      const index = particles.indexOf(oldest);
      if (index !== -1) {
        Game.scene.remove(oldest.mesh);
        oldest.dispose();
        particles.splice(index, 1);
      }
    }
  }
}

/**
 * Clear all particles from scene
 */
export function clearAllParticles() {
  for (const particle of particles) {
    Game.scene.remove(particle.mesh);
    particle.dispose();
  }
  particles.length = 0; // Empty the array
}
