import { patchEngineStore, getEngineStore } from '../stores/engineStore';
import type { TransportState, TransportStoreState } from './types';

const initialState: TransportStoreState = {
  transportState: 'idle',
  holdEnabled: false,
  ambientActive: false,
  chordActive: false,
  error: null,
};

let state: TransportStoreState = { ...initialState };
const listeners = new Set<() => void>();

export function getTransportStore(): TransportStoreState {
  return state;
}

export function subscribeTransportStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Sync engineStore flags consumed by ASCII viz and legacy readers. */
function syncEngineFlags(transportState: TransportState): void {
  patchEngineStore({
    audioReady: transportState === 'ready' || transportState === 'playing',
    isInitializing: transportState === 'loading',
  });
}

export function patchTransportStore(partial: Partial<TransportStoreState>): void {
  const next = { ...state, ...partial };
  if (partial.transportState !== undefined) {
    syncEngineFlags(partial.transportState);
  }
  state = next;
  emit();
}

export function setTransportState(next: TransportState): void {
  patchTransportStore({ transportState: next });
}

export function setTransportError(message: string | null): void {
  patchTransportStore({ error: message });
}

export function isTransportAudioReady(): boolean {
  return state.transportState === 'ready' || state.transportState === 'playing';
}

export function isTransportLoading(): boolean {
  return state.transportState === 'loading';
}

export function isTransportPlaying(): boolean {
  return state.transportState === 'playing';
}

export function getHoldEnabled(): boolean {
  return state.holdEnabled;
}

/** Reconcile playing vs ready from ambient session + held notes. */
export function syncTransportPlayingState(): void {
  if (state.transportState === 'idle' || state.transportState === 'loading') {
    return;
  }

  const { activeNoteCount } = getEngineStore();
  const shouldPlay = state.ambientActive || state.chordActive || activeNoteCount > 0;

  if (shouldPlay && state.transportState !== 'playing') {
    setTransportState('playing');
  } else if (!shouldPlay && state.transportState === 'playing') {
    setTransportState('ready');
  }
}

export function isTransportAmbientActive(): boolean {
  return state.ambientActive;
}

export function resetTransportStore(): void {
  state = { ...initialState };
  syncEngineFlags('idle');
  emit();
}
