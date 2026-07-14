/**
 * Weather System — Day/night cycle, rain particles, dynamic lighting
 */

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.5; // 0=midnight, 0.5=noon, 1=midnight
    this.dayDuration = 60 * 60; // seconds for full day cycle (1 hour real time)
    this.rainIntensity = 0;
    this.rainParticles = null;
    this.sunMesh = null;
    this.lights = { ambient: null, directional: null, hemisphere: null };
    this.fogColor = new THREE.Color(0x8ab4c8);
  }

  init(sceneLights) {
    this.lights = sceneLights;
    
    // Create rain particle system
    const rainGeo = new THREE.BufferGeometry();
    const rainCount = 3000;
    const positions = new Float32Array(rainCount * 3);
    const velocities = new Float32Array(rainCount);
    
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200; // x
      positions[i * 3 + 1] = Math.random() * 100; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
      velocities[i] = 80 + Math.random() * 40; // fall speed
    }
    
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const rainMat = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.3,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainVelocities = velocities;
    this.rainCount = rainCount;
    this.scene.add(this.rainParticles);
    this.rainParticles.visible = false;
  }

  update(dt) {
    // Update time of day (0 to 1 cycle per dayDuration)
    this.timeOfDay = (this.timeOfDay + dt / this.dayDuration) % 1;
    
    // Update sun position based on time
    if (this.lights.directional) {
      const angle = (this.timeOfDay - 0.25) * Math.PI * 2;
      const height = Math.sin(angle);
      const x = Math.cos(angle) * 100;
      const y = Math.max(height * 200, 10);
      
      this.lights.directional.position.set(x, y, 80);
      
      // Sun visibility and intensity based on time
      const dayFactor = Math.max(0, height);
      this.lights.directional.intensity = dayFactor * 1.5;
      
      if (this.sunMesh) {
        this.sunMesh.position.set(x, y, 80);
        this.sunMesh.material.opacity = dayFactor;
        this.sunMesh.visible = dayFactor > 0.1;
      }
    }
    
    // Update ambient light based on time
    if (this.lights.ambient) {
      const nightFactor = 1 - Math.max(0, Math.sin((this.timeOfDay - 0.25) * Math.PI * 2));
      this.lights.ambient.intensity = 0.6 + nightFactor * 0.3; // Brighter at night for visibility
      
      // Change ambient color from blue (day) to deeper blue (night)
      const dayColor = new THREE.Color(0x6688aa);
      const nightColor = new THREE.Color(0x334455);
      this.lights.ambient.color.copy(dayColor.clone().lerp(nightColor, nightFactor * 0.7));
    }
    
    // Update fog color to match sky at current time
    if (this.scene.fog) {
      const dayFactor = Math.max(0, Math.sin((this.timeOfDay - 0.25) * Math.PI * 2));
      const dayFogColor = new THREE.Color(0x8ab4c8);
      const nightFogColor = new THREE.Color(0x1a2a3a);
      this.scene.fog.color.copy(dayFogColor.clone().lerp(nightFogColor, 1 - dayFactor));
    }
    
    // Update rain particles
    if (this.rainParticles && this.rainIntensity > 0) {
      this._updateRain(dt);
    } else {
      this.rainParticles.visible = false;
    }
  }

  _updateRain(dt) {
    this.rainParticles.visible = true;
    this.rainParticles.material.opacity = this.rainIntensity * 0.6;
    
    const positions = this.rainParticles.geometry.attributes.position.array;
    
    for (let i = 0; i < this.rainCount; i++) {
      // Update position based on velocity
      positions[i * 3 + 1] -= this.rainVelocities[i] * dt; // Move down
      
      // Reset particles that go below ground
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3] = (Math.random() - 0.5) * 200; // Random x
        positions[i * 3 + 1] = 80 + Math.random() * 20; // High up
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // Random z
      }
    }
    
    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }

  setRainIntensity(intensity) {
    this.rainIntensity = Math.max(0, Math.min(1, intensity));
  }

  getTimeString() {
    const hours = Math.floor(this.timeOfDay * 24);
    const minutes = Math.floor((this.timeOfDay * 24 - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getDayPhase() {
    if (this.timeOfDay >= 0.7 || this.timeOfDay < 0.1) return 'night';
    if (this.timeOfDay < 0.3) return 'morning';
    if (this.timeOfDay < 0.5) return 'afternoon';
    if (this.timeOfDay < 0.7) return 'evening';
    return 'unknown';
  }
}
