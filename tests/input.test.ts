/**
 * Input System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InputSystem } from '../src/core/input';

describe('InputSystem', () => {
  let input: InputSystem;

  beforeEach(() => {
    input = new InputSystem();
  });

  it('should initialize with all inputs false', () => {
    const state = input.getState();
    expect(state.throttle).toBe(false);
    expect(state.brake).toBe(false);
    expect(state.steerLeft).toBe(false);
    expect(state.steerRight).toBe(false);
    expect(state.jump).toBe(false);
    expect(state.wheelie).toBe(false);
  });

  it('should detect W key as throttle', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    const state = input.getState();
    expect(state.throttle).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
  });

  it('should detect ArrowUp as throttle', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    const state = input.getState();
    expect(state.throttle).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
  });

  it('should detect S key as brake', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    const state = input.getState();
    expect(state.brake).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
  });

  it('should detect A key as steerLeft', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    const state = input.getState();
    expect(state.steerLeft).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
  });

  it('should detect D key as steerRight', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    const state = input.getState();
    expect(state.steerRight).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
  });

  it('should detect Space as jump', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    const state = input.getState();
    expect(state.jump).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
  });

  it('should reset all inputs', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    input.reset();
    const state = input.getState();
    expect(state.throttle).toBe(false);
  });

  it('should return a copy of state (not reference)', () => {
    const state1 = input.getState();
    const state2 = input.getState();
    expect(state1).not.toBe(state2);
  });
});
