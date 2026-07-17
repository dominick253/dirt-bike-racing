/**
 * AI Opponent System — Track-following bots with speed variation
 */

import * as THREE from 'three';

export interface AIState {
  position: THREE.Vector3;
  speed: number;
  angle: number;
  trackProgress: number;
  color: number;
}

export class AIController {
  private opponents: AIState[];
  private trackRadius: number;
  private trackWidth: number;

  constructor(trackRadius: number = 50, trackWidth: number = 12) {
    this.trackRadius = trackRadius;
    this.trackWidth = trackWidth;
    this.opponents = [];
    this.createOpponents();
  }

  private createOpponents(): void {
    const colors = [0x0070d1, 0xe22718, 0xf4b400];
    const speeds = [0.7, 0.85, 1.0];
    const offsets = [-4, 0, 4];

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      this.opponents.push({
        position: new THREE.Vector3(
          Math.cos(angle) * (this.trackRadius + offsets[i]),
          2,
          Math.sin(angle) * (this.trackRadius + offsets[i])
        ),
        speed: speeds[i],
        angle: angle,
        trackProgress: 0,
        color: colors[i],
      });
    }
  }

  update(delta: number, trackRadius: number): void {
    this.trackRadius = trackRadius;
    for (const opp of this.opponents) {
      opp.angle += opp.speed * delta * 0.5;
      opp.trackProgress += opp.speed * delta;

      const x = Math.cos(opp.angle) * this.trackRadius;
      const z = Math.sin(opp.angle) * this.trackRadius;
      opp.position.x = x;
      opp.position.z = z;
      // Get terrain height for AI position
      opp.position.y = this.getTerrainHeight(x, z);
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    // Simple height estimation matching terrain system
    // (In production, pass terrain reference or use shared height function)
    return 2 + Math.sin(x * 0.1) * 2 + Math.cos(z * 0.08) * 1.5;
  }

  getOpponents(): AIState[] {
    return this.opponents;
  }

  getPosition(index: number): THREE.Vector3 {
    return this.opponents[index]?.position.clone() ?? new THREE.Vector3();
  }

  getSpeed(index: number): number {
    return this.opponents[index]?.speed ?? 0;
  }

  getPositionRelative(bikeX: number, bikeZ: number): { x: number; z: number; dist: number } {
    const opp = this.opponents[0];
    const dx = opp.position.x - bikeX;
    const dz = opp.position.z - bikeZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return { x: dx, z: dz, dist };
  }

  getRacePosition(bikeX: number, bikeZ: number): number {
    let ahead = 0;
    for (const opp of this.opponents) {
      const bikeDist = Math.sqrt(bikeX * bikeX + bikeZ * bikeZ);
      const oppDist = Math.sqrt(opp.position.x * opp.position.x + opp.position.z * opp.position.z);
      const bikeAngle = Math.atan2(bikeZ, bikeX);
      const oppAngle = Math.atan2(opp.position.z, opp.position.x);
      const angleDiff = Math.abs(this.normalizeAngle(oppAngle - bikeAngle));
      if (angleDiff < Math.PI) {
        ahead++;
      }
    }
    return ahead + 1;
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }
}
