import { engineAdapter } from './EngineAdapter';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';

/** Returns the singleton engine instance via the adapter. */
export function getPlantasiaEngine() {
  return engineAdapter.getEngine();
}

/** Unlock the Web Audio context via user gesture. */
export async function startAudioEngine(): Promise<{ presetCount: number }> {
  return engineAdapter.startAudio();
}

/** Whether the audio context has been unlocked. */
export function isAudioRunning(): boolean {
  return engineAdapter.isAudioRunning();
}

/** Whether the engine instance has been constructed. */
export function isEngineConnected(): boolean {
  return engineAdapter.isEngineConnected();
}

/** Trigger a short chord through the engine. */
export function playEngineNote(): void {
  engineAdapter.triggerChord();
}

/** Release active voices. */
export function stopEngineNote(): void {
  engineAdapter.stopAllNotes();
}

/** Apply sound + modulation sliders to engine and live input. */
export function applyControlSurface(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
): void {
  engineAdapter.applyControlSurface(sound, modulation);
}

/** Apply sound sliders immediately (mold, tone, texture, bloom). */
export function applySoundControls(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
): void {
  engineAdapter.applySoundControls(sound, modulation);
}

export { engineAdapter } from './EngineAdapter';
export { mapControlSurfaceToBotanical } from './controls';
