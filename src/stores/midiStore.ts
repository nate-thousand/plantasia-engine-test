import type { MidiControlTarget } from '../input/MidiDefaults';
import { getMappingCount } from '../input/MidiControlMap';

export type MidiStoreState = {
  learnEnabled: boolean;
  learnTarget: MidiControlTarget | null;
  lastMessage: string | null;
  lastCcNumber: number | null;
  lastCcValue: number | null;
  detectedCcs: Record<number, number>;
  mappingCount: number;
  lastLearnedCc: number | null;
  lastLearnedTarget: MidiControlTarget | null;
  interactionBurst: number;
  unknownPadLog: string | null;
};

const initialState: MidiStoreState = {
  learnEnabled: false,
  learnTarget: null,
  lastMessage: null,
  lastCcNumber: null,
  lastCcValue: null,
  detectedCcs: {},
  mappingCount: getMappingCount(),
  lastLearnedCc: null,
  lastLearnedTarget: null,
  interactionBurst: 0,
  unknownPadLog: null,
};

let state: MidiStoreState = { ...initialState };
const listeners = new Set<() => void>();

export function getMidiStore(): MidiStoreState {
  return state;
}

export function subscribeMidiStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchMidiStore(partial: Partial<MidiStoreState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

export function recordMidiMessage(message: string): void {
  patchMidiStore({ lastMessage: message });
}

export function recordCcDetection(controller: number, value: number): void {
  patchMidiStore({
    lastCcNumber: controller,
    lastCcValue: value,
    detectedCcs: { ...state.detectedCcs, [controller]: value },
  });
}

export function pulseInteractionBurst(amount: number): void {
  patchMidiStore({ interactionBurst: amount });
}

export function logUnknownPad(message: string): void {
  console.info('[Plantasia MIDI] Unknown pad message:', message);
  patchMidiStore({ unknownPadLog: message });
}

export function refreshMappingCount(): void {
  patchMidiStore({ mappingCount: getMappingCount() });
}
