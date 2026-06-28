/** Unified playback lifecycle — single source of truth for transport UI and engines. */
export type TransportState = 'idle' | 'loading' | 'ready' | 'playing';

export type TransportActionSource = 'ui' | 'keyboard' | 'midi' | 'touch' | 'pointer' | 'code';

export type TransportStoreState = {
  transportState: TransportState;
  holdEnabled: boolean;
  /** Sustained ambient session active (Play until Stop). */
  ambientActive: boolean;
  /** Legacy chord burst — unused when ambient session drives playing state. */
  chordActive: boolean;
  error: string | null;
};

export type TransportVisualState = 'idle' | 'loading' | 'ready' | 'playing' | 'suspended';
