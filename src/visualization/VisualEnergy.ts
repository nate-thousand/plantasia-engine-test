import { VISUAL_DENSITY_SCALE } from './visualConstants';
import {
  DEMO_AMBIENT_ANIMATION_RATIO,
  remapAnimationIntensity,
  STATIC_ANIMATION_RATIO,
  behaviorFromAnimationIntensity,
} from './animationIntensity';
import {
  AMBIENT_PLAY,
  displayVisualEnergy,
  resolveVisualRenderMode,
  tickPlayModeEnergy,
} from './VisualMode';
import { getAmbientGenerativeState } from '../audio/ambient/ambientStateStore';
import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import type { ActiveNoteState } from '../stores/engineStore';
import type { VizAccessibility } from './types';

export { VISUAL_DENSITY_SCALE } from './visualConstants';

/** Sparse idle baseline — shape coverage, not wallpaper density (13F). */
export const SPARSE_IDLE_DENSITY = 0.08 * VISUAL_DENSITY_SCALE;

/** Peak reactive — capped so shapes stay readable (13F). */
export const PEAK_REACTIVE_DENSITY = 0.38 * VISUAL_DENSITY_SCALE;

/** Below this normalized energy, only sparse idle painters run. */
export const FULL_SCENE_ENERGY_THRESHOLD = 0.22;

/** Per-input energy channels — each 0–1 after smoothing. */
export type EnergySourceKey =
  | 'audio'
  | 'midi'
  | 'keyboard'
  | 'pointer'
  | 'touch'
  | 'control'
  | 'preset'
  | 'ui';

export const ENERGY_SOURCE_KEYS: readonly EnergySourceKey[] = [
  'audio',
  'midi',
  'keyboard',
  'pointer',
  'touch',
  'control',
  'preset',
  'ui',
] as const;

/** One decaying impulse + smoothed level for a single input source. */
export type SourceEnergyChannel = {
  /** Smoothed level 0–1 (what the renderer reads). */
  current: number;
  /** Decaying burst from discrete events (note hit, preset change, button press). */
  impulse: number;
};

export type SourceEnergyMap = Record<EnergySourceKey, SourceEnergyChannel>;

/** Full unified visual energy state — one model for all ASCII reactivity. */
export type UnifiedVisualEnergyState = {
  /** Combined normalized intensity 0–1. */
  visualEnergy: number;
  /** Interaction latch — rises on play/input, decays to idle in ~5.5s. */
  playModeEnergy: number;
  /** idleHome (default) vs activePlay (reactive). */
  renderMode: import('./VisualMode').VisualRenderMode;
  /** Energy value passed to painters (capped in idleHome). */
  displayEnergy: number;
  sources: SourceEnergyMap;
};

/** Derived ASCII behavior knobs from combined + per-source energy. */
export type VisualEnergyBehavior = {
  density: number;
  speed: number;
  spread: number;
  brightness: number;
  jitter: number;
  scale: number;
  distortion: number;
  symbolComplexity: number;
  rareEventRate: number;
  growthRate: number;
  decayRate: number;
};

/** Frame inputs sampled before smoothing (from stores + audio tap). */
export type VisualEnergyFrameInput = {
  audio: AudioVizFeedback;
  activeNotes: ActiveNoteState[];
  pointerActivity: number;
  pointerVelocity: number;
  pointerActive: boolean;
  isTouch: boolean;
  sliderCombined: number;
  sliderDelta: number;
  presetTransition: number;
  interactionBoost: number;
  reduceMotion: boolean;
  /** Transport ambient session — Play active (Milestone 13D). */
  ambientActive: boolean;
  /** Title screen cleared — user pressed spacebar. */
  sessionStarted: boolean;
};

export function createSourceEnergyMap(): SourceEnergyMap {
  return {
    audio: { current: 0, impulse: 0 },
    midi: { current: 0, impulse: 0 },
    keyboard: { current: 0, impulse: 0 },
    pointer: { current: 0, impulse: 0 },
    touch: { current: 0, impulse: 0 },
    control: { current: 0, impulse: 0 },
    preset: { current: 0, impulse: 0 },
    ui: { current: 0, impulse: 0 },
  };
}

export function createUnifiedVisualEnergyState(): UnifiedVisualEnergyState {
  const sources = createSourceEnergyMap();
  const idle = STATIC_ANIMATION_RATIO;
  return {
    visualEnergy: idle,
    playModeEnergy: idle,
    renderMode: 'idleHome',
    displayEnergy: idle,
    sources,
  };
}

