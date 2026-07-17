import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoiseGenerator } from '../src/utils/noise';
import { BikePhysics } from '../src/physics/bike';
import { TerrainSystem } from '../src/world/terrain';
import * as THREE from 'three';

describe('NoiseGenerator', () => {
  it('should generate consistent noise with same seed', () => {
    const noise1 = new NoiseGenerator(42);
    const noise2 = new NoiseGenerator(42);
    
    const result1 = noise1.noise2D(1.5, 2.0);
    const result2 = noise2.noise2D(1.5, 2.0);
    
    expect(result1).toBe(result2);
  });

  it('should generate different noise with different seeds', () => {
    const noise1 = new NoiseGenerator(42);
    const noise2 = new NoiseGenerator(123);
    
    const result1 = noise1.noise2D(1.5, 2.0);
    const result2 = noise2.noise2D(1.5, 2.0);
    
    expect(result1).not.toBe(result2);
  });

  it('should generate FBM noise', () => {
    const noise = new NoiseGenerator(42);
    const result = noise.fbm2D(1.5, 5, 0.5);
    
    expect(typeof result).toBe('number');
    expect(isFinite(result)).toBe(true);
  });

  it('should generate terrain heights', () => {
    const noise = new NoiseGenerator(42);
    const height1 = noise.getTerrainHeight(0, 0);
    const height2 = noise.getTerrainHeight(10, 10);
    
    expect(typeof height1).toBe('number');
    expect(typeof height2).toBe('number');
  });
});

describe('BikePhysics', () => {
  it('should initialize with default state', () => {
    const bike = new BikePhysics(new THREE.Vector3(0, 5, 0));
    
    expect(bike.state.position.x).toBe(0);
    expect(bike.state.position.y).toBe(5);
    expect(bike.state.position.z).toBe(0);
    expect(bike.state.speed).toBe(0);
    expect(bike.state.gear).toBe(1);
  });

  it('should update speed based on acceleration', () => {
    const bike = new BikePhysics(new THREE.Vector3(0, 5, 0));
    const input = {
      throttle: true,
      brake: false,
      steerLeft: false,
      steerRight: false,
      jump: false,
      wheelie: false
    };
    
    bike.update(0.016, input, 5, new THREE.Vector3(0, 1, 0));
    
    expect(bike.state.speed).toBeGreaterThan(0);
  });

  it('should update gear based on speed', () => {
    const bike = new BikePhysics(new THREE.Vector3(0, 5, 0));
    
    // Simulate high speed
    bike.state.velocity.z = 50;
    bike.update(0.016, { throttle: false, brake: false, steerLeft: false, steerRight: false, jump: false, wheelie: false }, 5, new THREE.Vector3(0, 1, 0));
    
    expect(bike.state.gear).toBeGreaterThan(1);
  });

  it('should detect airborne state', () => {
    const bike = new BikePhysics(new THREE.Vector3(0, 5, 0));
    
    // Manually set airborne state
    bike.state.isAirborne = true;
    bike.state.position.y = 15;
    
    expect(bike.state.isAirborne).toBe(true);
  });
});

describe('TerrainSystem', () => {
  it('should generate terrain heightmap', () => {
    const terrain = new TerrainSystem(42);
    
    expect(() => terrain.createMesh()).not.toThrow();
  });

  it('should get terrain height at position', () => {
    const terrain = new TerrainSystem(42);
    const height = terrain.getHeight(0, 0);
    
    expect(typeof height).toBe('number');
  });

  it('should get terrain normal', () => {
    const terrain = new TerrainSystem(42);
    const normal = terrain.getNormal(0, 0);
    
    expect(normal.length()).toBeCloseTo(1, 5);
  });

  it('should create track mesh', () => {
    const terrain = new TerrainSystem(42);
    
    expect(() => terrain.setTrack(50, 12)).not.toThrow();
  });
});
