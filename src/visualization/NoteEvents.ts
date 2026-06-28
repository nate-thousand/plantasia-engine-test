import type { ActiveNoteState } from '../stores/engineStore';
import type { NoteReleaseEvent, NoteSpawnEvent } from './types';

export type InputSource = NoteSpawnEvent['source'];

/** Normalize note-on from any input path — visuals treat all sources identically. */
export function createNoteSpawnEvent(
  midi: number,
  velocity: number,
  source: InputSource = 'keyboard',
): NoteSpawnEvent {
  const pitchClass = midi % 12;
  const pan = (pitchClass / 11) * 2 - 1;

  return { midi, velocity, source, pan };
}

export function createNoteReleaseEvent(
  midi: number,
  source: InputSource = 'keyboard',
): NoteReleaseEvent {
  return { midi, source };
}

export function noteSpawnFromActive(note: ActiveNoteState, source: InputSource = 'keyboard'): NoteSpawnEvent {
  return createNoteSpawnEvent(note.midi, note.velocity, source);
}

export function midiToVerticalPosition(midi: number, gridHeight: number): number {
  const normalized = (midi - 36) / 60;
  return Math.round((1 - Math.max(0, Math.min(1, normalized))) * (gridHeight - 4)) + 2;
}

export function midiToHorizontalPosition(
  midi: number,
  pan: number,
  gridWidth: number,
  pitchBend = 0,
): number {
  const pitchSpread = ((midi % 12) / 12 - 0.5) * (gridWidth * 0.4);
  const center = gridWidth / 2;
  const bendOffset = pitchBend * (gridWidth * 0.12);
  return Math.round(center + pitchSpread + pan * (gridWidth * 0.15) + bendOffset);
}

export function velocityToGrowthSpeed(velocity: number): number {
  return 0.4 + (velocity / 127) * 1.6;
}

export function velocityToBrightness(velocity: number): number {
  return 0.3 + (velocity / 127) * 0.7;
}
