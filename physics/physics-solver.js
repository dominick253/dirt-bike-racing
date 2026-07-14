/**
 * Physics Solver — Bike dynamics, terrain collision, suspension
 */

import { getTerrainHeight, getTerrainNormal } from '../core/engine.js';
import { WHEEL_R, BIKE_MASS } from '../config/constants.js';

// Global bike physics state
export const bikeState = {
  pos: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  heading: 0, // rotation around Y axis
  pitch: 0,   // tilt forward/back (wheelie)
  lean: 0,    // tilt left/right (cornering)
  onGround: true,
  wheelRotation: 0,
  enginePower: 0,
  steerInput: 0,
  throttleInput: 0,
  brakeInput: 0,
  suspensionCompression: 0
};

// Constants loaded from config
const WORLD_SIZE = 600;
const TRACK_RADIUS = 170;
const TRACK_WIDTH = 18;
const MAX_SPEED = 30; // ~108 km/h in game units
const ACCEL_POWER = 25;
const BRAKE_FORCE = 30;
const GRIP_FACTOR = 0.12;

export function initBike() {
  const startX = TRACK_RADIUS + WORLD_SIZE/2; // Start on east side of track
  const startZ = 0;
  const startY = getTerrainHeight(startX, startZ) + WHEEL_R + 2;
  
  bikeState.pos.set(startX, startY, startZ);
  bikeState.vel.set(0, 0, 0);
  bikeState.heading = -Math.PI / 2; // Face south along track
  bikeState.pitch = 0;
  bikeState.lean = 0;
  bikeState.onGround = true;
  
  return { 
    x: startX, y: startY, z: startZ,
    vx: 0, vy: 0, vz: 0, heading: -Math.PI/2 
  };
}

export function updatePhysics(dt, input) {
  if (!bikeState.onGround) {
    // Air physics
    bikeState.vel.y += -30 * dt; // Gravity in air
    bikeState.lean *= 0.95; // Dampen lean in air
    
    if (input.steer !== 0 && Math.abs(bikeState.vel.length()) < 1) {
      bikeState.heading += input.steer * 2 * dt;
    }
    
    if (input.wheelie) {
      bikeState.pitch -= 3 * dt;
    }
    if (input.compression) {
      bikeState.pitch += 2 * dt;
    }
    
    // Clamp pitch in air
    bikeState.pitch = Math.max(-0.8, Math.min(0.8, bikeState.pitch));
  } else {
    // Ground physics
    updateGroundPhysics(dt, input);
  }
  
  // Update position
  bikeState.pos.add(bikeState.vel.clone().multiplyScalar(dt));
  
  // Wheel rotation visual (for rendering)
  const speed = Math.abs(bikeState.vel.length());
  if (speed > 0.1) {
    bikeState.wheelRotation += speed * dt * 5;
  }
  
  // Check terrain collision (ground check)
  const groundY = getTerrainHeight(bikeState.pos.x, bikeState.pos.z);
  const bikeBottomY = bikeState.pos.y - WHEEL_R;
  
  if (bikeBottomY <= groundY + 0.5) {
    if (!bikeState.onGround && Math.abs(bikeState.vel.y) > 3) {
      // Landing impact — emit particles
      emitDustParticles(bikeState.pos.x, groundY + 0.5, bikeState.pos.z, 
        Math.min(Math.abs(bikeState.vel.y) * 0.3, 1));
    }
    
    // Snap to ground
    bikeState.pos.y = groundY + WHEEL_R + 0.5;
    bikeState.vel.y = 0;
    bikeState.onGround = true;
    
    // Get terrain normal and adjust heading toward slope
    const normal = getTerrainNormal(bikeState.pos.x, bikeState.pos.z);
    const groundAngle = Math.atan2(normal.x, normal.z);
    const angleDiff = groundAngle - bikeState.heading;
    bikeState.lean += angleDiff * 0.15;
    
    // Bounce dampening on landing
    if (bikeState.vel.y < -1) {
      bikeState.vel.y *= 0.3; // Absorb most of vertical impact
    }
  } else {
    bikeState.onGround = false;
  }
  
  // World bounds
  const distFromCenter = Math.sqrt(bikeState.pos.x ** 2 + bikeState.pos.z ** 2);
  if (distFromCenter > WORLD_SIZE * 0.42) {
    const angleToCenter = Math.atan2(-bikeState.pos.x, -bikeState.pos.z);
    bikeState.vel.x += Math.sin(angleToCenter) * 8 * dt;
    bikeState.vel.z += Math.cos(angleToCenter) * 8 * dt;
  }
  
  // Fall death (respawn)
  if (bikeState.pos.y < groundY - 15) {
    respawnBike();
  }
  
  // Update camera target to follow bike
  CameraSystem.setTarget(bikeState.pos);
}

