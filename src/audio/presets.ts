import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { getPlantasiaEngine } from './engine';

/** Read bundled presets from the engine package. */
export function getPresetCatalog(): PlantasiaPreset[] {
  return getPlantasiaEngine().presets;
}

/** Load a preset by catalog index. */
export function loadPresetAtIndex(index: number): PlantasiaPreset {
  const presets = getPresetCatalog();
  const preset = presets[index];

  if (!preset) {
    throw new Error(`Preset at index ${index} not found.`);
  }

  getPlantasiaEngine().playPreset(preset);
  return preset;
}

/** Load a preset by id. */
export function loadPresetById(id: string): PlantasiaPreset {
  const preset = getPresetCatalog().find((entry) => entry.id === id);

  if (!preset) {
    throw new Error(`Preset "${id}" not found.`);
  }

  getPlantasiaEngine().playPreset(preset);
  return preset;
}

/** Pick a random preset index. */
export function randomPresetIndex(currentIndex: number, total: number): number {
  if (total <= 1) {
    return 0;
  }

  let next = currentIndex;

  while (next === currentIndex) {
    next = Math.floor(Math.random() * total);
  }

  return next;
}
