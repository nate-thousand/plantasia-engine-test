import type { VisualEnergyFrameInput } from './VisualEnergy';
import type { VisualEnergyBehavior } from './types';

/** Home default — almost empty, slow ambient only. */
export type VisualRenderMode = 'idleHome' | 'activePlay';

/** Milestone 13D experiential modes derived from transport + interaction. */
export type ExperientialMode = 'home' | 'ambient' | 'performance';

export const IDLE_HOME = {
  /** ~90% reduction vs legacy sparse idle (0.32 → 0.032). */
  density: 0.032,
  /** Target combined energy while at rest. */
  visualEnergy: 0.055,
  visualEnergyMin: 0.03,
  visualEnergyMax: 0.08,
  minClusters: 3,
  maxClusters: 7,
  maxScreenCoverage: 0.05,
  animSpeed: 0.24,
  amplitude: 0.02,
  sceneEnergy: 0.05,
} as const;

/** Continuous evolution while Play is active — no interaction required. */
export const AMBIENT_PLAY = {
  playModeEnergyFloor: 0.44,
  visualEnergyFloor: 0.26,
  displayEnergyTarget: 0.34,
  fullSceneThreshold: 0.12,
  animSpeed: 0.58,
  density: 0.14,
  choreographyBase: 0.24,
} as const;

export const ACTIVE_PLAY = {
  densityMin: 0.12,
  densityMax: 0.38,
} as const;

/** Cross into activePlay when play energy exceeds this (or ambient session is active). */
export const PLAY_MODE_ENTER_THRESHOLD = 0.08;

/** Performance mode crosses when play energy exceeds this. */
export const PERFORMANCE_ENTER_THRESHOLD = 0.58;

/** Decay interaction boost to ambient floor in ~7s. */
export const PLAY_MODE_DECAY_RATE = 0.48;

/** Decay from ambient back to home in ~8s after Stop. */
export const HOME_DECAY_RATE = 0.42;

export function resolveVisualRenderMode(
  playModeEnergy: number,
  ambientActive: boolean,
): VisualRenderMode {
  if (ambientActive || playModeEnergy >= PLAY_MODE_ENTER_THRESHOLD) {
    return 'activePlay';
  }
  return 'idleHome';
}

export function resolveExperientialMode(
  ambientActive: boolean,
  playModeEnergy: number,
): ExperientialMode {
  if (!ambientActive && playModeEnergy < PLAY_MODE_ENTER_THRESHOLD) {
    return 'home';
  }
  if (playModeEnergy >= PERFORMANCE_ENTER_THRESHOLD) {
    return 'performance';
  }
  return 'ambient';
}

/** Rise quickly on interaction; decay to ambient floor or home. */
export function tickPlayModeEnergy(
  current: number,
  input: VisualEnergyFrameInput,
  deltaMs: number,
): number {
  const dt = Math.min(deltaMs / 1000, 0.05);
  const floor = input.ambientActive ? AMBIENT_PLAY.playModeEnergyFloor : 0;
  let target = floor;

  if (input.ambientActive) {
    target = AMBIENT_PLAY.playModeEnergyFloor;
  }

  if (input.audio.isActive || input.audio.amplitude > 0.03 || input.audio.peak > 0.05) {
    target = Math.max(target, 0.55 + input.audio.amplitude * 0.45);
  }

  if (input.activeNotes.length > 0) {
    target = 1;
  }

  if (input.pointerActive || input.pointerActivity > 0.06) {
    target = Math.max(target, Math.min(1, 0.45 + input.pointerActivity * 0.85));
  }

  if (input.isTouch && input.pointerActivity > 0.04) {
    target = Math.max(target, input.pointerActivity);
  }

  if (input.sliderDelta > 0.004) {
    target = Math.max(target, Math.min(1, 0.5 + input.sliderDelta * 12));
  }

  if (input.presetTransition > 0.05) {
    target = Math.max(target, 0.62 + input.presetTransition * 0.38);
  }

  if (input.interactionBoost > 6) {
    target = Math.max(target, input.interactionBoost / 127);
  }

  if (target > current) {
    return current + (target - current) * Math.min(1, 14 * dt);
  }

  const decay = input.ambientActive ? PLAY_MODE_DECAY_RATE : HOME_DECAY_RATE;
  return Math.max(floor, current * Math.exp(-decay * dt));
}

