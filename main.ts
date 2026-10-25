import * as THREE from 'three';
import { GameState, ItemType, RacerState } from './types';
import { SoundManager } from './audio/SoundManager';
import { InputManager } from './core/InputManager';
import { ParticleSystem } from './core/ParticleSystem';
import { Environment } from './world/Environment';
import { TrackBuilder, TrackMeshResult } from './world/TrackBuilder';
import { ItemBoxManager } from './entities/ItemBox';
import { ProjectileManager } from './entities/ProjectileManager';
import { Kart } from './entities/Kart';
import { AIController } from './entities/AIController';
import { UIManager } from './ui/UIManager';
import { CHARACTERS } from './models/CharacterFactory';
import { KARTS } from './models/KartFactory';
import { CoinManager } from './entities/CoinManager';
import { ProgressionManager, UnlockReward } from './core/ProgressionManager';

export class Game {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  // Subsystems
  private soundManager: SoundManager;
  private inputManager: InputManager;
  private particleSystem!: ParticleSystem;
  private environment!: Environment;
  private itemBoxManager!: ItemBoxManager;
  private projectileManager!: ProjectileManager;
  private coinManager!: CoinManager;
  private progressionManager: ProgressionManager;
  private uiManager: UIManager;

  // Track & Racers
  private currentTrackResult!: TrackMeshResult;
  private playerKart!: Kart;
  private aiControllers: { ai: AIController; kart: Kart }[] = [];
  private allKarts: Kart[] = [];

