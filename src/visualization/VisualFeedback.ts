/** Global visual feedback multiplier — animations, bursts, and overlays scale from this. */
export const FEEDBACK_GAIN = 5;

export function feedbackScale(value: number, cap?: number): number {
  const scaled = value * FEEDBACK_GAIN;
  return cap === undefined ? scaled : Math.min(cap, scaled);
}

/** Lower thresholds so slider overlays and bursts trigger sooner. */
export function feedbackThreshold(base: number): number {
  return base / FEEDBACK_GAIN;
}
