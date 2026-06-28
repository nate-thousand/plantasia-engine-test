import type { VoiceKind } from './probabilityEngine';

/** Consistent layer types — implementation varies per preset sound world. */
export type AmbientLayerKind =
  | 'drone'
  | 'pulse'
  | 'melody'
  | 'texture'
  | 'noise'
  | 'gesture';

/** Maps generative voice slots to semantic layer roles. */
export const VOICE_TO_LAYER: Record<VoiceKind, AmbientLayerKind> = {
  drone: 'drone',
  sub: 'pulse',
  pad: 'texture',
  bell: 'melody',
  pluck: 'gesture',
  air: 'noise',
};

export const LAYER_TO_VOICE: Partial<Record<AmbientLayerKind, VoiceKind>> = {
  drone: 'drone',
  pulse: 'sub',
  texture: 'pad',
  melody: 'bell',
  gesture: 'pluck',
  noise: 'air',
};

export function layerForVoice(kind: VoiceKind): AmbientLayerKind {
  return VOICE_TO_LAYER[kind];
}

export function voiceForLayer(layer: AmbientLayerKind): VoiceKind {
  return LAYER_TO_VOICE[layer] ?? 'drone';
}
