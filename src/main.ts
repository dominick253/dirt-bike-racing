/**
 * Main Game Controller — Full game loop with state machine
 */

import * as THREE from 'three';
import { Clock } from './core/clock';
import { StateMachine, GameState } from './core/state';
import { InputSystem } from './core/input';
import { AudioSystem } from './core/audio';
import { BikePhysics } from './physics/bike';
import { TerrainSystem } from './world/terrain';
import { CameraSystem } from './render/camera';
import { ParticleSystem } from './world/particles';
import { BikeModel } from './bike/model';
import { AIController } from './ai/opponent';
import { MinimapRenderer } from './render/minimap';
import { CareerManager, type CareerData } from './utils/save';
import { MobileInputSystem } from './core/mobile';

export class GameController {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock: Clock;
  private stateMachine: StateMachine;
  private input: InputSystem;
  private audio: AudioSystem;
  private bike: BikePhysics;
  private terrain: TerrainSystem;
  private cameraSystem: CameraSystem;
  private particles: ParticleSystem;
  private bikeModel!: BikeModel;
  private aiController: AIController;
  private minimapRenderer: MinimapRenderer;
  private careerManager: CareerManager;
  private mobileInput: MobileInputSystem;
  private animationId: number | null = null;
  private raceTime: number = 0;
  private laps: number = 0;
  private totalLaps: number = 3;
  private lastCheckpointAngle: number = 0;
  private checkpointsPassed: number = 0;
  private raceStarted: boolean = false;
  private countdownActive: boolean = false;
  private selectedBike: number = 0;
  private currentMode: string = 'National';
  private airTime: number = 0;
  private airTricks: number = 0;
  private titleButtonsBound: boolean = false;
  private lastNormalizedAngle: number | undefined;

