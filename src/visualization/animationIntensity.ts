/**
 * Animation intensity mapping — static idle at 10%, full input at 100% extreme.
 * Small inputs use a power curve so any interaction produces a dramatic visual jump.
 */
import type { VisualEnergyBehavior } from './types';

/** Subtle baseline when nothing is playing or interacting. */
export const STATIC_ANIMATION_RATIO = 0.1;

/** Peak intensity on heavy input. */
export const EXTREME_ANIMATION_RATIO = 1;

/** Lower = steeper response to small inputs (0.35 ≈ 4× lift at 25% raw). */
export const INPUT_RESPONSE_EXPONENT = 0.35;

/** Demo-only audio lift — stays well below performance peaks. */
export const DEMO_AMBIENT_ANIMATION_RATIO = 0.16;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Map raw 0–1 energy to 10%–100% animation intensity. */
export function remapAnimationIntensity(rawEnergy: number): number {
  const raw = clamp01(rawEnergy);
  if (raw <= 0.001) {
    return STATIC_ANIMATION_RATIO;
  }
  const t = Math.pow(raw, INPUT_RESPONSE_EXPONENT);
  return STATIC_ANIMATION_RATIO + t * (EXTREME_ANIMATION_RATIO - STATIC_ANIMATION_RATIO);
}

/** Normalized span within the 10%–100% range (0 at floor, 1 at ceiling). */
export function animationIntensitySpan(intensity: number): number {
  const span = EXTREME_ANIMATION_RATIO - STATIC_ANIMATION_RATIO;
  if (span <= 0) {
    return 0;
  }
  return clamp01((intensity - STATIC_ANIMATION_RATIO) / span);
}

/** Scale behavior knobs from remapped intensity — extreme ratio at full input. */
export function behaviorFromAnimationIntensity(
  base: VisualEnergyBehavior,
  intensity: number,
  reduceMotion: boolean,
): VisualEnergyBehavior {
  const span = animationIntensitySpan(intensity);
  const motionMul = reduceMotion ? 0.55 + span * 1.1 : 0.35 + span * 2.65;
  const spreadMul = 0.25 + span * 1.75;
  const jitterMul = reduceMotion ? 0.15 + span * 0.45 : 0.08 + span * 1.35;

  return {
    density: base.density * (0.55 + span * 1.05),
    speed: base.speed * motionMul,
    spread: clamp01(base.spread * spreadMul),
    brightness: clamp01(0.32 + span * 0.68 + base.brightness * 0.25),
    jitter: clamp01(base.jitter * jitterMul + span * 0.35),
    scale: base.scale + span * 0.22,
    distortion: clamp01(base.distortion + span * 0.62),
    symbolComplexity: clamp01(0.08 + span * 0.82),
    rareEventRate: clamp01(base.rareEventRate + span * 0.55),
    growthRate: base.growthRate * (0.4 + span * 1.6),
    decayRate: clamp01(base.decayRate - span * 0.18),
  };
}
