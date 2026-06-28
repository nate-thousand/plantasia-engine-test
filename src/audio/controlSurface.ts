import type { BotanicalControls } from 'plantasia-sound-engine';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';

/**
 * Map instrument control surface sliders to engine botanical parameters.
 *
 * Engine `applyBotanicalControls` reads: energy, growth, texture, space, life, resonance.
 * density, evolution, and random extend the live keyboard/MIDI path.
 */
export function mapControlSurfaceToBotanical(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
): BotanicalControls {
  return {
    energy: sound.volume,
    resonance: sound.tone,
    texture: sound.texture,
    space: sound.bloom,
    growth: modulation.growthRate,
    life: modulation.drift,
    density: modulation.energy,
    evolution: modulation.mutation,
    random: modulation.mutation,
    harmony: sound.tone,
  };
}
