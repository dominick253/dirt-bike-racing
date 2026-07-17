/**
 * Minimap Renderer — Canvas 2D overlay showing bike + AI positions
 */

import * as THREE from 'three';

export class MinimapRenderer {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private trackRadius: number;
  private trackWidth: number;

  constructor(canvasId: string = 'minimap-canvas') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d')!;
    this.trackRadius = 50;
    this.trackWidth = 12;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  setTrack(radius: number, width: number): void {
    this.trackRadius = radius;
    this.trackWidth = width;
  }

  render(bikeX: number, bikeZ: number, aiPositions: { x: number; z: number; color: number }[]): void {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w / 2) / (this.trackRadius + this.trackWidth + 10);

    // Clear
    this.ctx.clearRect(0, 0, w, h);

    // Draw track ring
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);

    // Track surface
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.trackRadius + this.trackWidth / 2, 0, Math.PI * 2);
    this.ctx.arc(0, 0, this.trackRadius - this.trackWidth / 2, 0, Math.PI * 2, true);
    this.ctx.fillStyle = 'rgba(85, 85, 85, 0.8)';
    this.ctx.fill();

    // Track border
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.trackRadius + this.trackWidth / 2, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1 / scale;
    this.ctx.stroke();

    // Starting line
    this.ctx.beginPath();
    this.ctx.moveTo(this.trackRadius - this.trackWidth / 2, 0);
    this.ctx.lineTo(this.trackRadius + this.trackWidth / 2, 0);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2 / scale;
    this.ctx.stroke();

    // AI positions
    for (const ai of aiPositions) {
      const ax = Math.cos(ai.x / this.trackRadius * Math.PI * 2) * this.trackRadius;
      const az = Math.sin(ai.x / this.trackRadius * Math.PI * 2) * this.trackRadius;

      this.ctx.beginPath();
      this.ctx.arc(ax, az, 3 / scale, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgb(${(ai.color >> 16) & 0xff},${(ai.color >> 8) & 0xff},${ai.color & 0xff})`;
      this.ctx.fill();
    }

    // Bike position
    const bikeAngle = Math.atan2(bikeZ, bikeX);
    const bikeDist = Math.sqrt(bikeX * bikeX + bikeZ * bikeZ);
    const bx = Math.cos(bikeAngle) * bikeDist;
    const bz = Math.sin(bikeAngle) * bikeDist;

    // Bike trail
    this.ctx.beginPath();
    this.ctx.arc(bx, bz, 4 / scale, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0070d1';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5 / scale;
    this.ctx.stroke();

    // Direction indicator
    const dirLen = 8 / scale;
    this.ctx.beginPath();
    this.ctx.moveTo(bx, bz);
    this.ctx.lineTo(bx + Math.cos(bikeAngle) * dirLen, bz + Math.sin(bikeAngle) * dirLen);
    this.ctx.strokeStyle = 'rgba(0, 112, 209, 0.8)';
    this.ctx.lineWidth = 2 / scale;
    this.ctx.stroke();

    this.ctx.restore();
  }
}
