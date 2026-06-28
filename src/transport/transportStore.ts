import { engineAdapter } from '../audio/EngineAdapter';
import { patchEngineStore } from '../stores/engineStore';
import type { TransportState, TransportStoreState } from './types';

const initialState: TransportStoreState = {
  transportState: 'ready',
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
    audioReady: engineAdapter.isAudioRunning(),
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

/** Instrument engine initialized and ready for notes/controls (independent of ambient). */
export function isTransportAudioReady(): boolean {
  return engineAdapter.isAudioRunning();
}

export function isTransportLoading(): boolean {
  return state.transportState === 'loading';
}

/** Ambient soundscape session active — transport play/stop only toggles this. */
export function isTransportPlaying(): boolean {
  return state.ambientActive;
}

export function getHoldEnabled(): boolean {
  return state.holdEnabled;
}

/** Reconcile transport UI state from ambient session only. */
export function syncTransportPlayingState(): void {
  if (state.transportState === 'loading') {
    return;
  }

  if (state.ambientActive && state.transportState !== 'playing') {
    setTransportState('playing');
  } else if (!state.ambientActive && state.transportState === 'playing') {
    setTransportState('ready');
  }
}

export function isTransportAmbientActive(): boolean {
  return state.ambientActive;
}

export function resetTransportStore(): void {
  state = { ...initialState };
  syncEngineFlags('ready');
  emit();
}

/** Refresh engineStore.audioReady after instrument init completes. */
export function syncEngineFromAdapter(): void {
  syncEngineFlags(state.transportState);
}
