import type { PlantasiaPreset } from 'plantasia-sound-engine';
import type { PresetVisualMetadata } from '../presets/types';

export type PresetStoreState = {
  ready: boolean;
  catalog: import('../presets/types').PresetCatalogEntry[];
  groups: import('../presets/types').PresetCategoryGroup[];
  activeIndex: number;
  activePreset: PlantasiaPreset | null;
  activeMetadata: import('../presets/types').PresetMetadata | null;
  loadError: string | null;
  /** Shown when visual.asciiTheme is missing or unregistered in the host. */
  themeWarning: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();

let state: PresetStoreState = {
  ready: false,
  catalog: [],
  groups: [],
  activeIndex: 0,
  activePreset: null,
  activeMetadata: null,
  loadError: null,
  themeWarning: null,
};

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getPresetStore(): PresetStoreState {
  return state;
}

export function subscribePresetStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initializePresetStore(
  catalog: import('../presets/types').PresetCatalogEntry[],
  groups: import('../presets/types').PresetCategoryGroup[],
  defaultIndex: number,
): void {
  const entry = catalog[defaultIndex] ?? catalog[0] ?? null;
  state = {
    ready: catalog.length > 0,
    catalog,
    groups,
    activeIndex: entry?.index ?? 0,
    activePreset: entry?.preset ?? null,
    activeMetadata: entry?.metadata ?? null,
    loadError: null,
    themeWarning: null,
  };
  emit();
}

export function setActivePresetIndex(index: number): void {
  const entry = state.catalog[index];
  if (!entry) {
    state = {
      ...state,
      loadError: `Preset at index ${index} not found.`,
    };
    emit();
    return;
  }

  state = {
    ...state,
    activeIndex: entry.index,
    activePreset: entry.preset,
    activeMetadata: entry.metadata,
    loadError: null,
    themeWarning: state.themeWarning,
  };
  emit();
}

export function setPresetThemeWarning(message: string | null): void {
  state = {
    ...state,
    themeWarning: message,
  };
  emit();
}

export function setPresetLoadError(message: string | null): void {
  state = {
    ...state,
    loadError: message,
  };
  emit();
}

export function resetPresetStore(): void {
  state = {
    ready: false,
    catalog: [],
    groups: [],
    activeIndex: 0,
    activePreset: null,
    activeMetadata: null,
    loadError: null,
    themeWarning: null,
  };
  emit();
}

/** Convenience accessor for visual metadata on the active preset. */
export function getActiveVisualMetadata(): PresetVisualMetadata {
  return state.activeMetadata?.visual ?? {};
}