  constructor() {
    this.clock = new Clock();
    this.stateMachine = new StateMachine();
    this.input = new InputSystem();
    this.audio = new AudioSystem();
    this.bike = new BikePhysics(new THREE.Vector3(50, 5, 0));
    this.terrain = new TerrainSystem(42);
    this.terrain.setTrack(50, 12);
    this.stateMachine.on(GameState.LOADING, () => this.onLoading());
    this.stateMachine.on(GameState.TITLE, () => this.onTitle());
    this.stateMachine.on(GameState.COUNTDOWN, () => this.onCountdown());
    this.stateMachine.on(GameState.RACE, () => this.onRace());
    this.stateMachine.on(GameState.RESULTS, () => this.onResults());

    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLighting();
    this.setupWorld();

    this.cameraSystem = new CameraSystem(this.camera);
    this.particles = new ParticleSystem(this.scene);
    this.aiController = new AIController(50, 12);
    this.minimapRenderer = new MinimapRenderer('minimap-canvas');
    this.minimapRenderer.setTrack(50, 12);
    this.careerManager = new CareerManager();
    this.mobileInput = new MobileInputSystem();
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    document.body.appendChild(this.renderer.domElement);
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.003);
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    this.scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.3);
    this.scene.add(hemiLight);
  }

  private setupWorld(): void {
    const terrainMesh = this.terrain.createMesh();
    this.scene.add(terrainMesh);

    const trackMesh = this.terrain.createTrackMesh();
    this.scene.add(trackMesh);

    this.addVegetation();
    this.addSkyDome();
  }

  private addVegetation(): void {
    const treeGeo = new THREE.ConeGeometry(1.5, 6, 8);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.9 });
    const instancedMesh = new THREE.InstancedMesh(treeGeo, treeMat, 600);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 80;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.terrain.getHeight(x, z);

      dummy.position.set(x, y + 3, z);
      const scale = 0.8 + Math.random() * 1.5;
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(instancedMesh);
  }

  private addSkyDome(): void {
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  private createBikeModel(): void {
    this.bikeModel = new BikeModel();
    this.bikeModel.getGroup().position.set(50, 5, 0);
    this.scene.add(this.bikeModel.getGroup());
  }

  start(): void {
    this.stateMachine.transition(GameState.TITLE);
  }

  private onLoading(): void {
    const bar = document.getElementById('loading-bar');
    const percent = document.getElementById('loading-percent');
    if (!bar || !percent) return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) loadingScreen.classList.add('hidden');
          this.stateMachine.transition(GameState.TITLE);
        }, 300);
      }
      if (bar) bar.style.width = `${progress}%`;
      if (percent) percent.textContent = `${Math.floor(progress)}%`;
    }, 100);
  }

  private onTitle(): void {
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
    this.createBikeModel();
    this.showTitleScreen();
    // Render title background
    this.renderer.render(this.scene, this.camera);
  }

  private showTitleScreen(): void {
    const titleEl = document.getElementById('title-screen');
    if (titleEl) {
      titleEl.classList.add('active');
      if (!this.titleButtonsBound) {
        const startBtn = document.getElementById('start-race');
        if (startBtn) {
          startBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.stateMachine.transition(GameState.COUNTDOWN);
          });
        }
        const garageBtn = document.getElementById('select-bike');
        if (garageBtn) {
          garageBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.showGarageScreen();
          });
        }
        const careerBtn = document.getElementById('career-mode');
        if (careerBtn) {
          careerBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.showCareerScreen();
          });
        }
        this.titleButtonsBound = true;
      }
    }
  }

  private showGarageScreen(): void {
    this.hideAllScreens();
    const garageEl = document.getElementById('garage-screen');
    if (garageEl) {
      garageEl.classList.add('active');
      const cards = garageEl.querySelectorAll('.bike-card') as NodeListOf<HTMLElement>;
      cards.forEach((card, i) => {
        card.addEventListener('click', () => {
          cards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedBike = i;
        });
      });
      const confirmBtn = document.getElementById('garage-confirm');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.careerManager.selectBike(this.selectedBike);
          this.stateMachine.transition(GameState.TITLE);
        });
      }
      const backBtn = document.getElementById('garage-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.stateMachine.transition(GameState.TITLE);
        });
      }
    }
  }

  private showCareerScreen(): void {
    this.hideAllScreens();
    const careerEl = document.getElementById('career-screen');
    if (careerEl) {
      careerEl.classList.add('active');
      const data = this.careerManager.getData();
      const winsEl = document.getElementById('career-wins');
      if (winsEl) winsEl.textContent = data.totalWins.toString();
      const racesEl = document.getElementById('career-races');
      if (racesEl) racesEl.textContent = data.totalRaces.toString();
      const bestLapEl = document.getElementById('career-best-lap');
      if (bestLapEl) bestLapEl.textContent = this.formatTime(data.bestLap);

      const modes = ['national', 'stunt', 'enduro', 'supercross'] as const;
      modes.forEach((mode) => {
        const winsEl = document.getElementById(`career-${mode}-wins`);
        const modeData = (data as unknown as Record<string, Record<string, number>>)[mode];
        if (winsEl && modeData) winsEl.textContent = modeData['wins'].toString();
        const bestEl = document.getElementById(`career-${mode}-best`);
        if (bestEl && modeData) {
          bestEl.textContent = modeData['bestLap'] > 0
            ? this.formatTime(modeData['bestLap'])
            : '--:--.-';
        }
      });

      const backBtn = document.getElementById('career-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.stateMachine.transition(GameState.TITLE);
        });
      }
    }
  }

  private hideAllScreens(): void {
    const screens = ['title-screen', 'garage-screen', 'career-screen'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
  }

  private onCountdown(): void {
    this.countdownActive = true;
    this.raceTime = 0;
    this.laps = 0;
    this.checkpointsPassed = 0;
    this.lastCheckpointAngle = 0;
    this.raceStarted = false;
    this.airTime = 0;
    this.airTricks = 0;

    // Reset bike based on selected bike
    const bikeOffsets = [0, 3, -3];
    const offset = bikeOffsets[this.selectedBike] || 0;
    this.bike.reset(new THREE.Vector3(50 + offset, 5, 0));

    const countdownEl = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');
    if (countdownEl) countdownEl.classList.add('active');
    if (countdownText) countdownText.textContent = '3';

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        if (countdownText) countdownText.textContent = count.toString();
        this.audio.playCountdownBeep(count);
      } else if (count === 0) {
        if (countdownText) countdownText.textContent = 'GO!';
        this.audio.playCountdownBeep(0);
      } else {
        clearInterval(interval);
        if (countdownEl) countdownEl.classList.remove('active');
        this.countdownActive = false;
        this.stateMachine.transition(GameState.RACE);
      }
    }, 800);
  }

  private onRace(): void {
    this.raceStarted = true;
    // Activate HUD
    const hud = document.getElementById('hud');
    if (hud) hud.classList.add('active');
    this.startGameLoop();
  }

  private startGameLoop(): void {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      this.animate();
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private animate(): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.countdownActive) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.raceStarted) return;

    this.update(delta);
    this.syncBikeMesh();
    this.updateHUD();
    this.renderMinimap();
    this.renderer.render(this.scene, this.camera);
  }

  private update(delta: number): void {
    const bikePos = this.bike.getPosition();
    const terrainHeight = this.terrain.getHeight(bikePos.x, bikePos.z);
    const terrainNormal = this.terrain.getNormal(bikePos.x, bikePos.z);

    // Merge keyboard + mobile input
    const kbInput = this.input.getState();
    const mobileState = this.mobileInput.getState();
    const mergedInput = {
      throttle: kbInput.throttle || mobileState.throttle,
      brake: kbInput.brake || mobileState.brake,
      steerLeft: kbInput.steerLeft || mobileState.steerLeft,
      steerRight: kbInput.steerRight || mobileState.steerRight,
      jump: kbInput.jump,
      wheelie: kbInput.wheelie,
    };

    this.bike.update(delta, mergedInput, terrainHeight, terrainNormal);

    // Track following: on a circular track, the bike needs to rotate to stay on track
    // Calculate current angle from track center and set rotation to tangent direction
    const trackAngle = Math.atan2(bikePos.z, bikePos.x);
    const trackTangent = trackAngle + Math.PI / 2; // Tangent points counterclockwise
    // Blend bike rotation toward track tangent (stronger pull = stays on track)
    const trackPull = 3.0 * delta;
    this.bike.state.rotation += (trackTangent - this.bike.state.rotation) * trackPull;

    // Update particles
    this.particles.update(delta);

    this.cameraSystem.update(
      this.bike.getPosition(),
      this.bike.state.rotation,
      this.bike.getSpeed()
    );

    // Update AI
    this.aiController.update(delta, this.terrain.getTrackRadius());
    const aiPos = this.bike.getPosition();
    const aiState = this.aiController.getOpponents();

    // Particles
    const speed = this.bike.getSpeed();
    if (speed > 15) {
      this.particles.emit(this.bike.getPosition(), 1, new THREE.Color(0x8B4513), true);
    }

    const impact = this.bike.getLandingImpact();
    if (impact > 1.0) {
      this.particles.emit(this.bike.getPosition(), Math.floor(impact * 5), new THREE.Color(0x666666), false);
      this.audio.playLanding(impact);
    }

    if (speed > 5) {
      this.audio.playEngine(this.bike.getRPM());
    }

    // Air tracking
    if (this.bike.state.isAirborne) {
      this.airTime += delta;
      if (this.airTime > 0.5 && this.airTricks < 3) {
        const airEl = document.getElementById('air-indicator');
        if (airEl) airEl.classList.add('visible');
        this.airTricks++;
      }
    } else {
      this.airTime = 0;
      this.airTricks = 0;
      const airEl = document.getElementById('air-indicator');
      if (airEl) airEl.classList.remove('visible');
    }

    this.updateLapTracking();
    this.raceTime += delta;

    // Check race complete
    if (this.laps >= this.totalLaps) {
      this.stateMachine.transition(GameState.RESULTS);
    }
  }

  private renderMinimap(): void {
    const bikePos = this.bike.getPosition();
    const aiState = this.aiController.getOpponents();
    const aiPositions = aiState.map(ai => ({
      x: ai.position.x,
      z: ai.position.z,
      color: ai.color,
    }));
    this.minimapRenderer.render(bikePos.x, bikePos.z, aiPositions);
  }

  private updateLapTracking(): void {
    const pos = this.bike.getPosition();
    const trackRadius = this.terrain.getTrackRadius();

    // Calculate angular progress around track center (0, 0)
    const angle = Math.atan2(pos.z, pos.x);
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    // Only count if bike is near the track radius
    if (Math.abs(dist - trackRadius) > 20) return;

    // Normalize angle to [0, 2PI]
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // Check if we've crossed the starting line (angle wraps around 0)
    if (this.lastNormalizedAngle !== undefined) {
      const prevAngle = this.lastNormalizedAngle;
      // Detect crossing from near-2PI to near-0
      if (prevAngle > Math.PI * 0.75 && normalizedAngle < Math.PI * 0.25) {
        console.log(`Lap ${this.laps + 1} complete! dist=${dist.toFixed(1)} angle=${normalizedAngle.toFixed(2)} prev=${prevAngle.toFixed(2)}`);
        this.laps++;
        this.checkpointsPassed = 0;
      }
    } else {
      console.log(`First frame: angle=${normalizedAngle.toFixed(2)} dist=${dist.toFixed(1)}`);
    }

    this.lastNormalizedAngle = normalizedAngle;
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  private syncBikeMesh(): void {
    if (!this.bikeModel) return;
    const pos = this.bike.getPosition();
    this.bikeModel.getGroup().position.set(pos.x, pos.y, pos.z);
    this.bikeModel.getGroup().rotation.y = this.bike.state.rotation;
    this.bikeModel.getGroup().rotation.z = this.bike.state.leanAngle;
    this.bikeModel.updateWheelRotation(this.bike.state.wheelRotation);
    this.bikeModel.updateSuspension(this.bike.state.suspensionCompression);
  }

  private updateHUD(): void {
    const speedEl = document.getElementById('speed-display');
    const lapEl = document.getElementById('lap-display');
    const timerEl = document.getElementById('timer-display');
    const gearEl = document.getElementById('gear-display');
    const rpmEl = document.getElementById('rpm-display');
    const posEl = document.getElementById('position-display');

    if (speedEl) {
      const speedNum = Math.floor(this.bike.getSpeed());
      speedEl.innerHTML = `${speedNum}<span id="speed-unit">km/h</span>`;
    }
    if (lapEl) lapEl.textContent = `Lap ${Math.min(this.laps + 1, this.totalLaps)}/${this.totalLaps}`;
    if (timerEl) {
      const mins = Math.floor(this.raceTime / 60);
      const secs = Math.floor(this.raceTime % 60);
      const ms = Math.floor((this.raceTime % 1) * 10);
      timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
    if (gearEl) gearEl.textContent = `G${this.bike.getGear()}`;
    if (rpmEl) rpmEl.textContent = `${Math.floor(this.bike.getRPM())} RPM`;

    // Position
    if (posEl) {
      const bikeX = this.bike.getPosition().x;
      const bikeZ = this.bike.getPosition().z;
      const position = this.aiController.getRacePosition(bikeX, bikeZ);
      const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
      posEl.textContent = `${position}${suffix}`;
    }
  }

  private onResults(): void {
    this.raceStarted = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.audio.stopEngine();
    // Deactivate HUD
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('active');
    this.showResultsScreen();
  }

  private showResultsScreen(): void {
    this.hideAllScreens();
    const resultsEl = document.getElementById('results-screen');
    if (resultsEl) {
      resultsEl.classList.add('active');

      const bikeX = this.bike.getPosition().x;
      const bikeZ = this.bike.getPosition().z;
      const position = this.aiController.getRacePosition(bikeX, bikeZ);
      const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';

      const posEl = document.getElementById('race-position');
      if (posEl) {
        posEl.textContent = `${position}${suffix}`;
        posEl.className = `value pos-${position}`;
      }

      const timeEl = document.getElementById('race-time');
      if (timeEl) timeEl.textContent = this.formatTime(this.raceTime);

      const lapsEl = document.getElementById('laps-completed');
      if (lapsEl) lapsEl.textContent = this.laps.toString();

      // Save career
      this.careerManager.saveRace(this.currentMode, position, this.raceTime);

      const retryBtn = document.getElementById('retry-race');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.resetRace();
          this.stateMachine.transition(GameState.COUNTDOWN);
        });
      }

      const menuBtn = document.getElementById('main-menu');
      if (menuBtn) {
        menuBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.stateMachine.transition(GameState.TITLE);
        });
      }
    }
  }

  private resetRace(): void {
    this.bike.reset(new THREE.Vector3(50, 5, 0));
    this.raceTime = 0;
    this.laps = 0;
    this.checkpointsPassed = 0;
    this.lastNormalizedAngle = undefined;
    this.raceStarted = false;
    this.particles.clear();
    this.airTime = 0;
    this.airTricks = 0;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Boot the game
const game = new GameController();
game.start();

window.addEventListener('resize', () => game.onResize());
