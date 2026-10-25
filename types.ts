import * as THREE from 'three';

export interface CharacterConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  accentColor: string;
  unlockCost?: number;
  stats: {
    speed: number;       // 1 - 10
    acceleration: number; // 1 - 10
    handling: number;     // 1 - 10
    weight: number;       // 1 - 10
  };
}

export interface KartConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  stats: {
    topSpeedMod: number;
    accelMod: number;
    driftMod: number;
    offroadMod: number;
  };
}

export interface TrackTheme {
  skyColor: number;
  horizonColor: number;
  groundColor: number;
  roadColor: number;
  curbColor1: number;
  curbColor2: number;
  barrierColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientLight: number;
  dirLight: number;
}

export interface TrackData {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  theme: TrackTheme;
  points: THREE.Vector3[];
  roadWidth: number;
  boostPads: number[]; // index of points where boost pads are
  itemBoxZones: number[]; // index of points where item box sets are
  obstacles: { pointIndex: number; offset: number; type: 'rock' | 'cactus' | 'pillar' }[];
  laps: number;
  unlockCost?: number;
}

export type ItemType = 'banana' | 'green_shell' | 'red_shell' | 'rocket' | 'shield' | 'mushroom' | 'star' | 'lightning' | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ItemInfo {
  type: ItemType;
  name: string;
  icon: string;
  description: string;
}

export interface RacerState {
  id: string;
  isPlayer: boolean;
  name: string;
  character: CharacterConfig;
  kart: KartConfig;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  currentLap: number;
  lapProgress: number; // 0 to 1 along current lap
  totalProgress: number; // currentLap + lapProgress
  rank: number;
  item: ItemType;
  isDrifting: boolean;
  driftLevel: number; // 0, 1 (blue), 2 (orange)
  isBoosting: boolean;
  boostTimeRemaining: number;
  isInvincible: boolean; // Star
  starTimeRemaining: number;
  isShrunk: boolean; // Lightning
  shrunkTimeRemaining: number;
  isSpinning: boolean; // Hit by item
  spinAngle: number;
  lapTimes: number[];
  totalTime: number;
  finishTime: number | null;
}

export type GameState = 'TITLE' | 'SELECT' | 'TRACK_SELECT' | 'COUNTDOWN' | 'RACING' | 'FINISHED' | 'PAUSED';
