/**
 * Clock System Tests
 * Red/Green TDD: Write failing tests, then make them pass
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Clock } from '../src/core/clock';

describe('Clock', () => {
  let clock: Clock;

  beforeEach(() => {
    clock = new Clock();
  });

  it('should return non-negative delta time on first call', () => {
    const delta = clock.getDelta();
    expect(delta >= 0).toBe(true);
  });

  it('should return consistent delta time for rapid calls', () => {
    const delta1 = clock.getDelta();
    const delta2 = clock.getDelta();
    expect(delta1 >= 0).toBe(true);
    expect(delta2 >= 0).toBe(true);
  });

  it('should cap delta time at 50ms', () => {
    const originalLastTime = clock.getLastTime();
    clock.setLastTime(Date.now() / 1000 - 0.1);
    
    const delta = clock.getDelta();
    
    expect(delta).toBeLessThanOrEqual(0.05);
    expect(delta >= 0).toBe(true);
    
    clock.setLastTime(originalLastTime);
  });

  it('should reset clock correctly', () => {
    clock.setLastTime(Date.now() / 1000 - 0.5);
    clock.getDelta();
    
    clock.reset();
    
    const elapsed = clock.getElapsed();
    const cappedDelta = clock.getCappedDelta();
    
    expect(elapsed).toBe(0);
    expect(cappedDelta).toBe(0);
  });

  it('should return non-negative delta after reset', () => {
    clock.reset();
    const delta = clock.getDelta();
    expect(delta >= 0).toBe(true);
  });
});
