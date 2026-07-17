/**
 * Clock System
 * Manages delta time, frame timing, and time cap to prevent physics spiral
 */

export class Clock {
  private lastTime: number = 0;
  private elapsed: number = 0;
  private cappedDelta: number = 0;
  private readonly MAX_DELTA: number = 0.05; // 50ms cap
  private initialized: boolean = false;

  constructor() {
    // Use Date.now() as fallback for headless browser environments
    // where performance.now() may return 0 on first call
    this.lastTime = Date.now() / 1000;
    this.initialized = true;
  }

  /**
   * Get capped delta time in seconds
   */
  getDelta(): number {
    const now = performance.now() / 1000;
    const rawDelta = now - this.lastTime;
    this.lastTime = now;
    
    // Only add to elapsed if we have a valid delta
    if (this.initialized) {
      this.elapsed += rawDelta;
    } else {
      this.elapsed = 0;
      this.initialized = true;
    }
    
    // Cap delta to prevent physics spiral on tab switch
    this.cappedDelta = Math.min(Math.abs(rawDelta), this.MAX_DELTA);
    
    return this.cappedDelta;
  }

  /**
   * Get total elapsed time in seconds
   */
  getElapsed(): number {
    return this.elapsed;
  }

  /**
   * Reset clock
   */
  reset(): void {
    this.lastTime = Date.now() / 1000;
    this.elapsed = 0;
    this.cappedDelta = 0;
    this.initialized = true;
  }

  /**
   * Get current capped delta
   */
  getCappedDelta(): number {
    return this.cappedDelta;
  }

  /**
   * Set last time manually (for testing)
   */
  setLastTime(time: number): void {
    this.lastTime = time;
  }

  /**
   * Get last time (for testing)
   */
  getLastTime(): number {
    return this.lastTime;
  }
}
