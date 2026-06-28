import { engineAdapter } from '../audio/EngineAdapter';
import { transportStartSession } from './transportActions';
import type { TransportActionSource } from './types';

/** Begin audio unlock in the same call stack as a user gesture. */
export function kickAudioFromUserGesture(): void {
  void engineAdapter.kickAudioFromUserGesture();
}

/** Unified entry for title tap, play button, and spacebar. */
export function beginInstrumentSession(source: TransportActionSource): void {
  kickAudioFromUserGesture();
  void transportStartSession(source);
}
