import {
  SPARSE_IDLE_DENSITY,
  PEAK_REACTIVE_DENSITY,
  densityFromVisualEnergy,
} from './VisualEnergy';

/** @deprecated use SPARSE_IDLE_DENSITY — kept for imports that expect AMBIENT_ASCII_SCALE */
export const AMBIENT_ASCII_SCALE = SPARSE_IDLE_DENSITY;

/** @deprecated use PEAK_REACTIVE_DENSITY */
export const PEAK_ASCII_SCALE = PEAK_REACTIVE_DENSITY;

/** Visual responsiveness — maximum punch on every interaction. */
export const FEEDBACK_GAIN = 40;

/** How many stacked flares fire per interaction event. */
export const INTERACTION_FLARE_LAYERS = 3;

/** Audio-reactive slider boost (keeps params from pegging when loud). */
export const AUDIO_VIZ_GAIN = 1.5;

/** Cap ASCII grid resolution for stable frame times. */
export const MAX_GRID_WIDTH = 60;
export const MAX_GRID_HEIGHT = 36;

/** Target visualization frame rate. */
export const TARGET_VIZ_FPS = 45;

/** How long interaction pulse lingers on screen (0–127 scale per frame). */
export const INTERACTION_DECAY_STEP = 0.08;

export function feedbackScale(value: number, cap?: number): number {
  const scaled = value * FEEDBACK_GAIN;
  return cap === undefined ? scaled : Math.min(cap, scaled);
}

/** Lower thresholds so slider overlays and bursts trigger at sensible levels. */
export function feedbackThreshold(base: number): number {
  return base / FEEDBACK_GAIN;
}

export function maxParticleCount(density: number): number {
  return Math.round(420 + density * 4.8);
}

/** Scale raw interaction intensity to the 0–127 pulse range. */
export function interactionPulseAmount(raw: number): number {
  return Math.min(127, Math.round(raw * (FEEDBACK_GAIN / 4)));
}

/**
 * Map interaction pulse to density when visualEnergy is unavailable.
 * Prefer densityFromVisualEnergy() in new code.
 */
export function asciiDensityScale(interactionPulse: number): number {
  const norm = Math.max(0, Math.min(1, interactionPulse / 127));
  return SPARSE_IDLE_DENSITY + norm * (PEAK_REACTIVE_DENSITY - SPARSE_IDLE_DENSITY);
}

/** Density from normalized visual energy (primary API). */
export { densityFromVisualEnergy };
