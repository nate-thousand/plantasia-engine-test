import { initialBotanicalControls, type BotanicalControls } from 'plantasia-sound-engine';

let botanicalState: BotanicalControls = { ...initialBotanicalControls };

/** Reset botanical control snapshot when the audio session starts. */
export function resetAudioControls(): void {
  botanicalState = { ...initialBotanicalControls };
}

/** Current botanical control snapshot. */
export function getBotanicalState(): BotanicalControls {
  return botanicalState;
}

/** Store the latest botanical snapshot (called from EngineAdapter). */
export function setBotanicalState(controls: BotanicalControls): void {
  botanicalState = { ...controls };
}

export { mapControlSurfaceToBotanical } from './controlSurface';
