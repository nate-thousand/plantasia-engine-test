/**
 * Milestone 13C — Expressive performance animation.
 * Idle stays calm; interaction triggers dramatic GPU transforms + motion.
 */
import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import { getChoreographyForTheme, type ChoreographyProfile } from './PresetChoreography';
import { AMBIENT_PLAY } from './VisualMode';
import type { PresetTheme, VisualEnergyBehavior } from './types';
import type { VisualEnergyFrameInput, UnifiedVisualEnergyState } from './VisualEnergy';

export type AnimationMode = 'ambient' | 'performance';

export type PerformancePeakEvent = {
  kind: string;
  intensity: number;
  age: number;
};

export type ClusterTransform = {
  index: number;
  scale: number;
  rotate: number;
  translateX: number;
  translateY: number;
  breathe: number;
};

export type PerformanceAnimationState = {
  mode: AnimationMode;
  /** 0–1 performance intensity — rises fast, decays slowly (not used at idleHome). */
  performanceEnergy: number;
  /** ADSR envelope driven by audio + notes. */
  envelope: number;
  camera: {
    zoom: number;
    push: number;
    orbit: number;
    tilt: number;
    driftX: number;
    driftY: number;
  };
  layers: {
    background: { x: number; y: number; scale: number; rotate: number };
    middle: { x: number; y: number; scale: number; rotate: number };
    foreground: { x: number; y: number; scale: number; rotate: number };
  };
  clusters: ClusterTransform[];
  peakEvent: PerformancePeakEvent | null;
  shimmer: number;
  /** Pre-built CSS transform for the camera wrapper (GPU). */
  cameraTransform: string;
  /** Pre-built CSS transform for the composition layer. */
  compositionTransform: string;
  /** Extra glow on performance (CSS var). */
  glowBoost: number;
};

const PERFORMANCE_ENTER = 0.1;
const PERFORMANCE_DECAY = 0.55;
const ENVELOPE_ATTACK = 18;
const ENVELOPE_RELEASE = 2.8;
const PEAK_COOLDOWN_MS = 2800;

export function createPerformanceAnimationState(): PerformanceAnimationState {
  return emptyState();
}

