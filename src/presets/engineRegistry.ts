import type { PlantasiaPreset } from 'plantasia-sound-engine';
import {
  getPresetById as engineGetPresetById,
  getPresetsByCategory as engineGetPresetsByCategory,
  presets as enginePresets,
  buildManifestFromPresets,
} from './engineLoader';
import type { PresetCategoryGroup, PresetCatalogEntry, PresetManifest } from './types';
import { buildPresetMetadata } from './presetMetadata';
import { formatCategoryLabel } from './categories';

const LOG_PREFIX = '[Plantasia Engine Test]';

function categoryForPresetId(
  manifest: PresetManifest,
  presetId: string,
): string | null {
  for (const [categoryId, ids] of Object.entries(manifest.categories)) {
    if (ids.includes(presetId)) {
      return categoryId;
    }
  }
  return null;
}

/** Engine preset manifest (categories, default preset id). */
export function getPresetManifest(): PresetManifest {
  return buildManifestFromPresets(getEnginePresets());
}

/** All bundled presets from the engine registry. */
export function getEnginePresets(): PlantasiaPreset[] {
  return enginePresets;
}

/** Lookup a preset by id — returns undefined when missing. */
export function findPresetById(id: string): PlantasiaPreset | undefined {
  try {
    return engineGetPresetById(id);
  } catch (error) {
    console.warn(`${LOG_PREFIX} getPresetById failed`, { id, error });
    return undefined;
  }
}

/** Presets for a manifest category — empty array for unknown categories. */
export function getPresetsForCategory(category: string): PlantasiaPreset[] {
  try {
    return engineGetPresetsByCategory(category);
  } catch (error) {
    console.warn(`${LOG_PREFIX} getPresetsByCategory failed`, { category, error });
    return [];
  }
}

/** Build catalog entries with metadata for every engine preset. */
export function buildPresetCatalog(): PresetCatalogEntry[] {
  const manifest = getPresetManifest();
  const presets = getEnginePresets();

  return presets.map((preset, index) => ({
    index,
    preset,
    metadata: buildPresetMetadata(preset, categoryForPresetId(manifest, preset.id)),
  }));
}

/** Group presets by manifest category; uncategorized presets land in "other". */
export function buildPresetCategoryGroups(catalog: PresetCatalogEntry[]): PresetCategoryGroup[] {
  const manifest = getPresetManifest();
  const assigned = new Set<number>();
  const groups: PresetCategoryGroup[] = [];

  for (const [categoryId, presetIds] of Object.entries(manifest.categories)) {
    const presets: PresetCatalogEntry[] = [];

    for (const presetId of presetIds) {
      const entry = catalog.find((item) => item.preset.id === presetId);
      if (entry) {
        presets.push(entry);
        assigned.add(entry.index);
      } else {
        console.warn(`${LOG_PREFIX} Manifest references missing preset`, {
          categoryId,
          presetId,
        });
      }
    }

    if (presets.length > 0) {
      groups.push({
        id: categoryId,
        label: formatCategoryLabel(categoryId),
        presets,
      });
    }
  }

  const uncategorized = catalog.filter((entry) => !assigned.has(entry.index));
  if (uncategorized.length > 0) {
    groups.push({
      id: 'other',
      label: 'Other',
      presets: uncategorized,
    });
  }

  return groups;
}

/** Resolve catalog index for the manifest default preset. */
export function getDefaultPresetIndex(catalog: PresetCatalogEntry[]): number {
  const defaultId = getPresetManifest().defaultPresetId;
  const match = catalog.find((entry) => entry.preset.id === defaultId);
  return match?.index ?? 0;
}

/** Safe catalog index lookup by preset id. */
export function getPresetIndexById(catalog: PresetCatalogEntry[], id: string): number | null {
  const match = catalog.find((entry) => entry.preset.id === id);
  return match?.index ?? null;
}