/** Display energy capped for idle home; ambient floor while Play active. */
export function displayVisualEnergy(
  renderMode: VisualRenderMode,
  combinedEnergy: number,
  playModeEnergy: number,
  ambientActive: boolean,
): number {
  if (renderMode === 'activePlay') {
    if (ambientActive) {
      return Math.max(
        AMBIENT_PLAY.displayEnergyTarget * 0.85,
        combinedEnergy,
        playModeEnergy * 0.55,
      );
    }
    return combinedEnergy;
  }
  const fade = Math.min(1, playModeEnergy / PLAY_MODE_ENTER_THRESHOLD);
  return (
    IDLE_HOME.visualEnergyMin +
    fade * (IDLE_HOME.visualEnergyMax - IDLE_HOME.visualEnergyMin)
  );
}

/** Ambient behavior — continuous slow evolution without interaction. */
export function behaviorForAmbientPlay(
  reduceMotion: boolean,
): VisualEnergyBehavior {
  const motion = reduceMotion ? 0.28 : AMBIENT_PLAY.animSpeed;
  return {
    density: AMBIENT_PLAY.density,
    speed: motion,
    spread: 0.28,
    brightness: 0.52,
    jitter: reduceMotion ? 0.04 : 0.12,
    scale: 0.96,
    distortion: 0.08,
    symbolComplexity: 0.42,
    rareEventRate: 0.08,
    growthRate: 0.38,
    decayRate: 0.88,
  };
}

/** Renderer behavior — idleHome never shares activePlay density/motion curves. */
export function behaviorForRenderMode(
  renderMode: VisualRenderMode,
  energy: number,
  reduceMotion: boolean,
  activeBehavior: VisualEnergyBehavior,
  ambientActive: boolean,
  playModeEnergy: number,
): VisualEnergyBehavior {
  if (renderMode === 'activePlay') {
    if (ambientActive && playModeEnergy < PERFORMANCE_ENTER_THRESHOLD) {
      const ambient = behaviorForAmbientPlay(reduceMotion);
      const blend = Math.min(1, (playModeEnergy - AMBIENT_PLAY.playModeEnergyFloor) / 0.22);
      return lerpBehavior(ambient, activeBehavior, blend * 0.65 + energy * 0.35);
    }
    return activeBehavior;
  }

  const motion = reduceMotion ? 0.14 : IDLE_HOME.animSpeed;
  return {
    density: IDLE_HOME.density,
    speed: motion,
    spread: 0.04,
    brightness: 0.4,
    jitter: 0,
    scale: 0.92,
    distortion: 0,
    symbolComplexity: 0.1,
    rareEventRate: 0.015,
    growthRate: 0.08,
    decayRate: 0.96,
  };
}

function lerpBehavior(
  a: VisualEnergyBehavior,
  b: VisualEnergyBehavior,
  t: number,
): VisualEnergyBehavior {
  const u = Math.max(0, Math.min(1, t));
  return {
    density: a.density + (b.density - a.density) * u,
    speed: a.speed + (b.speed - a.speed) * u,
    spread: a.spread + (b.spread - a.spread) * u,
    brightness: a.brightness + (b.brightness - a.brightness) * u,
    jitter: a.jitter + (b.jitter - a.jitter) * u,
    scale: a.scale + (b.scale - a.scale) * u,
    distortion: a.distortion + (b.distortion - a.distortion) * u,
    symbolComplexity: a.symbolComplexity + (b.symbolComplexity - a.symbolComplexity) * u,
    rareEventRate: a.rareEventRate + (b.rareEventRate - a.rareEventRate) * u,
    growthRate: a.growthRate + (b.growthRate - a.growthRate) * u,
    decayRate: a.decayRate + (b.decayRate - a.decayRate) * u,
  };
}
