import { initialBotanicalControls, type BotanicalControls } from 'plantasia-sound-engine';
import { getPlantasiaEngine } from './engine';

const LOG_PREFIX = '[Plantasia Engine Test]';

let botanicalState: BotanicalControls = { ...initialBotanicalControls };

/** Reset botanical control snapshot when the audio session starts. */
export function resetAudioControls(): void {
  botanicalState = { ...initialBotanicalControls };
}

/**
 * Map UI volume (0–100) to engine output gain.
 * Uses botanical `energy`, which the engine maps to synth volume.
 */
export function setOutputVolume(volume: number): void {
  botanicalState = { ...botanicalState, energy: volume };
  getPlantasiaEngine().applyBotanicalControls(botanicalState);
  console.info(`${LOG_PREFIX} Output volume set`, { volume });
}

/**
 * Sound mapping for tone, texture, bloom, growth, drift, and mutation
 * is deferred — those sliders update the organism visually first.
 */
export function syncBotanicalAudioFromVisualControls(): void {
  // Reserved for a later milestone when UI sliders drive applyBotanicalControls.
}
