import type { PlantasiaPreset } from 'plantasia-sound-engine';
import type { ModulationControlValues, SoundControlValues } from '../../types/instrument';
import type { GestureVocabulary } from './gestureVocabulary';
import type { AmbientLayerKind } from './layers';
import type { VoiceKind } from './probabilityEngine';
import type { TimbreProfile } from './timbreProfile';
import type { AmbientVoiceActor } from './timbreSession/types';

/**
 * Preset-owned sound world — Play mode requests layers from here.
 * Play mode owns timing; the preset owns synthesis, routing, and timbre.
 */
export interface PresetSoundWorld {
  readonly preset: PlantasiaPreset;
  readonly profile: TimbreProfile;
  readonly gestureVocabulary: GestureVocabulary;

  fadeIn(now: number, fadeSec: number): void;
  fadeOut(fade: boolean, releaseSec: number): void;
  applyControls(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
    evolutionPhase: number,
    densityBias: number,
  ): void;

  /** Layer factories — implementation differs per preset routing. */
  createDroneLayer(index: number): AmbientVoiceActor;
  createPulseLayer(index: number): AmbientVoiceActor;
  createMelodyLayer(index: number): AmbientVoiceActor;
  createTextureLayer(index: number): AmbientVoiceActor;
  createGestureLayer(index: number): AmbientVoiceActor;
  createNoiseLayer(index: number): AmbientVoiceActor | null;

  createLayerActor(layer: AmbientLayerKind, index: number): AmbientVoiceActor | null;
  createVoiceActor(kind: VoiceKind, index: number): AmbientVoiceActor;

  tickLiving(): void;
  getTextureAmount(): number;
  dispose(): void;
}

export function createLayerActor(
  world: PresetSoundWorld,
  layer: AmbientLayerKind,
  index: number,
): AmbientVoiceActor | null {
  switch (layer) {
    case 'drone':
      return world.createDroneLayer(index);
    case 'pulse':
      return world.createPulseLayer(index);
    case 'melody':
      return world.createMelodyLayer(index);
    case 'texture':
      return world.createTextureLayer(index);
    case 'gesture':
      return world.createGestureLayer(index);
    case 'noise':
      return world.createNoiseLayer(index);
    default:
      return null;
  }
}
