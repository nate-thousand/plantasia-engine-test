/**
 * Milestone 15C — extreme expressive interaction response.
 * Amplifies visuals only during interaction; idle stays sparse.
 */
import type { EnergySourceKey, SourceEnergyMap, VisualEnergyBehavior, VisualEnergyFrameInput } from './VisualEnergy';
import { PEAK_REACTIVE_DENSITY } from './VisualEnergy';
import { VISUAL_DENSITY_SCALE } from './visualConstants';

export type ResponseProfile = 'subtle' | 'normal' | 'extreme';

/** Default performance profile — no UI yet. */
export const ACTIVE_RESPONSE_PROFILE: ResponseProfile = 'extreme';

const PEAK_DENSITY_EXTREME = PEAK_REACTIVE_DENSITY;

export type InteractionLimits = {
  maxGlyphScale: number;
  maxRotation: number;
  maxVelocity: number;
  maxParticleBurst: number;
  maxDensity: number;
  maxScreenCoverage: number;
};

export type ResponseProfileConfig = {
  interactionIntensity: number;
  limits: InteractionLimits;
};

export const RESPONSE_PROFILES: Record<ResponseProfile, ResponseProfileConfig> = {
  subtle: {
    interactionIntensity: 0.7,
    limits: {
      maxGlyphScale: 1.45,
      maxRotation: 0.35,
      maxVelocity: 8,
      maxParticleBurst: 48,
      maxDensity: 0.32 * VISUAL_DENSITY_SCALE,
      maxScreenCoverage: 0.22 * VISUAL_DENSITY_SCALE,
    },
  },
  normal: {
    interactionIntensity: 1.0,
    limits: {
      maxGlyphScale: 1.75,
      maxRotation: 0.55,
      maxVelocity: 12,
      maxParticleBurst: 72,
      maxDensity: 0.36 * VISUAL_DENSITY_SCALE,
      maxScreenCoverage: 0.28 * VISUAL_DENSITY_SCALE,
    },
  },
  extreme: {
    interactionIntensity: 2.0,
    limits: {
      maxGlyphScale: 2.2,
      maxRotation: 0.85,
      maxVelocity: 18,
      maxParticleBurst: 96,
      maxDensity: PEAK_DENSITY_EXTREME,
      maxScreenCoverage: 0.32 * VISUAL_DENSITY_SCALE,
    },
  },
};

export type InteractionFrameState = {
  profile: ResponseProfile;
  interactionIntensity: number;
  /** Combined interaction level 0–1 (zero when idle). */
  interactionBoost: number;
  isInteracting: boolean;
  activeSource: EnergySourceKey | 'idle';
  limits: InteractionLimits;
  /** Velocity-weighted note punch 0–1. */
  notePulse: number;
  /** Control/slider punch 0–1. */
  controlPulse: number;
  /** Pointer/touch punch 0–1. */
  pointerPulse: number;
  /** Preset transition punch 0–1. */
  presetPulse: number;
};

