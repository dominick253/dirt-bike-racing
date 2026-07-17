/**
 * Bike Physics System — Throttle, brake, steer, suspension, air control
 */

import * as THREE from 'three';
import { InputState } from '../core/input';

export interface BikeState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  speed: number;
  gear: number;
  isAirborne: boolean;
  suspensionCompression: number;
  wheelRotation: number;
  rpm: number;
  leanAngle: number;
}

export class BikePhysics {
  public state: BikeState;
  private readonly GRAVITY: number = 9.81;
  private readonly MAX_SPEED: number = 180;
  private readonly ACCELERATION: number = 20;
  private readonly BRAKE_FORCE: number = 30;
  private readonly STEER_SPEED: number = 2.8;
  private readonly SUSPENSION_STIFFNESS: number = 15000;
  private readonly SUSPENSION_DAMPING: number = 1800;
  private readonly GEAR_RATIOS: number[] = [0, 3.8, 2.8, 2.1, 1.7, 1.4, 1.2];
  private lastGroundY: number = 0;
  private landingImpact: number = 0;

  constructor(initialPosition: THREE.Vector3 = new THREE.Vector3(0, 5, 0)) {
    this.state = {
      position: initialPosition.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: 0,
      speed: 0,
      gear: 1,
      isAirborne: false,
      suspensionCompression: 0,
      wheelRotation: 0,
      rpm: 800,
      leanAngle: 0,
    };
  }

  update(delta: number, input: InputState, terrainHeight: number, terrainNormal: THREE.Vector3): void {
    const pos = this.state.position;
    const vel = this.state.velocity;
    const onGround = pos.y >= terrainHeight - 0.5;

    if (onGround && !this.state.isAirborne) {
      pos.y = terrainHeight + 0.5;
      vel.y = 0;
    }

    if (onGround && this.state.isAirborne) {
      this.landingImpact = Math.abs(vel.y);
      this.state.isAirborne = false;
      this.state.suspensionCompression = Math.min(1, this.landingImpact * 0.1);
    }

    if (onGround) {
      this.state.isAirborne = false;
      this.state.suspensionCompression *= 0.9;
    } else {
      vel.y -= this.GRAVITY * delta;
      this.state.isAirborne = true;
    }

    const effectiveAccel = this.state.isAirborne ? this.ACCELERATION * 0.3 : this.ACCELERATION;
    if (input.throttle) {
      vel.z += effectiveAccel * delta;
    } else if (input.brake) {
      vel.z -= this.BRAKE_FORCE * delta;
    } else {
      vel.z *= (1 - 0.5 * delta);
    }

    const steerFactor = this.state.isAirborne ? 0.6 : 1.0;
    if (input.steerLeft) {
      this.state.rotation += this.STEER_SPEED * steerFactor * delta;
      this.state.leanAngle = Math.max(-0.5, this.state.leanAngle - 2.0 * delta);
    } else if (input.steerRight) {
      this.state.rotation -= this.STEER_SPEED * steerFactor * delta;
      this.state.leanAngle = Math.min(0.5, this.state.leanAngle + 2.0 * delta);
    } else {
      this.state.leanAngle *= (1 - 5.0 * delta);
    }

    const speedMs = Math.abs(vel.z);
    const maxSpeedMs = this.MAX_SPEED / 3.6;
    vel.z = Math.sign(vel.z) * Math.min(speedMs, maxSpeedMs);
    this.state.speed = Math.abs(vel.z) * 3.6;

    this.updateGear();
    this.state.rpm = 800 + this.state.speed * 40 + (this.state.isAirborne ? -2000 : 0);
    this.state.rpm = Math.max(800, Math.min(8000, this.state.rpm));

    // Move in the direction the bike is facing (tangent to circular track)
    const cos = Math.cos(this.state.rotation);
    const sin = Math.sin(this.state.rotation);
    // Bike's "forward" is along its local Z axis, rotated by heading
    pos.x += (vel.x * cos - vel.z * sin) * delta;
    pos.z += (vel.x * sin + vel.z * cos) * delta;
    this.state.wheelRotation += vel.z * delta * 3;

    const slopeAngle = Math.atan2(terrainNormal.y, Math.sqrt(terrainNormal.x * terrainNormal.x + terrainNormal.z * terrainNormal.z));
    this.state.rotation += slopeAngle * 0.1;
  }

  private updateGear(): void {
    const speedKmh = this.state.speed;
    if (speedKmh < 15) this.state.gear = 1;
    else if (speedKmh < 35) this.state.gear = 2;
    else if (speedKmh < 55) this.state.gear = 3;
    else if (speedKmh < 80) this.state.gear = 4;
    else if (speedKmh < 120) this.state.gear = 5;
    else this.state.gear = 6;
  }

  getPosition(): THREE.Vector3 {
    return this.state.position;
  }

  getSpeed(): number {
    return this.state.speed;
  }

  getRPM(): number {
    return this.state.rpm;
  }

  getGear(): number {
    return this.state.gear;
  }

  getLeanAngle(): number {
    return this.state.leanAngle;
  }

  getLandingImpact(): number {
    const impact = this.landingImpact;
    this.landingImpact = 0;
    return impact;
  }

  reset(position: THREE.Vector3): void {
    this.state.position.copy(position);
    this.state.velocity.set(0, 0, 0);
    this.state.rotation = 0;
    this.state.speed = 0;
    this.state.gear = 1;
    this.state.isAirborne = false;
    this.state.suspensionCompression = 0;
    this.state.wheelRotation = 0;
    this.state.rpm = 800;
    this.state.leanAngle = 0;
    this.landingImpact = 0;
  }
}
