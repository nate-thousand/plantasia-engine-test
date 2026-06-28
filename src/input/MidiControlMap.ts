import {
  isMpkMiniDevice,
  MPK_MINI_KNOB_CC_MAP,
  STANDARD_CC_MAP,
  type MidiControlTarget,
} from './MidiDefaults';
import { loadMidiMappings, type StoredMidiMapping } from './MidiStorage';

let cachedMappings: StoredMidiMapping[] = loadMidiMappings().mappings;

export function reloadControlMap(): void {
  cachedMappings = loadMidiMappings().mappings;
}

export function getLearnedMappings(): StoredMidiMapping[] {
  return [...cachedMappings];
}

export function getMappingCount(): number {
  return cachedMappings.length;
}

function learnedTarget(cc: number, channel?: number): MidiControlTarget | null {
  const match = cachedMappings.find(
    (entry) => entry.cc === cc && (entry.channel === undefined || entry.channel === channel),
  );
  return match?.target ?? null;
}

/** Resolve a CC number to a control target using learned → standard → MPK fallback. */
export function resolveCcTarget(
  cc: number,
  deviceName: string | null,
  channel?: number,
): MidiControlTarget | null {
  const learned = learnedTarget(cc, channel);
  if (learned) {
    return learned;
  }

  const standard = STANDARD_CC_MAP[cc];
  if (standard) {
    return standard;
  }

  if (isMpkMiniDevice(deviceName)) {
    return MPK_MINI_KNOB_CC_MAP[cc] ?? null;
  }

  return null;
}

/** All CC numbers mapped to a target (for UI display). */
export function getCcAssignments(): Record<number, MidiControlTarget> {
  const assignments: Record<number, MidiControlTarget> = { ...STANDARD_CC_MAP };

  for (const entry of cachedMappings) {
    assignments[entry.cc] = entry.target;
  }

  return assignments;
}

export function getTargetForCc(cc: number): MidiControlTarget | null {
  const learned = cachedMappings.find((entry) => entry.cc === cc);
  if (learned) {
    return learned.target;
  }
  return STANDARD_CC_MAP[cc] ?? null;
}
