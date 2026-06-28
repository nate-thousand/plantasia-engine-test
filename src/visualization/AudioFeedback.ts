import { AUDIO_VIZ_GAIN } from './VisualFeedback';
import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import type { SoundVizParams } from './types';

/** Audio-reactive boost — merges live signal into slider-derived params. */
export function applyAudioFeedback(
  params: SoundVizParams,
  audio: AudioVizFeedback,
): SoundVizParams {
  if (!audio.isActive && audio.amplitude < 0.01) {
    return params;
  }

  const amp = audio.amplitude;
  const peak = audio.peak;
  const combined = Math.min(1, amp * 0.65 + peak * 0.35);
  const g = AUDIO_VIZ_GAIN;

  return {
    ...params,
    mold: Math.min(100, params.mold + combined * 22 * g),
    tone: Math.min(100, params.tone + (audio.brightness * 28 + audio.treble * 18) * g),
    texture: Math.min(100, params.texture + (audio.mid * 24 + combined * 12) * g),
    bloom: Math.min(100, params.bloom + (peak * 32 + audio.treble * 16) * g),
    energy: Math.min(100, params.energy + (combined * 45 + audio.bass * 16) * g),
    growthRate: Math.min(100, params.growthRate + amp * 24 * g),
    drift: Math.min(100, params.drift + (audio.mid * 18 + combined * 10) * g),
    mutation: Math.min(100, params.mutation + peak * 22 * g),
    filterCutoff: Math.min(100, params.filterCutoff + (audio.brightness * 35 + audio.treble * 22) * g),
    resonance: Math.min(100, params.resonance + (audio.mid * 32 + combined * 16) * g),
    lfoRate: params.lfoRate + (combined * 2 + audio.mid * 1.2) * g,
    lfoDepth: Math.min(1, params.lfoDepth + (combined * 0.4 + audio.bass * 0.15) * g),
    delayWet: Math.min(1, params.delayWet + peak * 0.22 * g),
    reverbWet: Math.min(1, params.reverbWet + (amp * 0.25 + audio.treble * 0.12) * g),
    chorus: Math.min(1, params.chorus + audio.mid * 0.28 * g),
    phaser: Math.min(1, params.phaser + combined * 0.22 * g),
    distortion: Math.min(1, params.distortion + peak * 0.25 * g),
    attack: Math.max(0.01, params.attack * (1 - combined * 0.35 * g)),
    decay: params.decay + combined * 0.18 * g,
    sustain: Math.min(1, params.sustain + amp * 0.28 * g),
    release: params.release * (1 + (1 - amp) * 0.18 * g),
  };
}

/** Per-note amplitude boost from live signal + velocity. */
export function noteAudioIntensity(
  velocity: number,
  audio: AudioVizFeedback,
): number {
  const vel = velocity / 127;
  return Math.min(1, vel * 0.45 + audio.amplitude * 0.75 + audio.peak * 0.28);
}

/** Spawn rate multiplier driven by live audio. */
export function audioParticleRate(audio: AudioVizFeedback): number {
  return 1 + audio.amplitude * 2.8 + audio.peak * 1.8;
}

/** Background density multiplier from bass + amplitude. */
export function audioDensityBoost(audio: AudioVizFeedback): number {
  return 1 + audio.amplitude * 1.2 + audio.bass * 0.85;
}