const INTERACTION_SOURCES: EnergySourceKey[] = [
  'midi',
  'keyboard',
  'pointer',
  'touch',
  'control',
  'preset',
  'ui',
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getActiveProfileConfig(
  profile: ResponseProfile = ACTIVE_RESPONSE_PROFILE,
): ResponseProfileConfig {
  return RESPONSE_PROFILES[profile];
}

export function getInteractionIntensity(profile: ResponseProfile = ACTIVE_RESPONSE_PROFILE): number {
  return getActiveProfileConfig(profile).interactionIntensity;
}

/** Scale discrete event amounts (0–127) by active profile. */
export function scaleEventAmount(amount: number, profile: ResponseProfile = ACTIVE_RESPONSE_PROFILE): number {
  const scaled = amount * getInteractionIntensity(profile);
  return amount > 1 ? Math.min(127, Math.round(scaled)) : clamp01(scaled);
}

/** Detect whether any interaction channel is active (not idle ambient breathe). */
export function detectInteraction(
  sources: SourceEnergyMap,
  input: VisualEnergyFrameInput,
): {
  isInteracting: boolean;
  activeSource: EnergySourceKey | 'idle';
  boost: number;
  notePulse: number;
  controlPulse: number;
  pointerPulse: number;
  presetPulse: number;
} {
  let bestKey: EnergySourceKey | 'idle' = 'idle';
  let bestScore = 0;

  const notePulse = clamp01(
    Math.max(sources.midi.impulse, sources.keyboard.impulse) * 1.2 +
      Math.max(sources.midi.current, sources.keyboard.current),
  );

  const controlPulse = clamp01(
    sources.control.impulse * 1.4 + sources.control.current * 1.1 + input.sliderDelta * 8,
  );

  const pointerPulse = clamp01(
    Math.max(sources.pointer.impulse, sources.touch.impulse) * 1.1 +
      Math.max(sources.pointer.current, sources.touch.current) +
      input.pointerVelocity * 0.85,
  );

  const presetPulse = clamp01(sources.preset.impulse * 1.3 + input.presetTransition * 0.95);

  const uiPulse = clamp01(sources.ui.impulse * 1.2 + sources.ui.current + input.interactionBoost / 127);

  const scores: Record<EnergySourceKey, number> = {
    audio: 0,
    midi: notePulse * (sources.midi.impulse > 0.05 ? 1.35 : 1),
    keyboard: notePulse * (sources.keyboard.impulse > 0.05 ? 1.35 : 1),
    pointer: pointerPulse * (input.pointerActive ? 1.2 : 1),
    touch: pointerPulse * (input.isTouch ? 1.35 : 0.85),
    control: controlPulse,
    preset: presetPulse,
    ui: uiPulse,
  };

  for (const key of INTERACTION_SOURCES) {
    const score = scores[key];
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  const boost = clamp01(
    Math.max(notePulse, controlPulse, pointerPulse, presetPulse, uiPulse),
  );

  const isInteracting =
    boost > 0.08 ||
    input.sliderDelta > 0.003 ||
    input.presetTransition > 0.06 ||
    input.interactionBoost > 8 ||
    input.activeNotes.length > 0 ||
    (input.pointerActive && input.pointerActivity > 0.05) ||
    input.isTouch;

  return {
    isInteracting,
    activeSource: isInteracting ? bestKey : 'idle',
    boost,
    notePulse,
    controlPulse,
    pointerPulse,
    presetPulse,
  };
}

export function computeInteractionFrame(
  sources: SourceEnergyMap,
  input: VisualEnergyFrameInput,
  profile: ResponseProfile = ACTIVE_RESPONSE_PROFILE,
): InteractionFrameState {
  const config = getActiveProfileConfig(profile);
  const detected = detectInteraction(sources, input);
  const intensity = config.interactionIntensity;

  return {
    profile,
    interactionIntensity: intensity,
    interactionBoost: detected.isInteracting ? clamp01(detected.boost * intensity * 0.55) : 0,
    isInteracting: detected.isInteracting,
    activeSource: detected.activeSource,
    limits: config.limits,
    notePulse: detected.notePulse,
    controlPulse: detected.controlPulse,
    pointerPulse: detected.pointerPulse,
    presetPulse: detected.presetPulse,
  };
}

/** Particle burst multiplier — 1 when idle, up to interactionIntensity when active. */
export function interactionParticleScale(frame: InteractionFrameState): number {
  if (!frame.isInteracting) {
    return 1;
  }
  return 1 + frame.interactionBoost * frame.interactionIntensity;
}

export function clampParticleBurst(count: number, frame: InteractionFrameState): number {
  const scaled = Math.round(count * interactionParticleScale(frame));
  return Math.min(frame.limits.maxParticleBurst, Math.max(0, scaled));
}

export function clampGlyphScale(scale: number, frame: InteractionFrameState): number {
  return clamp(scale, 0.5, frame.limits.maxGlyphScale);
}

export function clampGlyphRotation(rad: number, frame: InteractionFrameState): number {
  return clamp(rad, -frame.limits.maxRotation, frame.limits.maxRotation);
}

export function clampDensity(density: number, frame: InteractionFrameState): number {
  return clamp(density, 0.05, frame.limits.maxDensity);
}

/** Amplify behavior knobs only during interaction — idle unchanged. */
export function amplifyBehaviorForInteraction(
  behavior: VisualEnergyBehavior,
  frame: InteractionFrameState,
): VisualEnergyBehavior {
  if (!frame.isInteracting || frame.interactionBoost < 0.04) {
    return behavior;
  }

  const b = frame.interactionBoost;
  const i = frame.interactionIntensity;
  const note = frame.notePulse;
  const control = frame.controlPulse;
  const pointer = frame.pointerPulse;
  const preset = frame.presetPulse;

  return {
    density: clampDensity(behavior.density + b * 0.12 * i, frame),
    speed: behavior.speed * (1 + b * 1.8 * i),
    spread: clamp01(behavior.spread + b * 0.55 * i + pointer * 0.25),
    brightness: clamp01(behavior.brightness + b * 0.45 * i + note * 0.35),
    jitter: clamp01(behavior.jitter + b * 0.65 * i + control * 0.3 + note * 0.2),
    scale: clampGlyphScale(behavior.scale + b * 0.35 * i + note * 0.25, frame),
    distortion: clamp01(behavior.distortion + b * 0.5 * i + control * 0.35 + preset * 0.2),
    symbolComplexity: clamp01(behavior.symbolComplexity + b * 0.4 * i + note * 0.3),
    rareEventRate: clamp01(behavior.rareEventRate + b * 0.35 * i + preset * 0.25),
    growthRate: behavior.growthRate + b * 0.65 * i + control * 0.35,
    decayRate: clamp01(behavior.decayRate - b * 0.15 * i),
  };
}

/** Ripple radius in grid cells from interaction. */
export function interactionRippleRadius(frame: InteractionFrameState, base = 3): number {
  if (!frame.isInteracting) {
    return base;
  }
  return Math.min(24, base + frame.interactionBoost * 14 * frame.interactionIntensity);
}

/** Symbol mutation probability boost during interaction. */
export function interactionMutationBoost(frame: InteractionFrameState, baseJitter: number): number {
  if (!frame.isInteracting) {
    return baseJitter;
  }
  return clamp01(baseJitter + frame.interactionBoost * 0.45 * frame.interactionIntensity);
}

/** Opacity pulse for glyph accents. */
export function interactionOpacityPulse(frame: InteractionFrameState, base = 0.82): number {
  if (!frame.isInteracting) {
    return base;
  }
  const pulse = Math.sin(Date.now() * 0.012) * 0.5 + 0.5;
  return clamp01(base + frame.interactionBoost * 0.18 * pulse + frame.notePulse * 0.12);
}
