import type { PresetMetadata } from '../presets/types';
import { patchMidiStore } from '../stores/midiStore';
import { updateModulationControl } from '../stores/controlStore';

/** Apply per-preset MIDI defaults from engine metadata when a Sound World loads. */
export function applyPresetMidiDefaults(metadata: PresetMetadata | null): void {
  if (!metadata?.midi) {
    return;
  }

  const { modWheel, expression, pitchBendRange, velocityCurve } = metadata.midi;
  const patch: {
    modWheel?: number;
    channelPressure?: number;
    pitchBendRange?: number;
    velocityCurve?: 'soft' | 'normal' | 'bright';
  } = {};

  if (typeof modWheel === 'number') {
    patch.modWheel = modWheel;
    updateModulationControl('drift', Math.round((modWheel / 127) * 100), 'midi');
  }
  if (typeof expression === 'number') {
    patch.channelPressure = expression;
  }
  if (typeof pitchBendRange === 'number') {
    patch.pitchBendRange = pitchBendRange;
  }
  if (velocityCurve) {
    patch.velocityCurve = velocityCurve;
  }

  if (Object.keys(patch).length > 0) {
    patchMidiStore(patch);
  }
}

/** Resolve preset index from MIDI program change using engine midi.program when set. */
export function resolvePresetIndexFromProgram(
  program: number,
  catalog: { index: number; metadata: PresetMetadata }[],
): number | null {
  const byProgram = catalog.find((entry) => entry.metadata.midi?.program === program);
  if (byProgram) {
    return byProgram.index;
  }

  if (program >= 0 && program < catalog.length) {
    return program;
  }

  return null;
}
