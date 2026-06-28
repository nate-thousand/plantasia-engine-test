import type { ActiveNoteState } from '../stores/engineStore';

import type { PresetVisualMetadata } from '../presets/types';

/** Base transport / organism visual modes. */
export type InstrumentVisualState = 'dormant' | 'active' | 'playing' | 'resting';

/** Web MIDI connection state. */
export type MidiSurfaceState = 'off' | 'pending' | 'connected';

export type KeyboardControlSurface = {
  enabled: boolean;
};

export type MidiControlSurface = {
  state: MidiSurfaceState;
  devices: { id: string; name: string }[];
  selectedDeviceId: string | null;
  selectedDeviceName: string | null;
  lastNoteLabel: string | null;
  learnEnabled: boolean;
  learnTarget: string | null;
  lastMessage: string | null;
  lastCcNumber: number | null;
  mappingCount: number;
  detectedCcs: Record<number, number>;
  supported: boolean;
  onConnect: () => void;
  onSelectDevice: (deviceId: string) => void;
  onToggleLearn: () => void;
  onSelectLearnTarget: (target: import('../input/MidiDefaults').MidiControlTarget | null) => void;
};

/** Normalized slider values (0–100). */
export type SoundControlValues = {
  mold: number;
  tone: number;
  texture: number;
  bloom: number;
};

/** Normalized slider values (0–100). */
export type ModulationControlValues = {
  growthRate: number;
  drift: number;
  mutation: number;
  energy: number;
};

export type PresetSummary = {
  id: string;
  name: string;
  index: number;
  category: string | null;
  description: string | null;
  mood: string | null;
  species: string | null;
  asciiState: string | null;
  tags: string[];
  visual: PresetVisualMetadata;
};

/** Parameters passed to the organism builder. */
export type OrganismVisualParams = {
  visualState: InstrumentVisualState;
  /** Modulation energy slider — drives particle density in the organism. */
  energy: number;
  /** Modulation mutation slider — drives ╳ disruptions when > 0. */
  mutation: number;
  /** Sound bloom slider — drives bloom glyph scale when > 0. */
  bloom: number;
  /** Sound tone slider — visual highlight intensity. */
  tone: number;
  /** Sound texture slider — visual density band. */
  texture: number;
  /** Sound mold slider — organic decay / corruption intensity. */
  mold: number;
  /** Modulation growth slider — visual reach extension. */
  growthRate: number;
  /** Modulation drift slider — visual asymmetry. */
  drift: number;
  /** Active held notes from keyboard / MIDI. */
  activeNotes: ActiveNoteState[];
  /** Most recently triggered note. */
  lastNote: ActiveNoteState | null;
  /** Current preset summary for visual identity. */
  preset: PresetSummary | null;
};
