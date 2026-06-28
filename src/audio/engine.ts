import { PlantasiaEngine } from 'plantasia-sound-engine';
import { resetAudioControls, setOutputVolume } from './controls';

const LOG_PREFIX = '[Plantasia Engine Test]';

let engine: PlantasiaEngine | null = null;
let audioStarted = false;

/** Returns the singleton engine instance, creating it on first access. */
export function getPlantasiaEngine(): PlantasiaEngine {
  if (!engine) {
    engine = new PlantasiaEngine();
    console.info(`${LOG_PREFIX} PlantasiaEngine instance created`);
  }

  return engine;
}

/**
 * Unlock the Web Audio context via user gesture.
 * Confirms the engine package loads by reading bundled preset definitions.
 */
export async function startAudioEngine(options?: {
  volume?: number;
}): Promise<{ presetCount: number }> {
  const instance = getPlantasiaEngine();

  console.info(`${LOG_PREFIX} Initializing audio context…`);

  await instance.init();
  audioStarted = true;
  resetAudioControls();

  if (options?.volume !== undefined) {
    setOutputVolume(options.volume);
  }

  const presetCount = instance.presets.length;

  console.info(
    `${LOG_PREFIX} Engine initialized successfully (${presetCount} presets available)`,
  );

  return { presetCount };
}

/** Whether the audio context has been unlocked. */
export function isAudioRunning(): boolean {
  return audioStarted;
}

/** Whether the engine instance has been constructed. */
export function isEngineConnected(): boolean {
  return engine !== null;
}

/** Trigger a short chord through the engine. */
export function playEngineNote(): void {
  if (!audioStarted) {
    throw new Error('Audio context is not running. Start audio first.');
  }

  getPlantasiaEngine().triggerChord();
  console.info(`${LOG_PREFIX} Note triggered`);
}

/** Release active voices. */
export function stopEngineNote(): void {
  if (!audioStarted) {
    return;
  }

  getPlantasiaEngine().stop();
  console.info(`${LOG_PREFIX} Note stopped`);
}

export { setOutputVolume } from './controls';
