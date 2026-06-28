import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import { soundSliderToParams } from '../audio/soundControls';
import type { PresetTheme, SoundVizParams } from './types';
import { themeFilterOpenness } from './ThemeBehaviors';

/** Map UI sliders + preset theme to synthesis visualization parameters. */
export function buildSoundVizParams(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
  presetId: string,
  theme?: PresetTheme,
): SoundVizParams {
  const audio = soundSliderToParams(sound);
  const toneNorm = sound.tone / 100;
  const textureNorm = sound.texture / 100;
  const bloomNorm = sound.bloom / 100;
  const growthNorm = modulation.growthRate / 100;
  const driftNorm = modulation.drift / 100;
  const mutationNorm = modulation.mutation / 100;
  const energyNorm = modulation.energy / 100;

  const filterCutoff = Math.min(100, toneNorm * 100);
  const resonance = Math.min(100, textureNorm * 100 + audio.filterQ * 5);
  const openness = theme ? themeFilterOpenness(theme, filterCutoff) : filterCutoff / 100;

  return {
    volume: sound.volume,
    tone: sound.tone,
    texture: sound.texture,
    bloom: sound.bloom * (theme ? 0.5 + theme.rhythm : 1),
    growthRate: modulation.growthRate * (theme ? 0.5 + theme.density : 1),
    drift: modulation.drift,
    mutation: modulation.mutation,
    energy: modulation.energy * (0.5 + openness),
    filterCutoff,
    resonance: resonance * (theme?.growthBehavior === 'crystal-facet' ? 1.3 : 1),
    lfoRate: 0.05 + driftNorm * 4 * (theme?.windStrength ?? 1),
    lfoDepth: driftNorm * (theme?.windStrength ?? 1),
    delayWet: bloomNorm * 0.6 + audio.delayWet,
    reverbWet: bloomNorm * 0.5 + audio.reverbWet,
    chorus: textureNorm * 0.4,
    phaser: driftNorm * 0.5,
    distortion: mutationNorm * 0.6,
    attack: Math.max(0.02, (1 - growthNorm) * 0.8),
    decay: 0.2 + bloomNorm * 0.5,
    sustain: 0.4 + energyNorm * 0.5,
    release: 0.5 + growthNorm * 3,
    oscillatorType: inferOscillatorType(presetId, sound, modulation),
  };
}

function inferOscillatorType(
  presetId: string,
  sound: SoundControlValues,
  modulation: ModulationControlValues,
): SoundVizParams['oscillatorType'] {
  if (presetId.includes('crystal') || presetId.includes('mutation')) {
    return 'fm';
  }
  if (presetId.includes('mycelium') || presetId.includes('coral')) {
    return 'granular';
  }
  if (presetId.includes('root') || presetId.includes('bass')) {
    return 'bass';
  }
  if (presetId.includes('bloom') || presetId.includes('flower') || presetId.includes('juno')) {
    return 'lead';
  }
  if (sound.texture > 70) {
    return 'noise';
  }
  if (sound.bloom > 65) {
    return 'pad';
  }
  if (modulation.drift > 60) {
    return 'analog';
  }
  return 'analog';
}
