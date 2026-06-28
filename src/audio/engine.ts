import { PlantasiaEngine } from 'plantasia-sound-engine';

const LOG_PREFIX = '[Plantasia Engine Test]';

let engine: PlantasiaEngine | null = null;

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
export async function startAudioEngine(): Promise<{ presetCount: number }> {
  const instance = getPlantasiaEngine();

  console.info(`${LOG_PREFIX} Initializing audio context…`);

  await instance.init();

  const presetCount = instance.presets.length;

  console.info(
    `${LOG_PREFIX} Engine initialized successfully (${presetCount} presets available)`,
  );

  return { presetCount };
}

/** Whether the engine instance has been constructed. */
export function isEngineConnected(): boolean {
  return engine !== null;
}
/** Trigger a short chord through the engine. */
export function playEngineNote(): void {
  getPlantasiaEngine().triggerChord();
  console.info(`${LOG_PREFIX} Note triggered`);
}

/** Release active voices. */
export function stopEngineNote(): void {
  getPlantasiaEngine().stop();
  console.info(`${LOG_PREFIX} Note stopped`);
}