/** Bump a source channel impulse (0–1). Called from input hooks on discrete events. */
export function pulseSourceImpulse(
  sources: SourceEnergyMap,
  source: EnergySourceKey,
  amount: number,
): SourceEnergyMap {
  const norm = clamp01(amount > 1 ? amount / 127 : amount);
  const channel = sources[source];
  return {
    ...sources,
    [source]: { ...channel, impulse: Math.max(channel.impulse, norm) },
  };
}

/** Per-source sustain targets from continuous frame inputs. */
function sustainTargets(input: VisualEnergyFrameInput): Record<EnergySourceKey, number> {
  const audio =
    input.audio.isActive || input.audio.amplitude > 0.02
      ? clamp01(input.audio.amplitude * 0.85 + input.audio.peak * 0.45)
      : input.ambientActive
        ? (() => {
            const gen = getAmbientGenerativeState();
            const base =
              DEMO_AMBIENT_ANIMATION_RATIO *
              (0.85 + Math.sin(Date.now() * 0.00035) * 0.15);
            const generative =
              gen.voiceDensity * 0.12 +
              gen.padEnergy * 0.1 +
              gen.textureAmount * 0.08 +
              gen.recentActivity * 0.14 +
              gen.evolutionPhase * 0.05 +
              (gen.soundWorld === 'plantasonic' ? gen.textureAmount * 0.06 : 0) +
              (gen.soundWorld === 'juno-flowers' ? gen.stereoSpread * 0.05 : 0);
            return clamp01(base + generative);
          })()
        : 0;

  let midiSustain = 0;
  let keyboardSustain = 0;
  for (const note of input.activeNotes) {
    const v = clamp01(0.25 + (note.velocity / 127) * 0.75);
    if (note.source === 'midi') {
      midiSustain = Math.max(midiSustain, v);
    } else {
      keyboardSustain = Math.max(keyboardSustain, v);
    }
  }

  const pointerBase = input.isTouch ? 0 : input.pointerActivity;
  const touchBase = input.isTouch ? input.pointerActivity : input.pointerActive ? input.pointerActivity * 0.6 : 0;
  const pointerBoost = input.pointerVelocity * (input.isTouch ? 0.9 : 0.55);

  const control =
    input.sliderDelta > 0.002
      ? clamp01(input.sliderCombined * 0.45 + input.sliderDelta * 8)
      : clamp01(input.sliderDelta * 3);
  const preset = clamp01(input.presetTransition * 0.85);
  const ui = clamp01(input.interactionBoost / 127);

  return {
    audio,
    midi: midiSustain,
    keyboard: keyboardSustain,
    pointer: clamp01(pointerBase + pointerBoost),
    touch: clamp01(touchBase + (input.isTouch ? pointerBoost : 0)),
    control,
    preset,
    ui,
  };
}

/** Impulse decay rate per source (per second) — higher = faster fade. */
const IMPULSE_DECAY: Record<EnergySourceKey, number> = {
  audio: 4,
  midi: 3.2,
  keyboard: 3.2,
  pointer: 5.5,
  touch: 4.8,
  control: 4.5,
  preset: 2.8,
  ui: 4,
};

/** Smoothing rise/fall rates per source (per second). */
const SOURCE_RISE: Record<EnergySourceKey, number> = {
  audio: 6,
  midi: 8,
  keyboard: 8,
  pointer: 7,
  touch: 9,
  control: 6,
  preset: 5,
  ui: 7,
};

const SOURCE_FALL: Record<EnergySourceKey, number> = {
  audio: 1.2,
  midi: 1.8,
  keyboard: 1.8,
  pointer: 1.4,
  touch: 1.6,
  control: 2.2,
  preset: 1.5,
  ui: 2,
};

/** Weights for combining source channels into visualEnergy. */
const COMBINE_WEIGHTS: Record<EnergySourceKey, number> = {
  audio: 0.28,
  midi: 0.16,
  keyboard: 0.16,
  pointer: 0.1,
  touch: 0.1,
  control: 0.08,
  preset: 0.07,
  ui: 0.05,
};

/**
 * Advance all source channels and compute combined visualEnergy.
 * Energy rises quickly on input and decays slowly when idle.
 */
