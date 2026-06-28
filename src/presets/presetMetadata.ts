import type { PlantasiaPreset } from 'plantasia-sound-engine';
import type { PresetMetadata, PresetMidiMetadata, PresetVisualMetadata } from './types';
import { formatCategoryLabel } from './categories';

const DISPLAYED_KEYS = new Set([
  'id',
  'name',
  'species',
  'description',
  'mood',
  'asciiState',
  'category',
  'tags',
  'visual',
  'midi',
  'synth',
  'scale',
  'botanical',
  'growth',
  'plantasonic',
  'controls',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  return items.length > 0 ? items : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

/** Read Sound World visual metadata from typed preset.visual or legacy top-level fields. */
export function extractVisualMetadata(
  preset: PlantasiaPreset,
  raw: Record<string, unknown>,
): PresetVisualMetadata {
  const visual: PresetVisualMetadata = {};
  const source = preset.visual ?? {};

  const asciiTheme = readString(source.asciiTheme) ?? readString(raw.asciiTheme);
  if (asciiTheme) {
    visual.asciiTheme = asciiTheme;
  }

  const motionStyle = readString(source.motionStyle) ?? readString(raw.motionStyle) ?? readString(raw.motion);
  if (motionStyle) {
    visual.motionStyle = motionStyle;
    visual.motion = motionStyle;
  }

  const palette = readStringArray(source.colorPalette) ?? readStringArray(raw.colorPalette);
  if (palette) {
    visual.colorPalette = palette;
  }

  const intensity = readNumber(source.visualIntensity) ?? readNumber(raw.visualIntensity);
  if (intensity !== null) {
    visual.visualIntensity = Math.max(0, Math.min(1, intensity));
  }

  const artwork = readString(source.artwork) ?? readString(raw.artwork);
  if (artwork) {
    visual.artwork = artwork;
  }

  const animationStyle = readString(source.animationStyle) ?? readString(raw.animationStyle);
  if (animationStyle) {
    visual.animationStyle = animationStyle;
  }

  return visual;
}

function extractMidiMetadata(preset: PlantasiaPreset): PresetMidiMetadata {
  const midi = preset.midi;
  if (!midi) {
    return {};
  }

  const result: PresetMidiMetadata = {};
  if (typeof midi.program === 'number') {
    result.program = midi.program;
  }
  if (typeof midi.modWheel === 'number') {
    result.modWheel = midi.modWheel;
  }
  if (typeof midi.expression === 'number') {
    result.expression = midi.expression;
  }
  if (typeof midi.pitchBendRange === 'number') {
    result.pitchBendRange = midi.pitchBendRange;
  }
  if (midi.velocityCurve) {
    result.velocityCurve = midi.velocityCurve;
  }
  return result;
}

function moodToTags(mood: string | null): string[] {
  if (!mood) {
    return [];
  }

  return mood
    .split(/[/,|]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function collectExtraFields(
  preset: PlantasiaPreset,
  raw: Record<string, unknown>,
): Record<string, string | string[] | number | boolean | null> {
  const extra: Record<string, string | string[] | number | boolean | null> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (DISPLAYED_KEYS.has(key)) {
      continue;
    }
    if (typeof value === 'string') {
      extra[key] = value;
      continue;
    }
    if (typeof value === 'number') {
      extra[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      extra[key] = value;
      continue;
    }
    if (value === null) {
      extra[key] = null;
      continue;
    }
    if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
      extra[key] = value;
    }
  }

  if (preset.scale?.length) {
    extra.scaleNotes = `${preset.scale.length} notes`;
  }

  return extra;
}

/** Build normalized metadata from an engine preset object. */
export function buildPresetMetadata(
  preset: PlantasiaPreset,
  category: string | null,
): PresetMetadata {
  const raw = preset as PlantasiaPreset & Record<string, unknown>;
  const jsonCategory = readString(preset.category) ?? readString(raw.category);
  const resolvedCategory = category ?? jsonCategory;
  const mood = readString(preset.mood);
  const explicitTags = readStringArray(preset.tags);

  return {
    id: preset.id,
    name: preset.name,
    category: resolvedCategory,
    description: readString(preset.description),
    mood,
    species: readString(preset.species),
    asciiState: readString(preset.asciiState),
    tags: explicitTags ?? moodToTags(mood),
    extra: collectExtraFields(preset, isRecord(raw) ? raw : {}),
    visual: extractVisualMetadata(preset, isRecord(raw) ? raw : {}),
    midi: extractMidiMetadata(preset),
  };
}

/** Flat metadata map for generic UI rendering. */
export function metadataDisplayValues(metadata: PresetMetadata): Record<string, string> {
  const values: Record<string, string> = {
    name: metadata.name,
  };

  if (metadata.category) {
    values.category = formatCategoryLabel(metadata.category);
  }
  if (metadata.description) {
    values.description = metadata.description;
  }
  if (metadata.mood) {
    values.mood = metadata.mood;
  }
  if (metadata.species) {
    values.species = metadata.species;
  }
  if (metadata.asciiState) {
    values.asciiState = metadata.asciiState;
  }
  if (metadata.tags.length > 0) {
    values.tags = metadata.tags.join(' · ');
  }

  return values;
}

/** Flat visual metadata map for optional UI sections. */
export function visualMetadataDisplayValues(
  visual: PresetVisualMetadata,
): Record<string, string> {
  const values: Record<string, string> = {};

  if (visual.asciiTheme) {
    values.asciiTheme = visual.asciiTheme;
  }
  if (visual.motionStyle ?? visual.motion) {
    values.motion = visual.motionStyle ?? visual.motion ?? '';
  }
  if (visual.colorPalette?.length) {
    values.colorPalette = visual.colorPalette.join(', ');
  }
  if (visual.visualIntensity != null) {
    values.visualIntensity = String(Math.round(visual.visualIntensity * 100));
  }
  if (visual.artwork) {
    values.artwork = visual.artwork;
  }
  if (visual.animationStyle) {
    values.animationStyle = visual.animationStyle;
  }

  return values;
}
