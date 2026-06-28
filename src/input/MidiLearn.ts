import type { MidiControlTarget } from './MidiDefaults';
import { reloadControlMap } from './MidiControlMap';
import { upsertMapping } from './MidiStorage';
import {
  getMidiStore,
  patchMidiStore,
  subscribeMidiStore,
  refreshMappingCount,
} from '../stores/midiStore';

export function enableMidiLearn(): void {
  patchMidiStore({ learnEnabled: true });
}

export function disableMidiLearn(): void {
  patchMidiStore({ learnEnabled: false, learnTarget: null });
}

export function toggleMidiLearn(): boolean {
  const next = !getMidiStore().learnEnabled;
  patchMidiStore({ learnEnabled: next, learnTarget: next ? getMidiStore().learnTarget : null });
  return next;
}

export function setLearnTarget(target: MidiControlTarget | null): void {
  if (!getMidiStore().learnEnabled) {
    return;
  }
  patchMidiStore({ learnTarget: target });
}

export function isLearnActive(): boolean {
  const { learnEnabled, learnTarget } = getMidiStore();
  return learnEnabled && learnTarget !== null;
}

/**
 * Assign a CC to the currently selected learn target.
 * Returns true when a mapping was saved.
 */
export function handleLearnCc(
  cc: number,
  deviceName: string | null,
  channel?: number,
): boolean {
  const { learnEnabled, learnTarget } = getMidiStore();
  if (!learnEnabled || !learnTarget) {
    return false;
  }

  upsertMapping(cc, learnTarget, { deviceName: deviceName ?? undefined, channel });
  reloadControlMap();

  patchMidiStore({
    learnTarget: null,
    lastLearnedCc: cc,
    lastLearnedTarget: learnTarget,
  });
  refreshMappingCount();

  return true;
}

export { subscribeMidiStore, getMidiStore, patchMidiStore };
