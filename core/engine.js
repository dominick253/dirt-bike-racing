/**
 * Game Engine — Central lifecycle, scene management, state machine
 */

import { simplex } from './noise.js'; // Simplex noise utility

// Constants
const MAX_SPEED = 30; // units/sec (~108 km/h game speed)
const ACCELERATION = 15;
const BRAKE_FORCE = 20;
const TURN_RATE = 2.5;
const FRICTION = 0.95;
const GRAVITY = -30;

export class GameEngine {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.bikeSpeed = 0;
    this.raceStartTime = performance.now();
    this.lapCount = 0;
    this.checkpointsPassed = new Set();
    this.gameState = 'title'; // title, countdown, racing, ended
    this.currentMode = null;
    this._setupEventListeners();
  }

  update(dt) {
    if (this.gameState !== 'racing') return;
    
    // Update race time
    const elapsed = (performance.now() - this.raceStartTime) / 1000;
    
    // Update bike physics (delegated to physics system)
    // This is called each frame
    
    // Update camera to follow bike
    CameraSystem.update(dt);
    
    // Update particles
    ParticleSystem.update(dt);
  }

  startRace(mode) {
    this.currentMode = mode;
    this.gameState = 'countdown';
    CountdownSystem.start(3, () => {
      this.gameState = 'racing';
      getGameModeLogic(mode).onStart();
    });
  }

  finishRace(position, time) {
    this.gameState = 'ended';
    
    // Update career stats
    const earnings = EarningsManager.calculateEarnings(position, this.currentMode);
    CareerManager.addResult(this.currentMode, position, time, earnings);
    
    // Show results screen
    UI.showResults({
      mode: this.currentMode,
      position,
      time,
      earnings,
      totalTime: CareerManager.getTotalTime()
    });
  }

  _setupEventListeners() {
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    document.addEventListener('keydown', (e) => {
      if (!started && this.gameState === 'title') {
        startGame();
      }
    });
  }

  setBikeSpeed(speed) {
    this.bikeSpeed = speed;
  }

  getBikeSpeed() {
    return Math.abs(this.bikeSpeed);
  }
}

// Simplex noise implementation for terrain generation
class SimplexNoise {
  constructor(seed) {
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    this.p = [];
    for (let i=0; i<256; i++) {
      this.p[i] = i;
    }
    
    // Shuffle with seed
    let s = seed;
    for (let i=255; i>0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    
    this.perm = new Array(512);
    for (let i=0; i<512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  dot(g, x, y) {
    return g[0]*x + g[1]*y;
  }

  noise2D(xin, yin) {
    const F2 = 0.5*(Math.sqrt(3)-1);
    const G2 = (3-Math.sqrt(3))/6;
    
    const s = (xin+yin)*F2;
    const i = Math.floor(xin+s);
    const j = Math.floor(yin+s);
    const t = (i+j)*G2;
    const x0 = xin-(i-t);
    const y0 = yin-(j-t);
    
    let i1=0, j1=0;
    if(x0>y0) { i1=1; j1=0; } else { i1=0; j1=1; }
    
    const x1=x0-i1+G2, y1=y0-j1+G2;
    const x2=x0-1+2*G2, y2=y0-1+2*G2;
    
    const ii=i&255, jj=j&255;
    const gi0=this.perm[ii+this.perm[jj]]%12;
    const gi1=this.perm[ii+i1+this.perm[jj+j1]]%12;
    const gi2=this.perm[ii+1+this.perm[jj+1]]%12;
    
    let n0=0, n1=0, n2=0;
    
    let t0=0.5-x0*x0-y0*y0;
    if(t0>=0) {
      t0*=t0;
      n0=t0*t0*this.dot(this.grad3[gi0],x0,y0);
    }
    
    let t1=0.5-x1*x1-y1*y1;
    if(t1>=0) {
      t1*=t1;
      n1=t1*t1*this.dot(this.grad3[gi1],x1,y1);
    }
    
    let t2=0.5-x2*x2-y2*y2;
    if(t2>=0) {
      t2*=t2;
      n2=t2*t2*this.dot(this.grad3[gi2],x2,y2);
    }
    
    return 70*(n0+n1+n2);
  }

  fbm(x, y, octaves=6) {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for(let i=0; i<octaves; i++) {
      sum += this.noise2D(x*frequency, y*frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return sum / maxValue;
  }
}

// Export noise instance for terrain generation
export const simplex = new SimplexNoise(42);

// Game state management
export function startGame() {
  if (started) return;
  started = true;
  
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('hud').classList.add('active');
  document.getElementById('minimap-container').style.display = 'block';
  document.getElementById('state-bar').classList.add('active');
}

// Countdown timer for race start
export function countdown(startCount, onComplete) {
  const display = document.getElementById('countdown-display');
  let count = startCount;
  
  function updateCountdown() {
    if (count <= 0) {
      display.textContent = 'GO!';
      display.classList.add('show');
      
      setTimeout(() => {
        display.classList.remove('show');
        onComplete();
      }, 1000);
    } else {
      display.textContent = count.toString();
      display.classList.add('show');
      
      setTimeout(() => {
        display.classList.remove('show');
        count--;
        updateCountdown();
      }, 1000);
    }
  }
  
  updateCountdown();
}

// Terrain height calculation (using simplex noise)
export function getTerrainHeight(x, z) {
  let h = simplex.fbm(x*0.008, z*0.008, 6, 2.0, 0.5)*30;
  h += simplex.fbm(x*0.02+100, z*0.02+100, 4, 2.0, 0.5)*8;
  h += simplex.fbm(x*0.06+200, z*0.06+200, 3, 2.0, 0.5)*2;
  
  // Track shaping
  const distFromCenter = Math.sqrt(x*x + z*z);
  const trackRadius = TRACK_RADIUS;
  const trackWidth = TRACK_WIDTH;
  const distToTrack = Math.abs(distFromCenter - trackRadius);
  
  if (distToTrack < trackWidth) {
    const blend = 1 - distToTrack/trackWidth;
    const smoothBlend = blend*blend*(3-2*blend);
    h = h*(1-smoothBlend) + 5*smoothBlend;
  }
  
  // Jump ramps
  const angle = Math.atan2(z, x);
  const jumpHeight = Math.sin(angle * 3) * Math.max(0, 1 - distToTrack/(trackWidth*1.5));
  h += jumpHeight * 6;
  
  return h;
}

// Terrain normal for physics
export function getTerrainNormal(x, z) {
  const eps = WORLD_SIZE / TERRAIN_RES * 0.5;
  const hL = getTerrainHeight(x-eps, z);
  const hR = getTerrainHeight(x+eps, z);
  const hD = getTerrainHeight(x, z-eps);
  const hU = getTerrainHeight(x, z+eps);
  
  return new THREE.Vector3(hL-hR, 2*eps, hD-hU).normalize();
}
