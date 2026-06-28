import { engineAdapter } from '../audio/EngineAdapter';
import { enterInstrumentSession, transportStartSession } from './transportActions';
import type { TransportActionSource } from './types';

/** Begin audio unlock in the same call stack as a user gesture. */
export function kickAudioFromUserGesture(): void {
  void engineAdapter.kickAudioFromUserGesture();
}

/** Title / first begin — enter instrument without starting demo. */
export function beginInstrumentSession(source: TransportActionSource): void {
  kickAudioFromUserGesture();
  void enterInstrumentSession(source);
}

/** After session started — toggle demo playback. */
export function toggleDemoSession(source: TransportActionSource): void {
  kickAudioFromUserGesture();
  void transportStartSession(source);
}
