import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import { FEEDBACK_GAIN } from './VisualFeedback';
import type { SoundVizParams } from './types';

/** Heavy audio-reactive boost — merges live signal into slider-derived params. */
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
  const g = FEEDBACK_GAIN;

  return {
    ...params,
    volume: Math.min(100, params.volume + combined * 35 * g),
    tone: Math.min(100, params.tone + (audio.brightness * 45 + audio.treble * 30) * g),
    texture: Math.min(100, params.texture + (audio.mid * 40 + combined * 20) * g),
    bloom: Math.min(100, params.bloom + (peak * 50 + audio.treble * 25) * g),
    energy: Math.min(100, params.energy + (combined * 70 + audio.bass * 25) * g),
    growthRate: Math.min(100, params.growthRate + amp * 40 * g),
    drift: Math.min(100, params.drift + (audio.mid * 30 + combined * 15) * g),
    mutation: Math.min(100, params.mutation + peak * 35 * g),
    filterCutoff: Math.min(100, params.filterCutoff + (audio.brightness * 55 + audio.treble * 35) * g),
    resonance: Math.min(100, params.resonance + (audio.mid * 50 + combined * 25) * g),
    lfoRate: params.lfoRate + (combined * 3 + audio.mid * 2) * g,
    lfoDepth: Math.min(1, params.lfoDepth + (combined * 0.65 + audio.bass * 0.25) * g),
    delayWet: Math.min(1, params.delayWet + peak * 0.35 * g),
    reverbWet: Math.min(1, params.reverbWet + (amp * 0.4 + audio.treble * 0.2) * g),
    chorus: Math.min(1, params.chorus + audio.mid * 0.45 * g),
    phaser: Math.min(1, params.phaser + combined * 0.35 * g),
    distortion: Math.min(1, params.distortion + peak * 0.4 * g),
    attack: Math.max(0.01, params.attack * (1 - combined * 0.6 * g)),
    decay: params.decay + combined * 0.3 * g,
    sustain: Math.min(1, params.sustain + amp * 0.45 * g),
    release: params.release * (1 + (1 - amp) * 0.3 * g),
  };
}

/** Per-note amplitude boost from live signal + velocity. */
export function noteAudioIntensity(
  velocity: number,
  audio: AudioVizFeedback,
): number {
  const vel = velocity / 127;
  return Math.min(1, vel * 0.45 + audio.amplitude * 0.85 * FEEDBACK_GAIN + audio.peak * 0.35 * FEEDBACK_GAIN);
}

/** Spawn rate multiplier driven by live audio. */
export function audioParticleRate(audio: AudioVizFeedback): number {
  return 1 + audio.amplitude * 6 * FEEDBACK_GAIN + audio.peak * 4 * FEEDBACK_GAIN;
}

/** Background density multiplier from bass + amplitude. */
export function audioDensityBoost(audio: AudioVizFeedback): number {
  return 1 + audio.amplitude * 2.5 * FEEDBACK_GAIN + audio.bass * 1.8 * FEEDBACK_GAIN;
}
