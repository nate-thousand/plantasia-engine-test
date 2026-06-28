import type { PlantasiaPreset } from 'plantasia-sound-engine';
import type { GestureVocabulary } from '../gestureVocabulary';
import type { AmbientLayerKind } from '../layers';
import type { VoiceKind } from '../probabilityEngine';
import type { TimbreProfile } from '../timbreProfile';
import type { PresetSoundWorld } from '../presetSoundWorld';

/** Voice actor — abstracts engine vs standard backends. Play mode never creates synths. */
export interface AmbientVoiceActor {
  readonly kind: VoiceKind;
  attack(note: string, time: number, velocity: number): void;
  attackRelease(note: string, duration: number, time: number, velocity: number): void;
  release(time: number, releaseSec?: number): void;
  tick(): void;
  dispose(): void;
}

/** Preset-routed audio session — implements PresetSoundWorld for Play orchestration. */
export interface PresetTimbreSession extends PresetSoundWorld {
  readonly preset: PlantasiaPreset;
  readonly profile: TimbreProfile;
  readonly gestureVocabulary: GestureVocabulary;
}

export type GenerativeVoiceSlot = {
  kind: VoiceKind;
  layer: AmbientLayerKind;
  actor: AmbientVoiceActor;
  degree: number;
  octaveOffset: number;
  nextEventAt: number;
  clockBase: number;
  activeNotes: string[];
};
