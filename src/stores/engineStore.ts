import type { MidiSurfaceState } from '../types/instrument';
import { formatNoteLabel } from '../input/noteMap';

export type MidiDeviceInfo = {
  id: string;
  name: string;
};

export type ActiveNoteState = {
  midi: number;
  velocity: number;
  label: string;
};

export type EngineStoreState = {
  audioReady: boolean;
  isInitializing: boolean;
  activeNotes: ActiveNoteState[];
  activeNoteCount: number;
  inputEnergy: number;
  lastNoteLabel: string | null;
  keyboardEnabled: boolean;
  midiState: MidiSurfaceState;
  midiDevices: MidiDeviceInfo[];
  selectedDeviceId: string | null;
  selectedDeviceName: string | null;
  midiActivityTick: number;
};

const initialState: EngineStoreState = {
  audioReady: false,
  isInitializing: false,
  activeNotes: [],
  activeNoteCount: 0,
  inputEnergy: 0,
  lastNoteLabel: null,
  keyboardEnabled: true,
  midiState: 'off',
  midiDevices: [],
  selectedDeviceId: null,
  selectedDeviceName: null,
  midiActivityTick: 0,
};

let state: EngineStoreState = { ...initialState };
const listeners = new Set<() => void>();

export function getEngineStore(): EngineStoreState {
  return state;
}

export function subscribeEngineStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchEngineStore(partial: Partial<EngineStoreState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

export function resetEngineStore(): void {
  state = { ...initialState };
  listeners.forEach((listener) => listener());
}

function averageVelocity(notes: ActiveNoteState[]): number {
  if (notes.length === 0) {
    return 0;
  }
  const sum = notes.reduce((total, note) => total + note.velocity, 0);
  return Math.round((sum / notes.length / 127) * 100);
}

export function registerNoteOn(midi: number, velocity: number): void {
  const label = formatNoteLabel(midi);
  const existing = state.activeNotes.filter((note) => note.midi !== midi);
  const activeNotes = [...existing, { midi, velocity, label }];

  patchEngineStore({
    activeNotes,
    activeNoteCount: activeNotes.length,
    inputEnergy: averageVelocity(activeNotes),
    lastNoteLabel: label,
  });
}

export function registerNoteOff(midi: number): void {
  const activeNotes = state.activeNotes.filter((note) => note.midi !== midi);

  patchEngineStore({
    activeNotes,
    activeNoteCount: activeNotes.length,
    inputEnergy: averageVelocity(activeNotes),
    lastNoteLabel:
      activeNotes.length > 0 ? activeNotes[activeNotes.length - 1].label : state.lastNoteLabel,
  });
}

export function clearActiveNotes(): void {
  patchEngineStore({
    activeNotes: [],
    activeNoteCount: 0,
    inputEnergy: 0,
  });
}

export function pulseMidiActivity(): void {
  patchEngineStore({ midiActivityTick: state.midiActivityTick + 1 });
}
