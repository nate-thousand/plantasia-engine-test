import type { PresetCatalogEntry, PresetCategoryGroup } from '../presets/types';

/** Release 1 sound worlds — birth, bloom, decay. */
export const RELEASE_PRESET_SLOTS = [
  { engineId: 'plantasonic', displayName: 'Seed' },
  { engineId: 'juno-flowers', displayName: 'Flowers' },
  { engineId: 'mutation', displayName: 'Mold' },
] as const;

const DEBUG_STORAGE_KEY = 'plantasia-debug';

/** Full engine catalog available only in debug mode (?debug=1). */
export function isReleaseCatalogLocked(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    return false;
  }
  try {
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Filter and reindex catalog to Release 1 presets with ship names. */
export function applyReleaseCatalogFilter(catalog: PresetCatalogEntry[]): PresetCatalogEntry[] {
  if (!isReleaseCatalogLocked()) {
    return catalog;
  }

  const byId = new Map(catalog.map((entry) => [entry.preset.id, entry]));
  const release: PresetCatalogEntry[] = [];

  for (let i = 0; i < RELEASE_PRESET_SLOTS.length; i++) {
    const slot = RELEASE_PRESET_SLOTS[i]!;
    const entry = byId.get(slot.engineId);
    if (!entry) {
      console.warn('[Plantasonic] Release preset not found in engine', { id: slot.engineId });
      continue;
    }
    release.push({
      index: i,
      preset: entry.preset,
      metadata: {
        ...entry.metadata,
        name: slot.displayName,
      },
    });
  }

  return release.length > 0 ? release : catalog;
}

export function buildReleaseCategoryGroups(catalog: PresetCatalogEntry[]): PresetCategoryGroup[] {
  if (!isReleaseCatalogLocked() || catalog.length === 0) {
    return [];
  }

  return [
    {
      id: 'release',
      label: 'Worlds',
      presets: catalog,
    },
  ];
}

/** Default catalog index for Seed (Plantasonic). */
export function getReleaseDefaultPresetIndex(catalog: PresetCatalogEntry[]): number {
  const seedIndex = catalog.findIndex((entry) => entry.preset.id === 'plantasonic');
  return seedIndex >= 0 ? seedIndex : 0;
}
