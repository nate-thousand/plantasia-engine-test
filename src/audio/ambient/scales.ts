/** Pentatonic scale types for the Adaptive Ambient Focus Engine (M15). */
export type PentatonicScaleType = 'major' | 'minor' | 'japanese' | 'suspended' | 'preset';

/** Semitone offsets from root within one octave (pentatonic). */
export const PENTATONIC_INTERVALS: Record<Exclude<PentatonicScaleType, 'preset'>, readonly number[]> = {
  major: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
  japanese: [0, 1, 5, 7, 10],
  suspended: [0, 2, 5, 7, 10],
} as const;

export function scaleDegreeCount(type: PentatonicScaleType, presetIntervals?: number[]): number {
  if (type === 'preset' && presetIntervals?.length) {
    return presetIntervals.length;
  }
  return 5;
}

/** All MIDI notes in range that belong to the active scale. */
export function buildScaleMidiNotes(
  rootMidi: number,
  type: PentatonicScaleType,
  octaveMin: number,
  octaveMax: number,
  presetIntervals?: number[],
): number[] {
  const intervals =
    type === 'preset' && presetIntervals?.length
      ? presetIntervals
      : PENTATONIC_INTERVALS[type === 'preset' ? 'major' : type];

  const rootPc = rootMidi % 12;
  const notes: number[] = [];
  for (let oct = octaveMin; oct <= octaveMax; oct += 1) {
    for (const interval of intervals) {
      const midi = (oct + 1) * 12 + rootPc + interval;
      if (midi >= 36 && midi <= 84) {
        notes.push(midi);
      }
    }
  }

  return [...new Set(notes)].sort((a, b) => a - b);
}

export function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const pitch = clampMidi(midi);
  const name = names[pitch % 12] ?? 'C';
  const octave = Math.floor(pitch / 12) - 1;
  return `${name}${octave}`;
}

export function freqToRootMidi(freqHz: number): number {
  return Math.round(12 * Math.log2(freqHz / 440) + 69);
}

/** Derive pentatonic intervals from preset scale frequencies (relative semitones). */
export function intervalsFromPresetScale(scaleHz: number[], rootHz?: number): number[] {
  if (scaleHz.length === 0) {
    return [...PENTATONIC_INTERVALS.major];
  }

  const root = rootHz ?? scaleHz[0] ?? 261.63;
  const rootMidi = freqToRootMidi(root);
  const semitones = scaleHz
    .map((hz) => freqToRootMidi(hz) - rootMidi)
    .filter((s) => s >= 0 && s < 12);
  const unique = [...new Set(semitones)].sort((a, b) => a - b);

  if (unique.length >= 4) {
    return unique.slice(0, 5);
  }

  return [...PENTATONIC_INTERVALS.major];
}

function clampMidi(midi: number): number {
  return Math.max(0, Math.min(127, Math.round(midi)));
}
