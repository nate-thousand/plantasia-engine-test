import type { MidiSurfaceState } from '../types/instrument';
import { formatNoteLabel } from '../input/noteMap';

export type MidiDeviceInfo = {
  id: string;
  name: string;
};

export type EngineStoreState = {
  audioReady: boolean;
  isInitializing: boolean;
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

export function registerNoteOn(midi: number, velocity: number): void {
  patchEngineStore({
    activeNoteCount: state.activeNoteCount + 1,
    inputEnergy: Math.round((velocity / 127) * 100),
    lastNoteLabel: formatNoteLabel(midi),
  });
}

export function registerNoteOff(): void {
  const nextCount = Math.max(0, state.activeNoteCount - 1);
  patchEngineStore({
    activeNoteCount: nextCount,
    inputEnergy: nextCount > 0 ? state.inputEnergy : 0,
  });
}

export function pulseMidiActivity(): void {
  patchEngineStore({ midiActivityTick: state.midiActivityTick + 1 });
}
