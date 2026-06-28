export type NoteMapping = {
  midi: number;
  name: string;
  label: string;
};

/** Computer keyboard → MIDI note map (A–K row, piano-style). */
export const KEYBOARD_NOTE_MAP: Record<string, NoteMapping> = {
  a: { midi: 60, name: 'C4', label: 'C4' },
  w: { midi: 61, name: 'C#4', label: 'C#4' },
  s: { midi: 62, name: 'D4', label: 'D4' },
  e: { midi: 63, name: 'D#4', label: 'D#4' },
  d: { midi: 64, name: 'E4', label: 'E4' },
  f: { midi: 65, name: 'F4', label: 'F4' },
  t: { midi: 66, name: 'F#4', label: 'F#4' },
  g: { midi: 67, name: 'G4', label: 'G4' },
  y: { midi: 68, name: 'G#4', label: 'G#4' },
  h: { midi: 69, name: 'A4', label: 'A4' },
  u: { midi: 70, name: 'A#4', label: 'A#4' },
  j: { midi: 71, name: 'B4', label: 'B4' },
  k: { midi: 72, name: 'C5', label: 'C5' },
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** Convert MIDI note number to Tone.js note name (e.g. 60 → C4). */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const pitch = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${pitch}${octave}`;
}

/** Human-readable label for overlay / control status. */
export function formatNoteLabel(midi: number): string {
  return midiToNoteName(midi);
}

/** Lookup keyboard key (case-insensitive) → note mapping. */
export function getKeyboardNote(key: string): NoteMapping | undefined {
  return KEYBOARD_NOTE_MAP[key.toLowerCase()];
}
