import type { AmbientHarmonicProfile } from './harmonicProfile';
import { PENTATONIC_INTERVALS } from './scales';

export type DemoMelodyPhrase = {
  /** Pentatonic scale degrees (0-based). */
  degrees: readonly number[];
  /** Octave offset above profile octaveMin for the melody line. */
  octaveLift: number;
};

const RELEASE_DEMO_MELODIES: Record<string, DemoMelodyPhrase> = {
  plantasonic: {
    degrees: [0, 2, 4, 2, 4, 3, 2, 0],
    octaveLift: 1,
  },
  'juno-flowers': {
    degrees: [0, 2, 1, 3, 4, 3, 2, 0],
    octaveLift: 1,
  },
  mutation: {
    degrees: [0, 1, 3, 2, 4, 2, 1, 0],
    octaveLift: 0,
  },
};

const DEFAULT_MELODY: DemoMelodyPhrase = {
  degrees: [0, 2, 4, 2, 0],
  octaveLift: 1,
};

/** Preset-specific demo hook — simple harmonic ambient melody. */
export function resolveDemoMelody(presetId: string): DemoMelodyPhrase {
  return RELEASE_DEMO_MELODIES[presetId] ?? DEFAULT_MELODY;
}

/** Randomize entry point and contour each time demo starts. */
export function randomizeDemoMelody(phrase: DemoMelodyPhrase): DemoMelodyPhrase {
  const rotate = Math.floor(Math.random() * phrase.degrees.length);
  const rotated = [...phrase.degrees.slice(rotate), ...phrase.degrees.slice(0, rotate)];
  if (Math.random() < 0.3) {
    rotated.reverse();
  }
  const octaveLift = phrase.octaveLift + (Math.random() < 0.25 ? 1 : 0);
  return { degrees: rotated, octaveLift };
}

export function degreeToMidi(
  profile: AmbientHarmonicProfile,
  degree: number,
  octaveLift: number,
): number {
  const count =
    profile.presetIntervals?.length ??
    (profile.scaleType === 'preset' ? 5 : PENTATONIC_INTERVALS[profile.scaleType].length);
  const wrapped = ((degree % count) + count) % count;
  const intervals =
    profile.presetIntervals ??
    PENTATONIC_INTERVALS[profile.scaleType === 'preset' ? 'major' : profile.scaleType];
  const interval = intervals[wrapped] ?? 0;
  const rootPc = profile.rootMidi % 12;
  const octave = profile.octaveMin + octaveLift;
  return (octave + 1) * 12 + rootPc + interval;
}

export type DemoMelodyNote = {
  degree: number;
  midi: number;
  atSec: number;
  durationSec: number;
  velocity: number;
};

/** Schedule a short intro melody for demo mode. */
export function buildDemoMelodyNotes(
  profile: AmbientHarmonicProfile,
  presetId: string,
): DemoMelodyNote[] {
  const phrase = randomizeDemoMelody(resolveDemoMelody(presetId));
  const notes: DemoMelodyNote[] = [];
  let at = 0.65;

  for (const degree of phrase.degrees) {
    const midi = degreeToMidi(profile, degree, phrase.octaveLift);
    const durationSec = 1.1 + Math.random() * 0.55;
    notes.push({
      degree,
      midi,
      atSec: at,
      durationSec,
      velocity: 0.09 + Math.random() * 0.05,
    });
    at += 0.38 + Math.random() * 0.22;
  }

  return notes;
}
