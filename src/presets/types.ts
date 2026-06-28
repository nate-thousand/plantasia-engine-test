import type { PlantasiaPreset } from 'plantasia-sound-engine';

/** Visual metadata exposed by the engine for each Sound World. */
export type PresetVisualMetadata = {
  asciiTheme?: string;
  motionStyle?: string;
  colorPalette?: string[];
  visualIntensity?: number;
  artwork?: string;
  motion?: string;
  animationStyle?: string;
};

/** MIDI defaults exposed by the engine for each Sound World. */
export type PresetMidiMetadata = {
  program?: number;
  modWheel?: number;
  expression?: number;
  pitchBendRange?: number;
  velocityCurve?: 'soft' | 'normal' | 'bright';
};

/** Normalized preset metadata for UI display — derived from engine fields only. */
export type PresetMetadata = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  mood: string | null;
  species: string | null;
  asciiState: string | null;
  tags: string[];
  extra: Record<string, string | string[] | number | boolean | null>;
  visual: PresetVisualMetadata;
  midi: PresetMidiMetadata;
};

export type PresetCatalogEntry = {
  index: number;
  preset: PlantasiaPreset;
  metadata: PresetMetadata;
};

export type PresetCategoryGroup = {
  id: string;
  label: string;
  presets: PresetCatalogEntry[];
};

export type PresetManifest = {
  version: number;
  defaultPresetId: string;
  categories: Record<string, string[]>;
};

/** Keys shown in the metadata panel — add engine fields here without UI rewrites. */
export const PRESET_METADATA_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'mood', label: 'Mood' },
  { key: 'species', label: 'Species' },
  { key: 'asciiState', label: 'ASCII state' },
  { key: 'tags', label: 'Tags' },
] as const;

export const PRESET_VISUAL_METADATA_FIELDS = [
  { key: 'asciiTheme', label: 'ASCII theme' },
  { key: 'motion', label: 'Motion' },
  { key: 'colorPalette', label: 'Palette' },
  { key: 'visualIntensity', label: 'Intensity' },
  { key: 'artwork', label: 'Artwork' },
  { key: 'animationStyle', label: 'Animation' },
] as const;
