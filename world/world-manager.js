/**
 * World Manager — Terrain, vegetation, sky, lighting, environment
 */

import { simplex } from '../core/engine.js';

const WORLD_SIZE = 600;
const TERRAIN_RES = 200;
const TRACK_RADIUS = 170;
const TRACK_WIDTH = 18;

/**
 * Get terrain height at any point using multi-octave simplex noise
 */
export function getTerrainHeight(x, z) {
  // Base terrain — rolling hills
  let h = simplex.fbm(x * 0.008, z * 0.008, 6, 2, 0.5) * 30;
  
  // Detail noise
  h += simplex.fbm(x * 0.02 + 100, z * 0.02 + 100, 4, 2, 0.5) * 8;
  h += simplex.fbm(x * 0.06 + 200, z * 0.06 + 200, 3, 2, 0.5) * 2;
  
  // Track shaping — flatten along track path
  const distFromCenter = Math.sqrt(x * x + z * z);
  const distToTrack = Math.abs(distFromCenter - TRACK_RADIUS);
  
  if (distToTrack < TRACK_WIDTH) {
    const blend = 1 - distToTrack / TRACK_WIDTH;
    const smoothBlend = blend * blend * (3 - 2 * blend); // Smoothstep
    h = h * (1 - smoothBlend) + 5 * smoothBlend; // Flatten to ~5 units height on track
  }
  
  // Jump ramps at strategic points around track
  const angle = Math.atan2(z, x);
  const jumpHeight = Math.sin(angle * 3) * Math.max(0, 1 - distToTrack / (TRACK_WIDTH * 1.5));
  h += jumpHeight * 6; // Jump ramps add up to 6 units height
  
  // Valley depressions between jumps
  const valleyNoise = simplex.fbm(x * 0.003 + 50, z * 0.003 + 50, 3, 2, 0.5);
  if (valleyNoise < -0.3 && distToTrack > TRACK_WIDTH) {
    h += valleyNoise * 15; // Valley depressions up to -4.5 units
  }
  
  // World edges rise dramatically (cliff borders)
  const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (WORLD_SIZE * 0.45);
  if (edgeDist > 0.7) {
    const edgeRise = (edgeDist - 0.7) / 0.3;
    h += edgeRise * edgeRise * 50; // Steep cliff rise at world edges
  }
  
  return h;
}

/**
 * Get terrain normal vector for physics calculations
 */
export function getTerrainNormal(x, z) {
  const eps = WORLD_SIZE / TERRAIN_RES * 0.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  
  return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
}

/**
 * Initialize world — terrain mesh, vegetation, sky, lighting
 */