export function tickUnifiedVisualEnergy(
  state: UnifiedVisualEnergyState,
  input: VisualEnergyFrameInput,
  deltaMs: number,
  accessibility: Pick<VizAccessibility, 'reduceMotion'>,
): UnifiedVisualEnergyState {
  const dt = Math.min(deltaMs / 1000, 0.05);
  const motionScale = accessibility.reduceMotion ? 0.65 : 1;
  const sustains = sustainTargets(input);
  const nextSources = { ...state.sources };

  for (const key of ENERGY_SOURCE_KEYS) {
    const channel = state.sources[key];
    const decayedImpulse = channel.impulse * Math.exp(-IMPULSE_DECAY[key] * dt * motionScale);
    const target = Math.max(sustains[key], decayedImpulse);
    const rise = SOURCE_RISE[key] * motionScale;
    const fall = SOURCE_FALL[key] * motionScale;
    const rate = target > channel.current ? rise : fall;
    const current = channel.current + (target - channel.current) * Math.min(1, rate * dt);
    nextSources[key] = { current: clamp01(current), impulse: decayedImpulse };
  }

  let combined = 0;
  for (const key of ENERGY_SOURCE_KEYS) {
    combined += nextSources[key].current * COMBINE_WEIGHTS[key];
  }

  const playModeEnergy = tickPlayModeEnergy(state.playModeEnergy, input, deltaMs);
  const renderMode = resolveVisualRenderMode(
    playModeEnergy,
    input.ambientActive,
    input.sessionStarted,
  );
  const visualEnergy = remapAnimationIntensity(combined);
  const displayEnergy = displayVisualEnergy(
    renderMode,
    visualEnergy,
    remapAnimationIntensity(playModeEnergy),
    input.ambientActive,
  );

  return {
    visualEnergy,
    playModeEnergy,
    renderMode,
    displayEnergy,
    sources: nextSources,
  };
}

/** Map combined energy → ASCII density multiplier. */
export function densityFromVisualEnergy(energy: number): number {
  const norm = clamp01(energy);
  return SPARSE_IDLE_DENSITY + norm * (PEAK_REACTIVE_DENSITY - SPARSE_IDLE_DENSITY);
}

/** Motion speed multiplier — 10% idle breathes slowly; 100% input is extreme. */
export function motionFromVisualEnergy(energy: number, reduceMotion: boolean): number {
  const intensity = remapAnimationIntensity(energy);
  const span = (intensity - STATIC_ANIMATION_RATIO) / (1 - STATIC_ANIMATION_RATIO);
  const base = reduceMotion ? 0.22 : 0.18;
  const peak = reduceMotion ? 1.05 : 2.45;
  return base + span * (peak - base);
}

export function shouldRenderFullScene(_energy: number, _ambientActive = false): boolean {
  /** Milestone 13F — wallpaper full scenes disabled; shape composition only. */
  return false;
}

export function fullSceneBlend(energy: number, ambientActive = false): number {
  const threshold = ambientActive ? AMBIENT_PLAY.fullSceneThreshold : FULL_SCENE_ENERGY_THRESHOLD;
  if (energy <= threshold) {
    return 0;
  }
  return Math.min(1, (energy - threshold) / (1 - threshold));
}

/** Map unified energy + per-source levels → renderer behavior knobs. */
export function behaviorFromVisualEnergy(
  energy: number,
  sources: SourceEnergyMap,
  reduceMotion: boolean,
): VisualEnergyBehavior {
  const intensity = remapAnimationIntensity(energy);
  const e = clamp01(energy);
  const control = sources.control.current;
  const preset = sources.preset.current;
  const noteBloom = Math.max(sources.midi.current, sources.keyboard.current);

  const base: VisualEnergyBehavior = {
    density: densityFromVisualEnergy(intensity),
    speed: motionFromVisualEnergy(e, reduceMotion),
    spread: 0.04 + e * 0.52 + noteBloom * 0.14,
    brightness: 0.34 + e * 0.66 + sources.ui.current * 0.12,
    jitter: reduceMotion ? e * 0.04 + preset * 0.06 : e * 0.28 + preset * 0.22 + control * 0.12,
    scale: 0.88 + e * 0.14,
    distortion: clamp01(e * 0.32 + control * 0.42 + sources.audio.current * 0.15),
    symbolComplexity: 0.1 + e * 0.52,
    rareEventRate: clamp01(e * 0.14 + preset * 0.24 + noteBloom * 0.1),
    growthRate: 0.14 + e * 0.52 + noteBloom * 0.16 + sources.touch.current * 0.08,
    decayRate: clamp01(0.96 - e * 0.22 - noteBloom * 0.1),
  };

  return behaviorFromAnimationIntensity(base, intensity, reduceMotion);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
