/**
 * Milestone 15 — Adaptive Ambient Focus Engine facade.
 * Delegates to the generative multi-voice pentatonic engine.
 */
import type { PlantasiaPreset } from 'plantasia-sound-engine';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import { ambientFocusEngine } from './ambient/AmbientFocusEngine';

class AmbientSoundscape {
  isActive(): boolean {
    return ambientFocusEngine.isActive();
  }

  async start(preset: PlantasiaPreset): Promise<void> {
    await ambientFocusEngine.start(preset);
  }

  async stop(fade = true): Promise<void> {
    await ambientFocusEngine.stop(fade);
  }

  applyControls(sound: SoundControlValues, modulation: ModulationControlValues): void {
    ambientFocusEngine.applyControls(sound, modulation);
  }
}

export const ambientSoundscape = new AmbientSoundscape();
