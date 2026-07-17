/**
 * Audio System — Web Audio API procedural audio
 */

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private initialized: boolean = false;

  constructor() {}

  private init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      // Audio not available
    }
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5): void {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCountdownBeep(count: number): void {
    if (count > 0) {
      this.playTone(440, 0.2, 'square', 0.4);
    } else {
      this.playTone(880, 0.4, 'square', 0.5);
    }
  }

  playClick(): void {
    this.playTone(1200, 0.05, 'sine', 0.3);
  }

  playLanding(velocity: number): void {
    const vol = Math.min(0.6, Math.abs(velocity) * 0.05);
    this.playTone(80 + Math.abs(velocity) * 10, 0.3, 'sawtooth', vol);
  }

  playEngine(rpm: number): void {
    if (!this.initialized) {
      this.initEngine();
    }
    if (this.engineOsc && this.engineGain && this.ctx) {
      const freq = 40 + rpm * 0.8;
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.01);
      this.engineGain.gain.setTargetAtTime(Math.min(0.15, rpm * 0.0003), this.ctx.currentTime, 0.01);
    }
  }

  private initEngine(): void {
    if (!this.ctx || !this.masterGain) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 40;
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 500;
    this.engineGain.gain.value = 0;
    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();
  }

  stopEngine(): void {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = volume * 0.3;
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
