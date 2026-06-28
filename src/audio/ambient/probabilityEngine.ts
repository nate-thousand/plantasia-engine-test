import type { AmbientHarmonicProfile } from './harmonicProfile';
import { PENTATONIC_INTERVALS } from './scales';

export type VoiceKind = 'drone' | 'pad' | 'bell' | 'pluck' | 'air' | 'sub';

export type NotePickResult =
  | { kind: 'note'; midi: number; degree: number }
  | { kind: 'pause' }
  | { kind: 'registerShift'; degree: number; octaveDelta: number };

/** Weighted random — returns true with given probability 0–1. */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/** Pick from weighted options. */
export function weightedPick<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option.value;
    }
  }
  return options[options.length - 1]!.value;
}

function degreeToMidi(profile: AmbientHarmonicProfile, degree: number, octaveOffset = 0): number {
  const noteCount = profile.presetIntervals?.length ?? 5;
  const wrapped = ((degree % noteCount) + noteCount) % noteCount;
  const rootPc = profile.rootMidi % 12;
  const intervals =
    profile.presetIntervals ??
    (profile.scaleType !== 'preset' ? PENTATONIC_INTERVALS[profile.scaleType] : [0, 2, 4, 7, 9]);

  const semitone = intervals[wrapped] ?? 0;
  const baseOct = Math.floor(profile.rootMidi / 12) - 1 + octaveOffset;
  const midi = (baseOct + 1) * 12 + rootPc + semitone;
  const clamped = Math.max(36, Math.min(84, midi));

  const match = profile.scaleNotes.find((n) => Math.abs(n - clamped) <= 1);
  return match ?? clamped;
}

/** Controlled random note — favors stepwise motion and consonance. */
export function pickNextNote(
  profile: AmbientHarmonicProfile,
  currentDegree: number,
  currentOctaveOffset: number,
  allowPause: boolean,
): NotePickResult {
  const noteCount = profile.presetIntervals?.length ?? 5;
  const w = profile.weights;

  const action = weightedPick([
    { value: 'stepwise' as const, weight: w.stepwise },
    { value: 'repeat' as const, weight: w.repeat },
    { value: 'leap' as const, weight: w.leap },
    { value: 'pause' as const, weight: allowPause ? w.pause : 0 },
    { value: 'register' as const, weight: w.registerShift },
  ]);

  if (action === 'pause') {
    return { kind: 'pause' };
  }

  if (action === 'register') {
    const delta = chance(0.5) ? 1 : -1;
    const nextOct = Math.max(-1, Math.min(1, currentOctaveOffset + delta));
    return { kind: 'registerShift', degree: currentDegree, octaveDelta: nextOct };
  }

  if (action === 'repeat') {
    const midi = degreeToMidi(profile, currentDegree, currentOctaveOffset);
    return { kind: 'note', midi, degree: currentDegree };
  }

  if (action === 'stepwise') {
    const step = chance(0.5) ? 1 : -1;
    const nextDegree = ((currentDegree + step) % noteCount + noteCount) % noteCount;
    const midi = degreeToMidi(profile, nextDegree, currentOctaveOffset);
    return { kind: 'note', midi, degree: nextDegree };
  }

  // leap — bounded
  const leap = weightedPick([
    { value: 2, weight: 0.6 },
    { value: -2, weight: 0.4 },
  ]);
  const clampedLeap = Math.max(-profile.maxLeapDegrees, Math.min(profile.maxLeapDegrees, leap));
  const nextDegree = ((currentDegree + clampedLeap) % noteCount + noteCount) % noteCount;
  const midi = degreeToMidi(profile, nextDegree, currentOctaveOffset);
  return { kind: 'note', midi, degree: nextDegree };
}

/** Pick a chord voicing from the preset palette. */
export function pickChordVoicing(profile: AmbientHarmonicProfile): number[] {
  const palette = profile.chordPalettes[Math.floor(Math.random() * profile.chordPalettes.length)] ?? [
    0, 2, 4,
  ];
  const octaveOffset = chance(0.3) ? 1 : 0;
  return palette.map((degree) => degreeToMidi(profile, degree, octaveOffset));
}

/** Organic timing — next event in seconds with breathing variance. */
export function nextEventDelay(baseSeconds: number, variance = 0.35): number {
  const spread = baseSeconds * variance;
  return baseSeconds + (Math.random() * 2 - 1) * spread;
}

/** Independent voice clock base rates (seconds). */
export const VOICE_CLOCK_BASE: Record<string, number> = {
  drone: 55,
  pad: 18,
  bell: 9,
  pluck: 14,
  air: 0,
  sub: 70,
};
