/**
 * Audio System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AudioSystem } from '../src/core/audio';

describe('AudioSystem', () => {
  let audio: AudioSystem;

  beforeEach(() => {
    audio = new AudioSystem();
  });

  it('should not throw on playTone when AudioContext unavailable', () => {
    expect(() => audio.playTone(440, 0.1)).not.toThrow();
  });

  it('should not throw on playClick', () => {
    expect(() => audio.playClick()).not.toThrow();
  });

  it('should not throw on playLanding', () => {
    expect(() => audio.playLanding(5.0)).not.toThrow();
  });

  it('should not throw on playEngine', () => {
    expect(() => audio.playEngine(3000)).not.toThrow();
  });

  it('should not throw on stopEngine', () => {
    expect(() => audio.stopEngine()).not.toThrow();
  });

  it('should not throw on setMasterVolume', () => {
    expect(() => audio.setMasterVolume(0.5)).not.toThrow();
  });

  it('should not throw on resume', () => {
    expect(() => audio.resume()).not.toThrow();
  });

  it('should not throw on playCountdownBeep', () => {
    expect(() => audio.playCountdownBeep(3)).not.toThrow();
    expect(() => audio.playCountdownBeep(0)).not.toThrow();
  });
});