export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.terrainMesh = null;
  }

  async init() {
    this.createSky();
    this.createTerrain();
    this.createVegetation();
    this.createTrackMarkers();
  }

  /**
   * Create procedural sky dome with gradient shader
   */
  createSky() {
    // Sky dome — custom gradient shader for realistic sky appearance
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a6bcc) }, // Blue sky top
        bottomColor: { value: new THREE.Color(0xd4e8f0) }, // Light horizon
        offset: { value: 20 },
        exponent: { value: 0.4 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPosition = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);
    
    // Atmospheric fog for depth cueing
    this.scene.fog = new THREE.FogExp2(0x8ab4c8, 0.003);
    
    // Lighting setup — directional sun + ambient + hemisphere
    const ambientLight = new THREE.AmbientLight(0x6688aa, 0.6);
    this.scene.add(ambientLight);
    
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5f0b, 0.4);
    this.scene.add(hemiLight);
    
    // Sun — directional light with shadows
    const sun = new THREE.DirectionalLight(0xfff0dd, 1.2);
    sun.position.set(100, 150, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    sun.shadow.bias = -0.001; // Reduce shadow acne
    this.scene.add(sun);
    
    // Visual sun sphere (not used for rendering, just visual reference)
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffcc })
    );
    sunMesh.position.copy(sun.position);
    this.scene.add(sunMesh);
    
    // Store references for dynamic lighting (day/night cycle)
    this.sun = sun;
    this.ambientLight = ambientLight;
  }

  /**
   * Create procedural terrain mesh with vertex colors
   */
  createTerrain() {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, TERRAIN_RES, TERRAIN_RES);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getTerrainHeight(x, z);
      pos.setY(i, h);
      
      // Vertex colors — terrain coloring based on location
      const distToTrack = Math.abs(Math.sqrt(x * x + z * z) - TRACK_RADIUS);
      let r, g, b;
      
      if (distToTrack < TRACK_WIDTH) {
        // Track area — dirt path color
        const blend = 1 - distToTrack / TRACK_WIDTH;
        const sb = blend * blend * (3 - 2 * blend);
        r = THREE.MathUtils.lerp(0.35, 0.55, sb) + simplex.n2(x * 0.1, z * 0.1) * 0.05;
        g = THREE.MathUtils.lerp(0.28, 0.42, sb) + simplex.n2(x * 0.1 + 5, z * 0.1 + 5) * 0.04;
        b = THREE.MathUtils.lerp(0.18, 0.30, sb) + simplex.n2(x * 0.1 + 10, z * 0.1 + 10) * 0.03;
      } else {
        // Off-track — grass/vegetation color
        const n = simplex.fbm(x * 0.05, z * 0.05, 3, 2, 0.5);
        r = 0.18 + n * 0.1;
        g = 0.45 + n * 0.15; // Green grass
        b = 0.08 + n * 0.05;
      }
      
      colors[i * 3] = Math.max(0, Math.min(1, r));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, g));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b));
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    // Material — diffuse with vertex colors
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0
    });
    
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  /**
   * Create instanced vegetation — trees and grass
   */
  createVegetation() {
    const dummy = new THREE.Object3D();
    
    // Tree trunk geometry/material
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
    
    // Tree canopy geometry/material (cone-like)
    const canopyGeo = new THREE.ConeGeometry(1.5, 3, 6);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.85 });
    
    // Generate tree positions (avoiding track)
    const treePositions = [];
    for (let i = 0; i < 300; i++) {
      const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
      const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
      
      // Only place trees off track and with some randomness for spacing
      if (Math.abs(Math.sqrt(x * x + z * z) - TRACK_RADIUS) > 25 && Math.random() > 0.3) {
        const y = getTerrainHeight(x, z);
        treePositions.push({ x, y, z });
      }
    }
    
    // Instanced meshes for performance (single draw call per type)
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length);
    
    treePositions.forEach((p, i) => {
      // Tree trunk
      const s = 0.6 + Math.random() * 1.2; // Random scale for variety
      dummy.position.set(p.x, p.y + s, p.z);
      dummy.scale.set(s, s, s);
      dummy.rotation.y = Math.random() * Math.PI * 2; // Random rotation
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);
      
      // Tree canopy (higher up)
      dummy.position.set(p.x, p.y + s * 2.5, p.z);
      const canopyScale = s * (0.8 + Math.random() * 0.4);
      dummy.scale.set(canopyScale, s, canopyScale);
      dummy.updateMatrix();
      canopyInst.setMatrixAt(i, dummy.matrix);
    });
    
    trunkInst.castShadow = true;
    canopyInst.castShadow = true;
    this.scene.add(trunkInst, canopyInst);
    
    // Grass tufts (instanced for performance)
    const grassGeo = new THREE.ConeGeometry(0.1, 0.4, 3);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a7a28, roughness: 0.9 });
    const grassCount = 2000;
    const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    
    for (let i = 0; i < grassCount; i++) {
      const x = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
      const z = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
      
      // Skip grass on track
      if (Math.abs(Math.sqrt(x * x + z * z) - TRACK_RADIUS) > 22) {
        const y = getTerrainHeight(x, z);
        const s = 0.5 + Math.random() * 1.5; // Random scale
        
        dummy.position.set(x, y + 0.2 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        grassInst.setMatrixAt(i, dummy.matrix);
      }
    }
    
    this.scene.add(grassInst);
  }

  /**
   * Create track markers — orange posts along the course
   */
  createTrackMarkers() {
    const markerGeo = new THREE.CylinderGeometry(0.15, 0.2, 2, 6);
    const markerMat = new THREE.MeshStandardMaterial({ 
      color: 0xff6600, // Orange posts
      emissive: 0x331100
    });
    
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
      [TRACK_RADIUS + 20, TRACK_RADIUS - 20].forEach(r => {
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = getTerrainHeight(x, z);
        
        const post = new THREE.Mesh(markerGeo, markerMat.clone());
        post.position.set(x, y + 1, z);
        post.castShadow = true;
        this.scene.add(post);
      });
    }
  }

  /**
   * Get terrain height at any x,z coordinates (used by physics)
   */
  getTerrainHeightAt(x, z) {
    return getTerrainHeight(x, z);
  }

  /**
   * Get terrain normal at any x,z coordinates (used by physics)
   */
  getTerrainNormalAt(x, z) {
    return getTerrainNormal(x, z);
  }
}
