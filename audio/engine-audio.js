/**
 * Engine Audio — Procedural engine sounds via Web Audio API
 * RPM-based pitch modulation, load-dependent volume, exhaust effects
 */

class EngineAudio {
  constructor() {
    this.ctx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.filterNode = null;
    this.isPlaying = false;
    this.targetPitch = 100; // Base frequency in Hz
    this.currentPitch = 100;
    this.targetVolume = 0;
    this.currentVolume = 0;
    this.rpm = 0;
    this.maxRPM = 9500;
    this.idleRPM = 1200;
    this.redlineRPM = 9500;
    this.loadFactor = 0;
    
    // Secondary sounds
    this.windNoise = null;
    this.windGain = null;
    this.exhaustPop = false;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Main engine sound — sawtooth oscillator for aggressive tone
      this.oscillator = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();
      this.filterNode = this.ctx.createBiquadFilter();
      
      // Configure oscillator (sawtooth for authentic engine character)
      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.value = this.idleRPM / 60; // ~20 Hz base
      
      // Filter to shape the sound (lowpass to muffle harshness)
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 800;
      this.filterNode.Q.value = 2;
      
      // Gain for volume control
      this.gainNode.gain.value = 0;
      
      // Connect the chain: oscillator → filter → gain → output
      this.oscillator.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      
      // Start silent
      this.oscillator.start();
      this.isPlaying = true;
      
      // Add wind noise for high-speed effect
      this._initWindNoise();
      
      console.log('🔊 Engine audio initialized');
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  _initWindNoise() {
    // White noise buffer for wind effect
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds buffer
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // White noise
    }
    
    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = noiseBuffer;
    this.windNoise.loop = true;
    
    // Bandpass filter for wind character
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.value = 2000;
    this.filterNode.Q.value = 0.5;
    
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    
    this.windNoise.connect(this.filterNode);
    this.filterNode.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    this.windNoise.start();
  }

  /**
   * Update engine sound based on current bike state
   * @param {number} throttle - 0 to 1 (gas pedal position)
   * @param {number} speedKmH - Current speed in km/h
   */
  update(throttle, speedKmH) {
    if (!this.ctx || !this.isPlaying) return;
    
    // Calculate RPM based on speed and throttle
    const baseRPM = this.idleRPM + (speedKmH / MAX_SPEED_KMH) * (this.redlineRPM - this.idleRPM);
    const throttleBoost = throttle * 2000; // Extra RPM from throttle input
    
    this.rpm = Math.min(this.redlineRPM, baseRPM + throttleBoost);
    
    // Smooth pitch transition to target
    const targetPitch = (this.rpm / this.maxRPM) * 600; // Max 600 Hz for engine sound
    this.targetPitch = Math.max(20, Math.min(600, targetPitch));
    this.currentPitch += (this.targetPitch - this.currentPitch) * 0.1;
    
    // Update oscillator frequency
    if (this.oscillator) {
      this.oscillator.frequency.value = this.currentPitch;
    }
    
    // Volume increases with RPM and throttle presence
    const rpmRatio = this.rpm / this.redlineRPM;
    this.targetVolume = 0.15 + rpmRatio * 0.2 + throttle * 0.15;
    this.currentVolume += (this.targetVolume - this.currentVolume) * 0.1;
    
    // Apply volume with gain node (smooth transitions)
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.02);
    }
    
    // Filter frequency increases with RPM for more open sound
    if (this.filterNode && this.filterNode.type === 'lowpass') {
      const filterFreq = 400 + rpmRatio * 1500;
      this.filterNode.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.02);
    }
    
    // Wind noise increases with speed
    if (this.windGain) {
      const windLevel = Math.max(0, (speedKmH - 50) / MAX_SPEED_KMH) * 0.15;
      this.windGain.gain.setTargetAtTime(windLevel, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Simulate exhaust backfire/pop sound
   */
  popSound() {
    if (!this.ctx) return;
    
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    
    popOsc.type = 'square';
    popOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
    popOsc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    popGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    popGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    
    popOsc.start();
    popOsc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Play gear shift sound
   */
  shiftSound() {
    if (!this.ctx) return;
    
    const duration = 0.3;
    const now = this.ctx.currentTime;
    
    // Mechanical click sound using short noise burst
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      // Exponential decay noise burst
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Bandpass filter for mechanical character
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    source.start(now);
  }

  /**
   * Handle speed changes for gear shift detection
   */
  handleSpeedChange(oldRPM, newRPM) {
    if (this.rpm > this.redlineRPM * 0.95 && oldRPM < this.redlineRPM * 0.85) {
      // Likely upshift
      this.shiftSound();
    } else if (newRPM < this.idleRPM + 200 && oldRPM > this.idleRPM + 1000) {
      // Hard deceleration — possible exhaust pop
      if (Math.random() > 0.7) {
        this.popSound();
      }
    }
  }

  /**
   * Mute/unmute engine audio
   */
  toggleMute() {
    if (!this.gainNode) return;
    
    const isMuted = this.gainNode.gain.value < 0.01;
    
    if (isMuted) {
      this.gainNode.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    } else {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
    }
  }

  /**
   * Clean up audio resources
   */
  destroy() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
    }
    
    if (this.windNoise) {
      this.windNoise.stop();
      this.windNoise.disconnect();
    }
    
    this.ctx.close();
    this.isPlaying = false;
  }
}

// Global constants needed by engine audio
const MAX_SPEED_KMH = 280;
const IDLE_RPM = 1200;
const REDLINE_RPM = 9500;

export default EngineAudio;
