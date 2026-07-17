/**
 * Simplex Noise Implementation
 * Based on Stefan Gustavson's Simplex Noise algorithm
 */

export class NoiseGenerator {
  private permutation: number[];
  private lut: number[];

  constructor(seed: number = 42) {
    this.permutation = this.generatePermutation(seed);
    this.lut = this.buildLUT(this.permutation);
  }

  private generatePermutation(seed: number): number[] {
    const perm = new Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const extended = new Array(512);
    for (let i = 0; i < 512; i++) extended[i] = perm[i & 255];
    return extended;
  }

  private buildLUT(perm: number[]): number[] {
    const lut = new Array(512);
    for (let i = 0; i < 512; i++) lut[i] = perm[i & 255];
    return lut;
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let val0 = this.contrib(ii + this.lut[jj + this.lut[ii + 0]], x0, y0);
    let val1 = this.contrib(ii + i1 + this.lut[jj + j1 + this.lut[ii + 0]], x1, y1);
    let val2 = this.contrib(ii + 1 + this.lut[jj + 1 + this.lut[ii + 0]], x2, y2);
    return 70.0 * (val0 + val1 + val2);
  }

  private contrib(i: number, x: number, y: number): number {
    const h = this.lut[i & 511];
    const ix = h & 127;
    const gradx = (ix & 12) / 8.0 - 1.5;
    const grady = (ix & 1) / 8.0 - 0.5;
    let val = (gradx * x + grady * y);
    let t = 6.0 - x * x - y * y;
    if (t < 0) return 0.0;
    t *= t;
    val *= t * t;
    return val;
  }

  fbm2D(x: number, y: number, octaves: number = 5, persistence: number = 0.5): number {
    let total = 0.0;
    let frequency = 1.0;
    let amplitude = 1.0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      frequency *= 2;
      amplitude *= persistence;
    }
    return total;
  }

  getTerrainHeight(x: number, z: number): number {
    const height1 = this.fbm2D(x * 0.01, z * 0.008, 5, 0.5) * 20;
    const height2 = this.fbm2D(x * 0.05, z * 0.04, 3, 0.5) * 8;
    const height3 = this.fbm2D(x * 0.1, z * 0.08, 2, 0.5) * 3;
    return height1 + height2 + height3;
  }
}
