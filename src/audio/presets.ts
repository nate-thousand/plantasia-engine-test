import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { engineAdapter } from './EngineAdapter';
import { getPlantasiaEngine } from './engine';
import { syncMoldProfile } from './moldSync';
import { clearActiveNotes } from '../stores/engineStore';
import { getControlStore, setControlSurface } from '../stores/controlStore';
import { derivePresetControls } from '../presets/presetControlDefaults';
import { applyPresetMidiDefaults } from '../input/PresetMidiDefaults';
import { describeThemeResolution } from '../visualization/PresetVisualThemes';
import { validateHostThemeRegistry } from '../presets/themeValidation';
import {
  buildPresetCatalog,
  buildPresetCategoryGroups,
  findPresetById,
  getDefaultPresetIndex,
  getEnginePresets,
  getPresetManifest,
  getPresetsForCategory,
} from '../presets/engineRegistry';
import {
  initializePresetStore,
  setActivePresetIndex,
  setPresetLoadError,
  setPresetThemeWarning,
} from '../stores/presetStore';

export type LoadPresetOptions = {
  /** When true, keep current slider values instead of applying preset JSON defaults. */
  preserveControls?: boolean;
  /** When true, load voices without preview chord (Milestone 13D). */
  silent?: boolean;
};

export {
  buildPresetCatalog,
  buildPresetCategoryGroups,
  findPresetById,
  getDefaultPresetIndex,
  getEnginePresets,
  getPresetManifest,
  getPresetsForCategory,
};

/** Read bundled presets from the engine registry. */
export function getPresetCatalog(): PlantasiaPreset[] {
  return getEnginePresets();
}

async function activatePreset(
  preset: PlantasiaPreset,
  options?: LoadPresetOptions,
): Promise<PlantasiaPreset> {
  engineAdapter.stopAllNotes();
  clearActiveNotes();

  if (!options?.silent) {
    getPlantasiaEngine().playPreset(preset);
  }
  syncMoldProfile(preset);
  await engineAdapter.preparePreset(preset);

  if (options?.preserveControls) {
    const store = getControlStore();
    engineAdapter.applyControlSurface(store.sound, store.modulation);
  } else {
    const controls = derivePresetControls(preset);
    setControlSurface(controls.sound, controls.modulation, 'ui');
    engineAdapter.applyControlSurface(controls.sound, controls.modulation);
  }

  setPresetThemeWarning(describeThemeResolution(preset));

  return preset;
}

/** Load a preset by catalog index and sync the preset store. */
export async function loadPresetAtIndex(
  index: number,
  options?: LoadPresetOptions,
): Promise<PlantasiaPreset> {
  const catalog = buildPresetCatalog();
  const entry = catalog[index];

  if (!entry) {
    const message = `Preset at index ${index} not found.`;
    setPresetLoadError(message);
    throw new Error(message);
  }

  try {
    const preset = await activatePreset(entry.preset, options);
    setActivePresetIndex(index);
    setPresetLoadError(null);
    applyPresetMidiDefaults(entry.metadata);
    return preset;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Preset could not load.';
    setPresetLoadError(message);
    throw error;
  }
}

/** Load a preset by id and sync the preset store. */
export async function loadPresetById(
  id: string,
  options?: LoadPresetOptions,
): Promise<PlantasiaPreset> {
  const preset = findPresetById(id);

  if (!preset) {
    const message = `Preset "${id}" not found.`;
    setPresetLoadError(message);
    throw new Error(message);
  }

  const catalog = buildPresetCatalog();
  const index = catalog.findIndex((entry) => entry.preset.id === id);

  try {
    const loaded = await activatePreset(preset, options);
    if (index >= 0) {
      setActivePresetIndex(index);
      const entry = catalog[index];
      applyPresetMidiDefaults(entry?.metadata ?? null);
    }
    setPresetLoadError(null);
    return loaded;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Preset could not load.';
    setPresetLoadError(message);
    throw error;
  }
}

/** Initialize catalog + grouped selector data in the preset store. */
export function bootstrapPresetCatalog(): {
  catalog: ReturnType<typeof buildPresetCatalog>;
  groups: ReturnType<typeof buildPresetCategoryGroups>;
  defaultIndex: number;
} {
  const catalog = buildPresetCatalog();
  const groups = buildPresetCategoryGroups(catalog);
  const defaultIndex = getDefaultPresetIndex(catalog);
  validateHostThemeRegistry();
  initializePresetStore(catalog, groups, defaultIndex);
  return { catalog, groups, defaultIndex };
}

/** Pick a random preset index different from the current one. */
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
