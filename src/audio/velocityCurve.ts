export type VelocityCurve = 'soft' | 'normal' | 'bright';

/** Map raw MIDI velocity through a preset response curve. */
export function scaleMidiVelocity(
  velocity: number,
  curve: VelocityCurve = 'normal',
): number {
  const norm = Math.max(0, Math.min(1, velocity / 127));
  let scaled: number;

  switch (curve) {
    case 'soft':
      scaled = norm ** 1.6;
      break;
    case 'bright':
      scaled = norm ** 0.65;
      break;
    default:
      scaled = norm;
  }

  return Math.max(1, Math.min(127, Math.round(scaled * 127)));
}

/** Normalized gain (0–1) for Tone triggerAttack velocity argument. */
export function velocityToGain(velocity: number, curve: VelocityCurve = 'normal'): number {
  return scaleMidiVelocity(velocity, curve) / 127;
}