function updateGroundPhysics(dt, input) {
  const speed = Math.abs(bikeState.vel.length());
  
  // Acceleration/braking along heading direction
  if (input.throttle > 0 && speed < MAX_SPEED * 1.1) {
    const accelVec = new THREE.Vector3(
      Math.sin(bikeState.heading),
      0,
      Math.cos(bikeState.heading)
    ).normalize();
    
    bikeState.vel.add(accelVec.multiplyScalar(input.throttle * ACCEL_POWER * dt));
    
    // Dust while accelerating on dirt
    if (speed > 3 && input.throttle > 0.5) {
      emitDustParticles(bikeState.pos.x, getTerrainHeight(bikeState.pos.x, bikeState.pos.z), 
        bikeState.pos.z + 1, Math.min(speed / MAX_SPEED, 1));
    }
  }
  
  if (input.brake > 0) {
    const moveDir = new THREE.Vector3(
      Math.sin(bikeState.heading),
      0,
      Math.cos(bikeState.heading)
    );
    
    const dot = bikeState.vel.dot(moveDir);
    if (dot > 0.5) {
      bikeState.vel.add(moveDir.clone().multiplyScalar(-BRAKE_FORCE * input.brake * dt));
    } else {
      // Reverse when stopped or going backward
      bikeState.vel.add(moveDir.clone().multiplyScalar(-ACCEL_POWER * 0.4 * input.brake * dt));
    }
  }
  
  // Speed limiting (top speed)
  if (speed > MAX_SPEED) {
    const dir = bikeState.vel.clone().normalize();
    const limitedSpeed = MAX_SPEED;
    bikeState.vel.copy(dir.multiplyScalar(limitedSpeed));
  }
  
  // Steering
  let steerEffect = 0;
  if (input.steer !== 0 && speed > 0.5) {
    const speedFactor = Math.max(0.4, 1 - (speed / MAX_SPEED) * 0.6);
    steerEffect = input.steer * speedFactor;
    bikeState.heading += steerEffect * dt * 2.5;
    
    // Visual lean into turn
    bikeState.lean += input.steer * Math.min(speed / 15, 3) * dt;
  }
  
  // Grip — blend velocity toward heading direction (tire traction)
  const headingDir = new THREE.Vector3(
    Math.sin(bikeState.heading),
    0,
    Math.cos(bikeState.heading)
  ).normalize();
  
  if (bikeState.onGround) {
    // How much does our velocity align with heading?
    const currentHeading = Math.atan2(bikeState.vel.x, bikeState.vel.z);
    const headingDiff = bikeState.heading - currentHeading;
    
    // Apply grip force toward heading direction
    bikeState.vel.x += (headingDir.x * speed - bikeState.vel.x) * GRIP_FACTOR;
    bikeState.vel.z += (headingDir.z * speed - bikeState.vel.z) * GRIP_FACTOR;
    
    // Tilt bike with heading direction changes
    if (Math.abs(steerEffect) > 0.1 && input.brake === 0) {
      // Lean forward when braking, back when accelerating
      bikeState.pitch += steerEffect * 0.1;
    }
  }
  
  // Friction on ground
  bikeState.vel.x *= Math.pow(0.98, dt * 60);
  bikeState.vel.z *= Math.pow(0.98, dt * 60);
  
  // Clamp lean angle
  bikeState.lean = Math.max(-1.2, Math.min(1.2, bikeState.lean));
  bikeState.pitch = Math.max(-0.6, Math.min(0.6, bikeState.pitch));
}

export function respawnBike() {
  const x = bikeState.pos.x;
  const z = bikeState.pos.z;
  const startAngle = Math.atan2(z, x);
  
  // Find nearest checkpoint or default to track start
  const trackX = TRACK_RADIUS * Math.cos(startAngle) + WORLD_SIZE/2;
  const trackZ = TRACK_RADIUS * Math.sin(startAngle);
  
  bikeState.pos.set(trackX, getTerrainHeight(trackX, trackZ) + WHEEL_R + 3, trackZ);
  bikeState.vel.set(0, 0, 0);
  bikeState.heading = -Math.PI/2; // Reset to facing south
  bikeState.pitch = 0;
  bikeState.lean = 0;
  bikeState.onGround = true;
}

export function getBikeSpeed() {
  return Math.abs(bikeState.vel.length());
}

export function getBikePosition() {
  return bikeState.pos.clone();
}

// Dust particle emission
function emitDustParticles(x, y, z, intensity) {
  if (intensity < 0.1) return;
  
  for (let i = 0; i < Math.floor(intensity * 5); i++) {
    const position = new THREE.Vector3(
      x + (Math.random() - 0.5) * 2,
      y + Math.random(),
      z + (Math.random() - 0.5) * 2
    );
    
    ParticleManager.emitDust(position, intensity);
  }
}
