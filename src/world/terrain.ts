/**
 * Terrain System — FBM noise heightmap + track carving
 */

import * as THREE from 'three';
import { NoiseGenerator } from '../utils/noise';

export class TerrainSystem {
  private noise: NoiseGenerator;
  private readonly gridSize: number = 200;
  private readonly worldSize: number = 200;
  private heightData: Float32Array;
  private trackRadius: number = 50;
  private trackWidth: number = 12;

  constructor(seed: number = 42) {
    this.noise = new NoiseGenerator(seed);
    this.heightData = new Float32Array(this.gridSize * this.gridSize);
    this.generateTerrain();
  }

  getTrackRadius(): number {
    return this.trackRadius;
  }

  getTrackWidth(): number {
    return this.trackWidth;
  }

  setTrack(radius: number, width: number): void {
    this.trackRadius = radius;
    this.trackWidth = width;
    this.carveTrack();
  }

  private generateTerrain(): void {
    for (let z = 0; z < this.gridSize; z++) {
      for (let x = 0; x < this.gridSize; x++) {
        const worldX = (x / this.gridSize) * this.worldSize - this.worldSize / 2;
        const worldZ = (z / this.gridSize) * this.worldSize - this.worldSize / 2;
        this.heightData[z * this.gridSize + x] = this.noise.getTerrainHeight(worldX, worldZ);
      }
    }
  }

  private carveTrack(): void {
    const halfW = Math.floor((this.trackWidth / 2) / this.worldSize * this.gridSize);
    for (let z = 0; z < this.gridSize; z++) {
      for (let x = 0; x < this.gridSize; x++) {
        const worldX = (x / this.gridSize) * this.worldSize - this.worldSize / 2;
        const worldZ = (z / this.gridSize) * this.worldSize - this.worldSize / 2;
        const dist = Math.sqrt(worldX * worldX + worldZ * worldZ);
        const diff = Math.abs(dist - this.trackRadius);
        if (diff < this.trackWidth / this.worldSize * this.gridSize / 2) {
          // Flatten track area
          const flatHeight = this.noise.getTerrainHeight(worldX, worldZ);
          const currentIdx = z * this.gridSize + x;
          this.heightData[currentIdx] = flatHeight;
        }
      }
    }
  }

  getHeight(x: number, z: number): number {
    const gridX = ((x + this.worldSize / 2) / this.worldSize) * this.gridSize;
    const gridZ = ((z + this.worldSize / 2) / this.worldSize) * this.gridSize;
    const ix = Math.floor(gridX);
    const iz = Math.floor(gridZ);
    if (ix < 0 || ix >= this.gridSize - 1 || iz < 0 || iz >= this.gridSize - 1) {
      return 0;
    }
    const fx = gridX - ix;
    const fz = gridZ - iz;
    const x1 = ix, x2 = ix + 1;
    const z1 = iz, z2 = iz + 1;
    const h1 = this.heightData[z1 * this.gridSize + x1];
    const h2 = this.heightData[z1 * this.gridSize + x2];
    const h3 = this.heightData[z2 * this.gridSize + x1];
    const h4 = this.heightData[z2 * this.gridSize + x2];
    const h12 = h1 * (1 - fx) + h2 * fx;
    const h34 = h3 * (1 - fx) + h4 * fx;
    return h12 * (1 - fz) + h34 * fz;
  }

  getNormal(x: number, z: number): THREE.Vector3 {
    const epsilon = 0.5;
    const hL = this.getHeight(x - epsilon, z);
    const hR = this.getHeight(x + epsilon, z);
    const hU = this.getHeight(x, z - epsilon);
    const hD = this.getHeight(x, z + epsilon);
    const left = new THREE.Vector3(-epsilon, hR - hL, 0);
    const down = new THREE.Vector3(0, hD - hU, -epsilon);
    return left.cross(down).normalize();
  }

  createMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.worldSize, this.worldSize,
      this.gridSize - 1, this.gridSize - 1
    );
    geometry.rotateX(-Math.PI / 2);
    const vertices = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      vertices[i + 1] = this.getHeight(x, z);
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a7d44,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    });
    return new THREE.Mesh(geometry, material);
  }

  createTrackMesh(): THREE.Mesh {
    const segments = 128;
    const radius = this.trackRadius;
    const width = this.trackWidth;
    const outerR = radius + width / 2;
    const innerR = radius - width / 2;

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Outer ring with terrain height
      const outerX = cos * outerR;
      const outerZ = sin * outerR;
      const outerY = this.getHeight(outerX, outerZ);
      vertices.push(outerX, outerY, outerZ);

      // Inner ring with terrain height
      const innerX = cos * innerR;
      const innerZ = sin * innerR;
      const innerY = this.getHeight(innerX, innerZ);
      vertices.push(innerX, innerY, innerZ);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geometry, material);
  }

  getTrackPosition(angle: number): { x: number; z: number } {
    return {
      x: Math.cos(angle) * this.trackRadius,
      z: Math.sin(angle) * this.trackRadius,
    };
  }

  getTrackAngle(angle: number): number {
    return angle + Math.PI / 2;
  }

  getTrackLength(): number {
    return 2 * Math.PI * this.trackRadius;
  }
}
