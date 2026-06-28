import type { SoundControlValues } from '../types/instrument';

/** Fixed private master output — loudness is OS / browser controlled. */
export const INTERNAL_MASTER_DB = -12;

/** Direct sound-slider → synth parameter mapping (0–100 sliders). */
export function soundSliderToParams(sound: SoundControlValues) {
  return {
    filterQ: 0.2 + (sound.tone / 100) * 18,
    filterHz: 150 + (sound.texture / 100) * 8500,
    delayWet: (sound.bloom / 100) * 0.55,
    reverbWet: (sound.bloom / 100) * 0.75,
  };
}
