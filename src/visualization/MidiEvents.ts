/**
 * MIDI event bridge — delegates to NoteEvents so keyboard, MIDI, sequencer,
 * and automation produce identical visual behavior.
 */
export {
  createNoteSpawnEvent,
  createNoteReleaseEvent,
  noteSpawnFromActive,
  midiToVerticalPosition,
  midiToHorizontalPosition,
  velocityToGrowthSpeed,
  velocityToBrightness,
  type InputSource,
} from './NoteEvents';

/** Alias for MIDI-sourced note spawn (same visual path as keyboard). */
export { createNoteSpawnEvent as midiNoteSpawn } from './NoteEvents';
export { createNoteReleaseEvent as midiNoteRelease } from './NoteEvents';