function emptyState(): PerformanceAnimationState {
  return {
    mode: 'ambient',
    performanceEnergy: 0,
    envelope: 0,
    camera: { zoom: 0, push: 0, orbit: 0, tilt: 0, driftX: 0, driftY: 0 },
    layers: {
      background: { x: 0, y: 0, scale: 1, rotate: 0 },
      middle: { x: 0, y: 0, scale: 1, rotate: 0 },
      foreground: { x: 0, y: 0, scale: 1, rotate: 0 },
    },
    clusters: [],
    peakEvent: null,
    shimmer: 0,
    cameraTransform: '',
    compositionTransform: '',
    glowBoost: 0,
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Target performance energy from interaction — zero in idleHome; ambient floor while Play active. */
function performanceTarget(
  renderMode: import('./VisualMode').VisualRenderMode,
  energy: UnifiedVisualEnergyState,
  input: VisualEnergyFrameInput,
): number {
  if (renderMode === 'idleHome') {
    return 0;
  }

  let target = energy.playModeEnergy;
  target = Math.max(target, energy.visualEnergy * 0.85);
  target = Math.max(target, clamp01(input.sliderCombined * 0.55 + 0.1));

  if (input.ambientActive && target < AMBIENT_PLAY.playModeEnergyFloor + 0.04) {
    target = Math.max(target, AMBIENT_PLAY.choreographyBase);
  }

  if (input.activeNotes.length > 0) {
    target = Math.max(target, 0.55);
  }
  if (input.audio.isActive || input.audio.amplitude > 0.04) {
    target = Math.max(target, clamp01(input.audio.amplitude * 1.1 + input.audio.peak * 0.5));
  }
  if (input.pointerActivity > 0.08 || input.sliderDelta > 0.008) {
    target = Math.max(target, 0.4 + input.pointerActivity * 0.5);
  }
  return clamp01(target);
}

function envelopeTarget(input: VisualEnergyFrameInput): number {
  if (input.activeNotes.length > 0 || input.audio.amplitude > 0.06) {
    const vel =
      input.activeNotes.length > 0
        ? Math.max(...input.activeNotes.map((n) => n.velocity / 127))
        : input.audio.peak;
    return clamp01(0.35 + vel * 0.65 + input.audio.bass * 0.25);
  }
  if (input.ambientActive) {
    return clamp01(
      0.28 + input.audio.amplitude * 0.45 + input.audio.peak * 0.25 + AMBIENT_PLAY.choreographyBase * 0.35,
    );
  }
  return clamp01(input.audio.amplitude * 0.5 + input.audio.peak * 0.35);
}

function velocityAmplitude(input: VisualEnergyFrameInput): number {
  if (input.activeNotes.length === 0) {
    return 0.35 + input.audio.peak * 0.65;
  }
  const avg =
    input.activeNotes.reduce((s, n) => s + n.velocity, 0) / input.activeNotes.length / 127;
  return 0.4 + avg * 0.6;
}

function buildClusters(
  count: number,
  perf: number,
  env: number,
  time: number,
  choreo: ChoreographyProfile,
  audio: AudioVizFeedback,
  vel: number,
): ClusterTransform[] {
  const amp = perf * env * vel;
  const out: ClusterTransform[] = [];
  for (let i = 0; i < count; i += 1) {
    const phase = time * (0.4 + i * 0.17) * choreo.orbitSpeed;
    const breathe = Math.sin(phase) * 0.5 + 0.5;
    out.push({
      index: i,
      scale: 1 + amp * (0.08 + breathe * 0.22 * choreo.scalePulse),
      rotate: amp * choreo.rotationBias * (8 + i * 3) * Math.sin(phase * 1.3 + i),
      translateX: amp * (6 + audio.mid * 12) * Math.sin(phase + i * 0.8),
      translateY: amp * (4 + audio.bass * 8) * Math.cos(phase * 0.9 + i),
      breathe,
    });
  }
  return out;
}

function buildCssTransforms(
  perf: number,
  env: number,
  camera: PerformanceAnimationState['camera'],
  layers: PerformanceAnimationState['layers'],
  choreo: ChoreographyProfile,
): { cameraTransform: string; compositionTransform: string } {
  if (perf < 0.02) {
    return { cameraTransform: '', compositionTransform: '' };
  }

  const p = perf * env;
  const zoom = 1 + camera.zoom;
  const cameraTransform = [
    `translate3d(${camera.driftX.toFixed(2)}px, ${camera.driftY.toFixed(2)}px, 0)`,
    `perspective(900px)`,
    `translateZ(${camera.push.toFixed(2)}px)`,
    `rotateX(${camera.tilt.toFixed(2)}deg)`,
    `rotateZ(${camera.orbit.toFixed(2)}deg)`,
    `scale(${zoom.toFixed(4)})`,
  ].join(' ');

  const mid = layers.middle;
  const compositionTransform = [
    `translate3d(${mid.x.toFixed(2)}px, ${mid.y.toFixed(2)}px, 0)`,
    `rotate(${mid.rotate.toFixed(2)}deg)`,
    `scale(${mid.scale.toFixed(4)})`,
    choreo.wobble > 0.1 ? `skewX(${(p * choreo.wobble * 3).toFixed(2)}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return { cameraTransform, compositionTransform };
}

function maybeTriggerPeak(
  prev: PerformancePeakEvent | null,
  perf: number,
  choreo: ChoreographyProfile,
  timeMs: number,
  lastPeakAt: number,
): { event: PerformancePeakEvent | null; lastPeakAt: number } {
  if (perf < 0.72 || timeMs - lastPeakAt < PEAK_COOLDOWN_MS) {
    if (prev && prev.age < 1.2) {
      return { event: { ...prev, age: prev.age + 0.016 }, lastPeakAt };
    }
    return { event: prev && prev.age < 2 ? { ...prev, age: prev.age + 0.016 } : null, lastPeakAt };
  }

  if (Math.random() > 0.004 * perf) {
    return { event: prev, lastPeakAt };
  }

  return {
    event: { kind: choreo.peakStyle, intensity: perf, age: 0 },
    lastPeakAt: timeMs,
  };
}

let lastPeakAtMs = 0;

export function tickPerformanceAnimation(
  prev: PerformanceAnimationState,
  input: VisualEnergyFrameInput,
  energy: UnifiedVisualEnergyState,
  theme: PresetTheme,
  timeSec: number,
  deltaMs: number,
  reduceMotion: boolean,
): PerformanceAnimationState {
  const dt = Math.min(deltaMs / 1000, 0.05);
  const renderMode = energy.renderMode;
  const choreo = getChoreographyForTheme(theme);

  if (renderMode === 'idleHome' || reduceMotion) {
    const decay = Math.exp(-PERFORMANCE_DECAY * 2.5 * dt);
    const perf = prev.performanceEnergy * decay;
    if (perf < 0.01) {
      return emptyState();
    }
    return {
      ...prev,
      mode: 'ambient',
      performanceEnergy: perf,
      envelope: prev.envelope * decay,
      camera: {
        zoom: prev.camera.zoom * decay,
        push: prev.camera.push * decay,
        orbit: prev.camera.orbit * decay,
        tilt: prev.camera.tilt * decay,
        driftX: prev.camera.driftX * decay,
        driftY: prev.camera.driftY * decay,
      },
      shimmer: prev.shimmer * decay,
      glowBoost: prev.glowBoost * decay,
      peakEvent: null,
      ...buildCssTransforms(perf, prev.envelope * decay, prev.camera, prev.layers, choreo),
    };
  }

  const target = performanceTarget(renderMode, energy, input);
  const rise = target > prev.performanceEnergy ? 14 : PERFORMANCE_DECAY;
  const perf =
    target > prev.performanceEnergy
      ? prev.performanceEnergy + (target - prev.performanceEnergy) * Math.min(1, rise * dt)
      : prev.performanceEnergy * Math.exp(-rise * dt);

  const envTarget = envelopeTarget(input);
  const envRate = envTarget > prev.envelope ? ENVELOPE_ATTACK : ENVELOPE_RELEASE;
  const envelope =
    envTarget > prev.envelope
      ? prev.envelope + (envTarget - prev.envelope) * Math.min(1, envRate * dt)
      : prev.envelope + (envTarget - prev.envelope) * Math.min(1, envRate * dt);

  const mode: AnimationMode = perf >= PERFORMANCE_ENTER ? 'performance' : 'ambient';
  const p = perf * envelope;
  const vel = velocityAmplitude(input);
  const { audio } = input;

  const bassPulse = audio.bass * p * choreo.scalePulse * vel;
  const midSpin = audio.mid * p * choreo.rotationBias * vel;
  const trebleShimmer = audio.treble * p * choreo.shimmer;

  const camera = {
    zoom: p * (0.06 + bassPulse * 0.14),
    push: p * (8 + bassPulse * 28 * choreo.cameraPush),
    orbit: midSpin * 4.5 * choreo.orbitSpeed + Math.sin(timeSec * 0.6) * p * 1.2,
    tilt: midSpin * 2.8 + bassPulse * 1.5,
    driftX: Math.sin(timeSec * 0.35) * p * 6 * choreo.parallax,
    driftY: Math.cos(timeSec * 0.28) * p * 4 * choreo.parallax,
  };

  const layers = {
    background: {
      x: Math.sin(timeSec * 0.12) * p * 3,
      y: Math.cos(timeSec * 0.1) * p * 2,
      scale: 1 + p * 0.02,
      rotate: timeSec * 0.4 * p * 0.15,
    },
    middle: {
      x: Math.sin(timeSec * 0.45 + audio.mid) * p * (10 + vel * 8),
      y: Math.cos(timeSec * 0.38 + audio.bass) * p * (6 + vel * 5),
      scale: 1 + p * (0.04 + bassPulse * 0.12),
      rotate: midSpin * 6 + camera.orbit * 0.35,
    },
    foreground: {
      x: Math.sin(timeSec * 0.9) * p * (14 + trebleShimmer * 10),
      y: Math.cos(timeSec * 0.75) * p * (10 + trebleShimmer * 8),
      scale: 1 + p * (0.06 + trebleShimmer * 0.08),
      rotate: trebleShimmer * 3.5,
    },
  };

  const clusterCount = 7;
  const clusters = buildClusters(clusterCount, perf, envelope, timeSec, choreo, audio, vel);

  const peakResult = maybeTriggerPeak(prev.peakEvent, perf, choreo, timeSec * 1000, lastPeakAtMs);
  lastPeakAtMs = peakResult.lastPeakAt;

  const css = buildCssTransforms(perf, envelope, camera, layers, choreo);

  return {
    mode,
    performanceEnergy: perf,
    envelope,
    camera,
    layers,
    clusters,
    peakEvent: peakResult.event,
    shimmer: trebleShimmer,
    glowBoost: p * 0.65,
    ...css,
  };
}

/** Boost ASCII behavior knobs during performance — ambient uses baseline behavior only. */
export function amplifyBehaviorForPerformance(
  behavior: VisualEnergyBehavior,
  perf: PerformanceAnimationState,
): VisualEnergyBehavior {
  const p = perf.performanceEnergy * perf.envelope;
  if (p < 0.06) {
    return behavior;
  }

  if (perf.mode === 'ambient' && p < 0.22) {
    return behavior;
  }

  const boost = p ** 0.82;
  return {
    density: behavior.density,
    speed: behavior.speed * (1 + boost * 2.8),
    spread: behavior.spread * (1 + boost * 1.4),
    brightness: clamp01(behavior.brightness + boost * 0.4),
    jitter: clamp01(behavior.jitter + boost * 0.55),
    scale: behavior.scale + boost * 0.18,
    distortion: clamp01(behavior.distortion + boost * 0.45),
    symbolComplexity: clamp01(behavior.symbolComplexity + boost * 0.35),
    rareEventRate: clamp01(behavior.rareEventRate + boost * 0.3),
    growthRate: behavior.growthRate + boost * 0.55,
    decayRate: clamp01(behavior.decayRate - boost * 0.12),
  };
}
