import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { getPresetLiveRouting } from 'plantasia-sound-engine';
import type { AmbientHarmonicProfile } from './harmonicProfile';
import type { AmbientLayerKind } from './layers';
import { chance, nextEventDelay, weightedPick } from './probabilityEngine';

/** Preset-specific musical gesture behavior — timing, density, surprise events. */
export type GestureVocabulary = {
  /** Base clock multiplier per layer (lower = more active). */
  layerClockScale: Partial<Record<AmbientLayerKind, number>>;
  /** Probability of micro-timing jitter (0–1). */
  microTiming: number;
  /** Probability of occasional surprise accent (0–1). */
  surpriseRate: number;
  /** Long-cycle modulation period in minutes. */
  longCycleMinutes: number;
  /** Rest probability multiplier for this preset. */
  restBias: number;
  /** Favor stepwise vs leap for melody/gesture layers. */
  melodicContinuity: number;
};

const PLANTASONIC_VOCAB: GestureVocabulary = {
  layerClockScale: { drone: 1.15, texture: 0.95, melody: 1.1, gesture: 1.25, pulse: 1.2, noise: 0 },
  microTiming: 0.42,
  surpriseRate: 0.08,
  longCycleMinutes: 18,
  restBias: 1.35,
  melodicContinuity: 0.72,
};

const JUNO_VOCAB: GestureVocabulary = {
  layerClockScale: { drone: 1.05, texture: 0.88, melody: 0.92, gesture: 0.78, pulse: 1.08, noise: 0 },
  microTiming: 0.28,
  surpriseRate: 0.05,
  longCycleMinutes: 14,
  restBias: 0.85,
  melodicContinuity: 0.65,
};

const STANDARD_VOCAB: GestureVocabulary = {
  layerClockScale: { drone: 1, texture: 1, melody: 1, gesture: 1, pulse: 1.05, noise: 0 },
  microTiming: 0.32,
  surpriseRate: 0.04,
  longCycleMinutes: 12,
  restBias: 1,
  melodicContinuity: 0.58,
};

export function resolveGestureVocabulary(preset: PlantasiaPreset): GestureVocabulary {
  const routing = getPresetLiveRouting(preset);
  if (routing === 'plantasonic') {
    return PLANTASONIC_VOCAB;
  }
  if (routing === 'botanical') {
    return JUNO_VOCAB;
  }

  const ascii = preset.asciiState ?? '';
  if (ascii === 'mutation' || preset.category?.includes('textures')) {
    return {
      ...STANDARD_VOCAB,
      surpriseRate: 0.09,
      restBias: 1.2,
      microTiming: 0.45,
    };
  }

  return STANDARD_VOCAB;
}

export type NextGesture = {
  delaySec: number;
  allowRest: boolean;
  surpriseAccent: boolean;
  densityScale: number;
  longCyclePhase: number;
};

/** Compute next gesture timing from preset vocabulary + session state. */
export function generateNextGesture(
  layer: AmbientLayerKind,
  vocab: GestureVocabulary,
  harmonic: AmbientHarmonicProfile,
  baseClockSec: number,
  sessionMinutes: number,
  densityBias: number,
): NextGesture {
  const scale = vocab.layerClockScale[layer] ?? 1;
  const longCyclePhase =
    (Math.sin((sessionMinutes / vocab.longCycleMinutes) * Math.PI * 2) + 1) * 0.5;

  const densityScale = densityBias * (0.82 + longCyclePhase * 0.18);
  const restWeight = harmonic.weights.pause * vocab.restBias * (1.1 - densityScale * 0.4);
  const allowRest = chance(Math.min(0.35, restWeight));

  const variance = 0.28 + vocab.microTiming * 0.35;
  let delaySec = nextEventDelay(baseClockSec * scale, variance);

  if (vocab.microTiming > 0 && chance(vocab.microTiming)) {
    delaySec += (Math.random() - 0.5) * baseClockSec * 0.15;
  }

  const surpriseAccent =
    layer === 'melody' || layer === 'gesture'
      ? chance(vocab.surpriseRate * (0.5 + longCyclePhase * 0.5))
      : false;

  return { delaySec, allowRest, surpriseAccent, densityScale, longCyclePhase };
}

/** Pick whether a layer should fire on this tick given density and vocabulary. */
export function shouldLayerPlay(
  layer: AmbientLayerKind,
  densityScale: number,
  vocab: GestureVocabulary,
): boolean {
  const layerWeight = weightedPick([
    { value: true, weight: densityScale },
    { value: false, weight: (1 - densityScale) * vocab.restBias },
  ]);
  if (layer === 'drone' || layer === 'pulse') {
    return true;
  }
  if (layer === 'texture') {
    return layerWeight || chance(densityScale * 0.85);
  }
  return layerWeight;
}
