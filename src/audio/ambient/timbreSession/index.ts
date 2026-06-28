import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { resolveTimbreProfile } from '../timbreProfile';
import { resolveGestureVocabulary } from '../gestureVocabulary';
import type { PresetTimbreSession } from './types';
import { createJunoTimbreSession } from './junoSession';
import { createPlantasonicTimbreSession } from './plantasonicSession';
import { createStandardTimbreSession } from './standardSession';

/** Create preset-routed sound world for Play mode orchestration. */
export async function createPresetTimbreSession(preset: PlantasiaPreset): Promise<PresetTimbreSession> {
  const profile = resolveTimbreProfile(preset);
  const gestureVocabulary = resolveGestureVocabulary(preset);

  switch (profile.routing) {
    case 'plantasonic':
      return createPlantasonicTimbreSession(preset, profile, gestureVocabulary);
    case 'botanical':
      return createJunoTimbreSession(preset, profile, gestureVocabulary);
    default:
      return createStandardTimbreSession(preset, profile, gestureVocabulary);
  }
}

export { resolveTimbreProfile } from '../timbreProfile';
export type { TimbreProfile } from '../timbreProfile';
export type { PresetTimbreSession, AmbientVoiceActor, GenerativeVoiceSlot } from './types';
