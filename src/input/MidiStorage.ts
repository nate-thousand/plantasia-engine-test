import type { MidiControlTarget } from './MidiDefaults';

export const MIDI_STORAGE_KEY = 'plantasia-midi-mappings';

export type StoredMidiMapping = {
  cc: number;
  target: MidiControlTarget;
  deviceName?: string;
  channel?: number;
  timestamp: number;
};

export type StoredMidiMappings = {
  version: 1;
  mappings: StoredMidiMapping[];
};

function emptyStore(): StoredMidiMappings {
  return { version: 1, mappings: [] };
}

function migrateVolumeTarget(target: MidiControlTarget): MidiControlTarget {
  return target === ('volume' as MidiControlTarget) ? 'mold' : target;
}

export function loadMidiMappings(): StoredMidiMappings {
  if (typeof localStorage === 'undefined') {
    return emptyStore();
  }

  try {
    const raw = localStorage.getItem(MIDI_STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }

    const parsed = JSON.parse(raw) as StoredMidiMappings;
    if (parsed.version !== 1 || !Array.isArray(parsed.mappings)) {
      return emptyStore();
    }

    let migrated = false;
    const mappings = parsed.mappings.map((entry) => {
      const nextTarget = migrateVolumeTarget(entry.target);
      if (nextTarget !== entry.target) {
        migrated = true;
        return { ...entry, target: nextTarget };
      }
      return entry;
    });

    if (migrated) {
      const next = { version: 1 as const, mappings };
      saveMidiMappings(next);
      return next;
    }

    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveMidiMappings(store: StoredMidiMappings): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(MIDI_STORAGE_KEY, JSON.stringify(store));
}

export function upsertMapping(
  cc: number,
  target: MidiControlTarget,
  options: { deviceName?: string; channel?: number } = {},
): StoredMidiMappings {
  const store = loadMidiMappings();
  const filtered = store.mappings.filter((entry) => entry.cc !== cc);
  const next: StoredMidiMappings = {
    version: 1,
    mappings: [
      ...filtered,
      {
        cc,
        target,
        deviceName: options.deviceName,
        channel: options.channel,
        timestamp: Date.now(),
      },
    ],
  };

  saveMidiMappings(next);
  return next;
}

export function removeMapping(cc: number): StoredMidiMappings {
  const store = loadMidiMappings();
  const next: StoredMidiMappings = {
    version: 1,
    mappings: store.mappings.filter((entry) => entry.cc !== cc),
  };
  saveMidiMappings(next);
  return next;
}
