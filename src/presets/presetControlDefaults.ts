import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { getPresetControls, getPresetMold } from 'plantasia-sound-engine';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import { clampMold } from '../audio/moldSync';

/**
 * Resolve UI control defaults from engine Sound World metadata.
 * Explicit preset.controls take precedence; synth-derived values are the fallback.
 */
export function derivePresetControls(preset: PlantasiaPreset): {
  sound: SoundControlValues;
  modulation: ModulationControlValues;
} {
  const controls = getPresetControls(preset);

  return {
    sound: {
      mold: clampMold(getPresetMold(preset)),
      tone: controls.tone,
      texture: controls.texture,
      bloom: controls.bloom,
    },
    modulation: {
      growthRate: controls.growthRate,
      drift: controls.drift,
      mutation: controls.mutation,
      energy: controls.energy,
    },
  };
}
