import {
  getPresetMold,
  normalizeMold,
  setActiveMoldProfile,
  type PlantasiaPreset,
} from 'plantasia-sound-engine';

/** Activate the Sound World mold personality before applying macro values. */
export function syncMoldProfile(preset: PlantasiaPreset): void {
  setActiveMoldProfile(preset);
}

/** Read the engine-authoritative Mold default for a preset (0–100). */
export function presetMoldDefault(preset: PlantasiaPreset): number {
  return getPresetMold(preset);
}

/** Clamp UI / MIDI mold input to the engine's 0–100 range. */
export function clampMold(value: number): number {
  return normalizeMold(value);
}
