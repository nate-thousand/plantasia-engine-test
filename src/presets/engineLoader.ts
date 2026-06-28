import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { presets as enginePresets, presetManifest as engineManifest } from 'plantasia-sound-engine';
import type { PresetManifest } from './types';

/** Preferred category display order — unknown categories append after these. */
const CATEGORY_ORDER = [
  'signature',
  'soundWorlds',
  'flora',
  'ambient',
  'textures',
  'drones',
  'percussion',
] as const;

function readPresetCategory(preset: PlantasiaPreset): string {
  return preset.category?.trim() || 'other';
}

/** Build manifest categories from engine preset metadata. */
export function buildManifestFromPresets(catalog: PlantasiaPreset[]): PresetManifest {
  const categories: Record<string, string[]> = {};

  for (const categoryId of CATEGORY_ORDER) {
    categories[categoryId] = [];
  }

  for (const preset of catalog) {
    const categoryId = readPresetCategory(preset);
    if (!categories[categoryId]) {
      categories[categoryId] = [];
    }
    categories[categoryId].push(preset.id);
  }

  const defaultPreset =
    engineManifest.defaultPresetId ??
    catalog.find((preset) => preset.id === 'seed')?.id ??
    catalog[0]?.id ??
    'seed';

  return {
    version: 1,
    defaultPresetId: defaultPreset,
    categories,
  };
}

/** Presets exported by the engine package barrel. */
export const presets: PlantasiaPreset[] = enginePresets;

/** Manifest from engine bundled default.json, with category lists derived from presets. */
export const presetManifest: PresetManifest = {
  ...engineManifest,
  categories: buildManifestFromPresets(presets).categories,
};

/** Lookup a built-in preset by id. */
export function getPresetById(id: string): PlantasiaPreset | undefined {
  return presets.find((preset) => preset.id === id);
}

/** List presets for a category name from the derived manifest. */
export function getPresetsByCategory(category: string): PlantasiaPreset[] {
  const ids = presetManifest.categories[category] ?? [];
  return ids
    .map((id) => getPresetById(id))
    .filter((preset): preset is PlantasiaPreset => preset != null);
}