  // State
  private gameState: GameState = 'TITLE';
  private raceTime: number = 0;
  private countdownTimer: number = 0;
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 3.2, -6.5);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();
  private baseFOV: number = 65;
  private finishTimer: number | null = null;
  private raceCoins = 0;
  private raceUnlocks: UnlockReward[] = [];

  constructor() {
    this.soundManager = new SoundManager();
    this.inputManager = new InputManager();
    this.progressionManager = new ProgressionManager();
    this.uiManager = new UIManager(this.soundManager, this.inputManager, this.progressionManager);

    this.initThree();
    this.setupUIEvents();

    // Start background title view with track loaded
    this.loadTrack(this.uiManager.selectedTrack);

    // Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      this.update(dt);
      this.render();
    };

    requestAnimationFrame(animate);
  }

  private initThree() {
    const container = document.getElementById('game-container')!;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      this.baseFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.environment = new Environment(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.itemBoxManager = new ItemBoxManager(this.scene, this.particleSystem, this.soundManager);
    this.projectileManager = new ProjectileManager(this.scene, this.particleSystem, this.soundManager);
    this.coinManager = new CoinManager(this.scene);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private setupUIEvents() {
    this.uiManager.onStartRaceRequested = () => {
      this.startRace();
    };
    this.uiManager.onRestartRaceRequested = () => {
      this.startRace();
    };
    this.uiManager.onPauseRequested = () => this.pauseRace();
    this.uiManager.onResumeRequested = () => this.resumeRace();
    this.uiManager.onQuitRequested = () => this.returnToTitle();
    this.uiManager.onChangeTrackRequested = () => this.changeTrack();
  }

  private loadTrack(trackData: typeof this.uiManager.selectedTrack) {
    if (this.currentTrackResult) {
      this.scene.remove(this.currentTrackResult.group);
    }

    const trackToBuild = this.uiManager.mirrorMode ? {
      ...trackData,
      points: [...trackData.points].reverse(),
      boostPads: trackData.boostPads.map(index => trackData.points.length - 1 - index),
      itemBoxZones: trackData.itemBoxZones.map(index => trackData.points.length - 1 - index),
      obstacles: trackData.obstacles.map(obstacle => ({ ...obstacle, pointIndex: trackData.points.length - 1 - obstacle.pointIndex }))
    } : trackData;
    this.environment.setup(trackToBuild);
    this.currentTrackResult = TrackBuilder.buildTrack(trackToBuild);
    this.scene.add(this.currentTrackResult.group);

    // Setup item boxes
    this.itemBoxManager.initBoxes(this.currentTrackResult.itemBoxPositions);
    if (this.coinManager) this.coinManager.place(this.currentTrackResult.curve, trackData.roadWidth);
  }

  private startRace() {
    this.raceCoins = 0;
    this.raceUnlocks = [];
    // 1. Ensure audio engine & track are ready
    this.soundManager.init();
    this.soundManager.resume();
    this.soundManager.stopMusic();
    this.uiManager.hideCountdown();
    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }

    // 2. Clear old racers & projectiles
    this.allKarts.forEach(k => this.scene.remove(k.group));
    this.allKarts = [];
    this.aiControllers = [];
    this.projectileManager.clear();

    // 3. Load chosen track
    this.loadTrack(this.uiManager.selectedTrack);

    // 4. Spawn 8 Racers on Grid (1 Player + 7 AI)
    const startSpawns = this.currentTrackResult.startPositions;

    // Player Kart at Pole position (or 4th for fun overtaking!)
    const playerSpawnIdx = 3; // 4th on grid
    this.playerKart = new Kart(
      this.uiManager.selectedCharacter,
      this.uiManager.selectedKart,
      true,
      startSpawns[playerSpawnIdx].position,
      startSpawns[playerSpawnIdx].rotation,
      this.soundManager,
      this.particleSystem,
      this.scene
    );
    this.playerKart.initializeTrackPosition(this.currentTrackResult.curve);
    this.allKarts.push(this.playerKart);

    // AI Racers
    let charIdx = 0;
    let kartIdx = 0;

    for (let i = 0; i < 8; i++) {
      if (i === playerSpawnIdx) continue;

      const aiChar = CHARACTERS[charIdx % CHARACTERS.length];
      const aiKart = KARTS[kartIdx % KARTS.length];
      charIdx++;
      kartIdx++;

      const kart = new Kart(
        aiChar,
        aiKart,
        false,
        startSpawns[i < playerSpawnIdx ? i : i - 1].position,
        startSpawns[i < playerSpawnIdx ? i : i - 1].rotation,
        this.soundManager,
        this.particleSystem,
        this.scene
      );
      kart.initializeTrackPosition(this.currentTrackResult.curve);

      const ai = new AIController(kart, i, this.uiManager.difficulty);
      this.aiControllers.push({ ai, kart });
      this.allKarts.push(kart);
    }

    // 5. Start Countdown Sequence
    this.gameState = 'COUNTDOWN';
    this.countdownTimer = 3.8;
    this.raceTime = 0;
    this.soundManager.startEngine();
  }

  private update(dt: number) {
    if (this.gameState === 'PAUSED') return;
    this.particleSystem.update(dt);

    if (this.gameState === 'TITLE' || this.gameState === 'SELECT' || this.gameState === 'TRACK_SELECT') {
      // Cinematic rotating camera over track
      const t = performance.now() * 0.0003;
      this.camera.position.set(Math.sin(t) * 120, 45, Math.cos(t) * 120 + 100);
      this.camera.lookAt(0, 15, 120);
      return;
    }

    // Countdown state
    if (this.gameState === 'COUNTDOWN') {
      this.updateCountdown(dt);
      this.updateCamera(dt, true);
      return;
    }

    // Racing / Finished state
    if (this.gameState === 'RACING' || this.gameState === 'FINISHED') {
      this.raceTime += dt;
      if (this.playerKart.state.finishTime === null) this.playerKart.state.totalTime = this.raceTime;

      // 1. Player Input & Kart Update
      const controls = this.inputManager.getControls();

      // Reset kart button
      if (controls.reset) {
        this.playerKart.resetToTrack(this.currentTrackResult.curve);
      }

      // Use Item button
      if (controls.useItemJustPressed && this.playerKart.state.item) {
        this.useItem(this.playerKart, controls.throttle > 0);
      }

      // Update Player
      this.playerKart.update(
        dt,
        this.gameState === 'FINISHED' ? 0.4 : controls.throttle,
        controls.steer,
        controls.drift,
        controls.driftJustPressed,
        this.currentTrackResult.curve,
        this.uiManager.selectedTrack.roadWidth
      );
      this.coinManager.update(dt, this.playerKart.state, () => {
        if (this.progressionManager.balance >= this.progressionManager.maxCoins) return;
        const progress = this.progressionManager.collectCoin();
        this.raceCoins++;
        this.raceUnlocks.push(...progress.rewards);
        this.uiManager.updateCoinProgress(progress.balance, progress.rewards);
      });
      this.captureFinishTime(this.playerKart);

      // Sound update for player engine
      this.soundManager.updateEngine(
        Math.abs(this.playerKart.speed) / 45,
        this.playerKart.state.isBoosting
      );

      // 2. AI Karts Update
      this.aiControllers.forEach(item => {
        if (item.kart.state.finishTime === null) item.kart.state.totalTime = this.raceTime;
        item.ai.update(
          dt,
          this.currentTrackResult.curve,
          this.uiManager.selectedTrack.roadWidth,
          this.playerKart,
          this.allKarts,
          this.currentTrackResult.obstacles,
          (aiKart) => this.useItem(aiKart)
        );
        this.captureFinishTime(item.kart);
      });

      this.currentTrackResult.obstacles.forEach(obstacle => {
        this.allKarts.forEach(kart => kart.handleObstacleCollision(obstacle.position, obstacle.radius));
      });

      // 3. Check Boost Pads
      this.checkBoostPads();

      // 4. Mystery Item Boxes
      this.itemBoxManager.update(dt, this.allKarts, (kart, item) => {
        if (kart.state.isPlayer) {
          this.uiManager.startItemRoulette(item, () => {
            kart.state.item = item;
          });
        } else {
          kart.state.item = item;
        }
      });

      // 5. Projectiles & Hazards
      this.projectileManager.update(
        dt,
        this.allKarts,
        this.currentTrackResult.curve,
        this.uiManager.selectedTrack.roadWidth
      );

      // 6. Update Race Rankings
      this.updateRaceRankings();

      // 7. Update Camera
      this.updateCamera(dt, false, controls.lookBack);

      // 8. Update HUD
      const allStates = this.allKarts.map(k => k.state);
      this.uiManager.updateHUD(
        this.playerKart.state,
        allStates,
        this.uiManager.selectedLaps,
        this.currentTrackResult.curve
      );

      // 9. Lap & Race Finish Check
      if (this.gameState === 'RACING' && this.playerKart.state.currentLap > this.uiManager.selectedLaps) {
        this.finishRace();
      }
    }
  }

  private updateCountdown(dt: number) {
    const prevSec = Math.ceil(this.countdownTimer);
    this.countdownTimer -= dt;
    const currentSec = Math.ceil(this.countdownTimer);

    if (this.countdownTimer > 0) {
      if (currentSec !== prevSec) {
        this.soundManager.playCountBeep(false);
      }
      this.uiManager.showCountdown(currentSec.toString());
    } else if (this.countdownTimer > -0.85) {
      if (prevSec > 0) {
        this.soundManager.playCountBeep(true);
        this.soundManager.startMusic(this.uiManager.selectedTrack.id as 'neon' | 'canyon' | 'lava' | 'crystal' | 'forest' | 'sky' | 'rainbow');
      }
      this.uiManager.showCountdown('PARTEZ !');
    } else {
      this.uiManager.hideCountdown();
      this.gameState = 'RACING';
    }
  }

  private pauseRace() {
    if (this.gameState !== 'RACING') return;
    this.gameState = 'PAUSED';
    this.soundManager.stopEngine();
    this.soundManager.stopMusic();
    this.uiManager.showPauseScreen();
  }

  private resumeRace() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'RACING';
    this.uiManager.showScreen('HUD');
    this.soundManager.startEngine();
    this.soundManager.startMusic(this.uiManager.selectedTrack.id as 'neon' | 'canyon' | 'lava' | 'crystal' | 'forest' | 'sky' | 'rainbow');
  }

  private clearRace() {
    this.allKarts.forEach(kart => this.scene.remove(kart.group));
    this.allKarts = [];
    this.aiControllers = [];
    this.projectileManager.clear();
    this.itemBoxManager.clear();
    this.coinManager.clear();
    this.uiManager.hideCountdown();
    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
  }

  private returnToTitle() {
    this.clearRace();
    this.soundManager.stopEngine();
    this.soundManager.stopMusic();
    this.gameState = 'TITLE';
    this.uiManager.showScreen('TITLE');
  }

  private changeTrack() {
    this.clearRace();
    this.soundManager.stopEngine();
    this.soundManager.stopMusic();
    this.gameState = 'TRACK_SELECT';
    this.uiManager.showTrackSelection();
  }

  private useItem(kart: Kart, throwForward: boolean = false) {
    const item = kart.state.item;
    if (!item) return;
    kart.state.item = null;
    if (kart.state.isPlayer) {
      this.uiManager.setItemIcon(null);
    }

    switch (item) {
      case 'mushroom':
        kart.triggerBoost(3.2);
        if (kart.state.isPlayer) this.soundManager.playBoost(2);
        break;

      case 'star':
        kart.triggerStar(7.0);
        break;

      case 'banana':
        this.projectileManager.dropBanana(kart, throwForward);
        break;

      case 'green_shell':
        this.projectileManager.fireGreenShell(kart);
        break;

      case 'red_shell': {
        // Find racer directly ahead
        const aheadKart = this.allKarts
          .filter(k => k !== kart && k.totalProgress > kart.totalProgress)
          .sort((a, b) => a.totalProgress - b.totalProgress)[0];
        this.projectileManager.fireRedShell(kart, aheadKart);
        break;
      }

      case 'rocket': {
        const aheadKart = this.allKarts
          .filter(k => k !== kart && k.totalProgress > kart.totalProgress)
          .sort((a, b) => a.totalProgress - b.totalProgress)[0];
        const leader = aheadKart ?? this.allKarts
          .filter(k => k !== kart)
          .sort((a, b) => b.totalProgress - a.totalProgress)[0];
        this.projectileManager.fireRocket(kart, leader);
        break;
      }

      case 'shield':
        kart.activateShield(8.0);
        break;

      case 'lightning':
        this.uiManager.flashLightning();
        this.allKarts.forEach(otherKart => {
          if (otherKart !== kart) {
            otherKart.triggerLightningHit();
          }
        });
        break;
    }
  }

  private checkBoostPads() {
    this.currentTrackResult.boostPadMeshes.forEach(pad => {
      this.allKarts.forEach(kart => {
        if (kart.group.position.distanceTo(pad.position) < 4.2) {
            kart.triggerBoost(2.0);
            if (kart.state.isPlayer) {
              this.soundManager.playBoost(1);
            }
          }
      });
    });
  }

  private updateRaceRankings() {
    // Finished racers rank by finish time; racers still on track rank by progress.
    this.allKarts.sort((a, b) => {
      const aFinished = a.state.finishTime !== null;
      const bFinished = b.state.finishTime !== null;
      if (aFinished && bFinished) return a.state.finishTime! - b.state.finishTime!;
      if (aFinished) return -1;
      if (bFinished) return 1;
      return b.totalProgress - a.totalProgress;
    });
    this.allKarts.forEach((k, idx) => {
      k.state.rank = idx + 1;
    });
  }

  private captureFinishTime(kart: Kart) {
    if (kart.state.finishTime === null && kart.state.currentLap > this.uiManager.selectedLaps) {
      kart.state.finishTime = this.raceTime;
      kart.state.totalTime = this.raceTime;
    }
  }

  private updateCamera(dt: number, isIntro: boolean = false, lookBack: boolean = false) {
    if (!this.playerKart) return;

    const kartPos = this.playerKart.group.position;
    const kartHeading = this.playerKart.headingAngle;

    if (isIntro) {
      // Pan from front to rear
      const angle = kartHeading + Math.PI * (this.countdownTimer / 3.8);
      this.camera.position.set(
        kartPos.x + Math.sin(angle) * 7.5,
        kartPos.y + 2.5,
        kartPos.z + Math.cos(angle) * 7.5
      );
      this.camera.lookAt(kartPos.x, kartPos.y + 1.0, kartPos.z);
      return;
    }

    // Dynamic third-person chase camera
    const backHeading = lookBack ? kartHeading : (kartHeading + Math.PI);
    const targetCamX = kartPos.x + Math.sin(backHeading) * 6.8;
    const targetCamY = kartPos.y + 3.2;
    const targetCamZ = kartPos.z + Math.cos(backHeading) * 6.8;

    const camTarget = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
    this.camera.position.lerp(camTarget, 10.0 * dt);

    // Look at kart with lead forward
    const leadDir = new THREE.Vector3(Math.sin(kartHeading), 0, Math.cos(kartHeading));
    const targetLook = kartPos.clone().addScaledVector(leadDir, lookBack ? -8 : 6);
    targetLook.y += 1.2;

    this.cameraLookTarget.lerp(targetLook, 12.0 * dt);
    this.camera.lookAt(this.cameraLookTarget);

    // Speed FOV warp effect
    const speedRatio = Math.min(1.0, Math.abs(this.playerKart.speed) / 45);
    const boostExtra = this.playerKart.state.isBoosting ? 12 : 0;
    const targetFOV = this.baseFOV + speedRatio * 15 + boostExtra;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 6.0 * dt);
    this.camera.updateProjectionMatrix();
  }

  private finishRace() {
    this.gameState = 'FINISHED';
    const sortedRacers = [...this.allKarts].sort((a, b) => a.state.rank - b.state.rank).map(k => k.state);
    const playerWon = this.playerKart.state.rank === 1;

    this.soundManager.stopEngine();
    this.soundManager.playFinishFanfare(playerWon);

    this.finishTimer = window.setTimeout(() => {
      this.finishTimer = null;
      if (this.gameState !== 'FINISHED') return;
      this.uiManager.showPodium(sortedRacers, this.raceCoins, this.raceUnlocks);
    }, 1800);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// Start game safely whether DOM is ready or already loaded
function initGame() {
  try {
    new Game();
  } catch (err) {
    console.error('Erreur démarrage du jeu:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
