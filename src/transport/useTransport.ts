import { useMemo, useSyncExternalStore } from 'react';
import { getEngineStore, subscribeEngineStore } from '../stores/engineStore';
import type { InstrumentVisualState } from '../types/instrument';
import type { TransportState } from './types';
import {
  getTransportStore,
  isTransportAudioReady,
  isTransportLoading,
  isTransportPlaying,
  subscribeTransportStore,
} from './transportStore';

export type TransportViewModel = {
  transportState: TransportState;
  audioReady: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  holdEnabled: boolean;
  error: string | null;
  visualState: InstrumentVisualState;
};

export function useTransport(): TransportViewModel {
  const transport = useSyncExternalStore(subscribeTransportStore, getTransportStore, getTransportStore);
  const engine = useSyncExternalStore(subscribeEngineStore, getEngineStore, getEngineStore);

  const visualState: InstrumentVisualState = useMemo(() => {
    if (transport.transportState === 'loading') {
      return 'dormant';
    }
    if (transport.ambientActive || engine.activeNoteCount > 0) {
      return 'playing';
    }
    return 'active';
  }, [transport.transportState, transport.ambientActive, engine.activeNoteCount]);

  return {
    transportState: transport.transportState,
    audioReady: isTransportAudioReady(),
    isInitializing: isTransportLoading(),
    isPlaying: isTransportPlaying(),
    holdEnabled: transport.holdEnabled,
    error: transport.error,
    visualState,
  };
}

export function transportStateLabel(state: TransportState, _midiConnected: boolean): string {
  switch (state) {
    case 'idle':
      return 'Ready';
    case 'loading':
      return 'Awakening…';
    case 'ready':
      return 'Live';
    case 'playing':
      return 'Demo';
    default:
      return state;
  }
}
