import type { SoundControlValues } from '../types/instrument';

/** Direct sound-slider → synth parameter mapping (0–100 sliders). */
export function soundSliderToParams(sound: SoundControlValues) {
  return {
    outputDb: -42 + (sound.volume / 100) * 38,
    filterQ: 0.2 + (sound.tone / 100) * 18,
    filterHz: 150 + (sound.texture / 100) * 8500,
    delayWet: (sound.bloom / 100) * 0.55,
    reverbWet: (sound.bloom / 100) * 0.75,
  };
}
