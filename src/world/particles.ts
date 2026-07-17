/**
 * Particle System — Object-pooled canvas 2D overlay
 */

import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  color: THREE.Color;
  size: number;
  active: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(scene: THREE.Scene, maxParticles: number = 300) {
    this.maxParticles = maxParticles;
    this.scene = scene;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2;pointer-events:none;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < maxParticles; i++) {
      this.particles.push(this.createInactiveParticle());
    }
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private createInactiveParticle(): Particle {
    return {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 0,
      maxLifetime: 1,
      color: new THREE.Color(0xffffff),
      size: 1,
      active: false,
    };
  }

  emit(position: THREE.Vector3, count: number = 5, color: THREE.Color = new THREE.Color(0x8B4513), upwardBias: boolean = true): void {
    let emitted = 0;
    for (const particle of this.particles) {
      if (emitted >= count) break;
      if (!particle.active) {
        this.activateParticle(particle, position, color, upwardBias);
        emitted++;
      }
    }
  }

  private activateParticle(particle: Particle, position: THREE.Vector3, color: THREE.Color, upwardBias: boolean): void {
    particle.active = true;
    particle.position.copy(position);
    particle.velocity.set(
      (Math.random() - 0.5) * 4,
      upwardBias ? Math.random() * 3 + 1 : (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 4
    );
    particle.lifetime = 0;
    particle.maxLifetime = 0.5 + Math.random() * 1.5;
    particle.color.copy(color);
    particle.size = 0.3 + Math.random() * 1.2;
  }

  update(delta: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.lifetime += delta;
      if (particle.lifetime >= particle.maxLifetime) {
        particle.active = false;
        continue;
      }
      particle.position.x += particle.velocity.x * delta;
      particle.position.y += particle.velocity.y * delta;
      particle.position.z += particle.velocity.z * delta;
      particle.velocity.y -= 2.0 * delta; // Gravity on particles
    }
    this.render();
  }

  render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Simple 3D-to-2D projection for particles
    for (const particle of this.particles) {
      if (!particle.active) continue;
      const lifeRatio = 1 - particle.lifetime / particle.maxLifetime;
      const alpha = lifeRatio * 0.8;
      if (alpha <= 0) continue;

      // Project to screen (simplified — just use position as screen coords for overlay)
      const x = (particle.position.x / 100 + 0.5) * w;
      const y = h - ((particle.position.y / 50 + 0.5) * h);
      const size = particle.size * lifeRatio * 8;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${Math.floor(particle.color.r * 255)},${Math.floor(particle.color.g * 255)},${Math.floor(particle.color.b * 255)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    for (const p of this.particles) p.active = false;
  }
}
