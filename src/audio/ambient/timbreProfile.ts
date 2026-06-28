import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { getPresetLiveRouting } from 'plantasia-sound-engine';
import type { VoiceKind } from './probabilityEngine';

export type AmbientRouting = 'standard' | 'plantasonic' | 'botanical';

export type TimbreOscillators = {
  primary: string;
  secondary?: string;
  spread?: number;
  count?: number;
  detuneCents?: number[];
};

export type TimbreFilterShape = {
  type: 'lowpass' | 'bandpass' | 'highpass';
  baseHz: number;
  q: number;
  lfoDepth: number;
  lfoRate: number;
};

export type TimbreEnvelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type TimbreEffectsChain = {
  delayTime: number;
  delayFeedback: number;
  delayWet: number;
  reverbDecay: number;
  reverbWet: number;
  chorusDepth?: number;
  chorusRate?: number;
  saturation?: number;
  wowFlutter?: number;
  tapeHiss?: number;
};

export type TimbreModulation = {
  pitchDrift: number;
  filterMovement: number;
  stereoMovement: number;
  amplitudeVariation: number;
  vlfRate: number;
};

export type TimbreMotionBehavior = {
  livingVoiceTick: boolean;
  plantLikeModulation: boolean;
  bbdStyleDelay: boolean;
  granularShimmer: boolean;
};

export type TimbreTextureLayer = {
  noiseType: 'pink' | 'white' | 'brown';
  airLevel: number;
  filteredNoise: number;
  organicBed: number;
};

export type TimbrePerformanceMacros = {
  growthFilter: number;
  growthSpace: number;
  growthMotion: number;
  expressionAmbience: number;
};

/** Preset-owned timbre definition for Play mode. */
export type TimbreProfile = {
  presetId: string;
  routing: AmbientRouting;
  soundWorld: string;
  oscillators: TimbreOscillators;
  noiseType: 'pink' | 'white' | 'brown';
  filterShape: TimbreFilterShape;
  envelopes: Record<VoiceKind, TimbreEnvelope>;
  modulation: TimbreModulation;
  effectsChain: TimbreEffectsChain;
  motionBehavior: TimbreMotionBehavior;
  densityRange: { min: number; max: number };
  textureLayer: TimbreTextureLayer;
  performanceMacros: TimbrePerformanceMacros;
  voiceKinds: VoiceKind[];
};

const DEFAULT_ENVELOPES: Record<VoiceKind, TimbreEnvelope> = {
  drone: { attack: 2.5, decay: 0.8, sustain: 0.78, release: 5.5 },
  pad: { attack: 2.2, decay: 1.2, sustain: 0.65, release: 6 },
  bell: { attack: 0.08, decay: 1.8, sustain: 0.05, release: 3.5 },
  pluck: { attack: 0.04, decay: 0.8, sustain: 0.02, release: 1.6 },
  sub: { attack: 1.8, decay: 0.5, sustain: 0.85, release: 5 },
  air: { attack: 0.5, decay: 0.2, sustain: 1, release: 2 },
};

function synthOscillator(settings: PlantasiaPreset['synth']): string {
  return settings.oscillator === 'sawtooth' ? 'fatsawtooth' : settings.oscillator ?? 'sine';
}

/** Resolve timbre profile from preset JSON + routing. */
export function resolveTimbreProfile(preset: PlantasiaPreset): TimbreProfile {
  const routing = getPresetLiveRouting(preset) as AmbientRouting;
  const synth = preset.synth;
  const baseFilterHz = Math.max(synth.filterHz ?? 1100, 200);

  if (routing === 'plantasonic' && preset.plantasonic) {
    const p = preset.plantasonic;
    return {
      presetId: preset.id,
      routing,
      soundWorld: 'plantasonic',
      oscillators: {
        primary: p.oscillators.oscA ?? 'sawtooth',
        secondary: p.oscillators.oscB ?? 'triangle',
        spread: 12,
        count: 3,
        detuneCents: p.oscillators.detuneCents,
      },
      noiseType: 'pink',
      filterShape: {
        type: 'lowpass',
        baseHz: p.filter.cutoffHz,
        q: p.filter.resonance,
        lfoDepth: p.modulation.filterMovement,
        lfoRate: p.modulation.vlfRate,
      },
      envelopes: {
        ...DEFAULT_ENVELOPES,
        drone: { attack: 2.8, decay: 1, sustain: 0.8, release: 6 },
        pad: { attack: 2.4, decay: 1.1, sustain: 0.7, release: 5.5 },
        bell: { attack: 0.12, decay: 2.2, sustain: 0.08, release: 4 },
      },
      modulation: {
        pitchDrift: p.modulation.pitchDrift,
        filterMovement: p.modulation.filterMovement,
        stereoMovement: p.modulation.stereoMovement,
        amplitudeVariation: p.modulation.amplitudeVariation,
        vlfRate: p.modulation.vlfRate,
      },
      effectsChain: {
        delayTime: p.effects.delay?.time ?? 0.28,
        delayFeedback: p.effects.delay?.feedback ?? 0.12,
        delayWet: p.effects.delay?.mix ?? 0.14,
        reverbDecay: p.effects.reverb?.decay ?? 5.8,
        reverbWet: p.effects.reverb?.mix ?? 0.58,
        chorusDepth: p.effects.chorus?.depth ?? 0.48,
        chorusRate: p.effects.chorus?.rate ?? 0.22,
        saturation: p.effects.saturation ?? 0.28,
        wowFlutter: 0.18,
        tapeHiss: p.texture?.tapeHiss ?? 0.025,
      },
      motionBehavior: {
        livingVoiceTick: true,
        plantLikeModulation: true,
        bbdStyleDelay: false,
        granularShimmer: true,
      },
      densityRange: { min: 0.32, max: 0.78 },
      textureLayer: {
        noiseType: 'pink',
        airLevel: p.texture?.air ?? 0.035,
        filteredNoise: p.texture?.pinkNoise ?? 0.04,
        organicBed: p.texture?.ambience ?? 0.02,
      },
      performanceMacros: {
        growthFilter: p.performance?.growth?.filterOpen ?? 0.62,
        growthSpace: p.performance?.growth?.reverbAmount ?? 0.52,
        growthMotion: p.performance?.growth?.chorusDepth ?? 0.58,
        expressionAmbience: p.performance?.expression?.ambience ?? 0.72,
      },
      voiceKinds: ['drone', 'pad', 'bell', 'pluck', 'sub'],
    };
  }

  if (routing === 'botanical' && preset.botanical) {
    const b = preset.botanical;
    return {
      presetId: preset.id,
      routing,
      soundWorld: 'juno-flowers',
      oscillators: {
        primary: 'fatsawtooth',
        secondary: 'pulse',
        spread: 18,
        count: 4,
        detuneCents: synth.detuneCents,
      },
      noiseType: 'pink',
      filterShape: {
        type: 'lowpass',
        baseHz: synth.filterHz ?? 1750,
        q: synth.filterQ ?? 2.4,
        lfoDepth: b.wind?.depth ?? 0.38,
        lfoRate: b.wind?.rate ?? 0.055,
      },
      envelopes: {
        ...DEFAULT_ENVELOPES,
        drone: { attack: 2.2, decay: 1, sustain: 0.75, release: 5 },
        pad: { attack: 1.8, decay: 1, sustain: 0.68, release: 4.5 },
        pluck: { attack: 0.02, decay: 0.5, sustain: 0.01, release: 1.2 },
      },
      modulation: {
        pitchDrift: synth.drift ?? 0.88,
        filterMovement: b.wind?.depth ?? 0.38,
        stereoMovement: b.canopy?.spread ?? 0.72,
        amplitudeVariation: 0.22,
        vlfRate: b.wind?.rate ?? 0.055,
      },
      effectsChain: {
        delayTime: 0.36,
        delayFeedback: 0.32,
        delayWet: synth.effects?.delay ?? 0.32,
        reverbDecay: 7 + (synth.effects?.reverb ?? 0.62) * 4,
        reverbWet: 0.55,
        chorusDepth: b.pollen?.chorusDepth ?? 0.58,
        chorusRate: b.pollen?.chorusRate ?? 0.34,
        saturation: b.roots?.sat ?? 0.28,
        wowFlutter: 0.12,
      },
      motionBehavior: {
        livingVoiceTick: true,
        plantLikeModulation: false,
        bbdStyleDelay: true,
        granularShimmer: false,
      },
      densityRange: { min: 0.35, max: 0.82 },
      textureLayer: {
        noiseType: 'pink',
        airLevel: b.morningMist?.mix ?? 0.62,
        filteredNoise: 0.05,
        organicBed: b.roots?.sub ?? 0.32,
      },
      performanceMacros: {
        growthFilter: 0.55,
        growthSpace: b.canopy?.reverbWidth ?? 0.58,
        growthMotion: b.pollen?.shimmer ?? 0.42,
        expressionAmbience: 0.65,
      },
      voiceKinds: ['drone', 'pad', 'pluck', 'bell', 'sub'],
    };
  }

  const ascii = preset.asciiState ?? 'seed';
  const category = preset.category ?? '';
  const isAmbient = category.includes('ambient');
  const isTexture = category.includes('textures');

  return {
    presetId: preset.id,
    routing: 'standard',
    soundWorld: ascii,
    oscillators: {
      primary: synthOscillator(synth),
      spread: isTexture ? 6 : 10,
      count: 2,
      detuneCents: synth.detuneCents,
    },
    noiseType: isAmbient ? 'brown' : 'pink',
    filterShape: {
      type: (synth.filterType as TimbreFilterShape['type']) ?? 'lowpass',
      baseHz: baseFilterHz,
      q: synth.filterQ ?? 0.7,
      lfoDepth: synth.drift ?? 0.2,
      lfoRate: 0.05,
    },
    envelopes: { ...DEFAULT_ENVELOPES },
    modulation: {
      pitchDrift: synth.drift ?? 0.2,
      filterMovement: 0.25,
      stereoMovement: synth.stereoWidth ?? 0.5,
      amplitudeVariation: 0.15,
      vlfRate: 0.04,
    },
    effectsChain: {
      delayTime: 0.38,
      delayFeedback: 0.28,
      delayWet: (synth.effects?.delay ?? 0.2) + 0.08,
      reverbDecay: 6 + (synth.effects?.reverb ?? 0.35) * 8,
      reverbWet: (synth.effects?.reverb ?? 0.4) + 0.18,
      saturation: synth.saturation ?? 0.15,
    },
    motionBehavior: {
      livingVoiceTick: false,
      plantLikeModulation: ascii === 'seed' || preset.species?.toLowerCase().includes('moss') === true,
      bbdStyleDelay: false,
      granularShimmer: false,
    },
    densityRange: { min: 0.28, max: 0.72 },
    textureLayer: {
      noiseType: isAmbient ? 'brown' : 'pink',
      airLevel: 0.04,
      filteredNoise: 0.03,
      organicBed: 0.02,
    },
    performanceMacros: {
      growthFilter: 0.45,
      growthSpace: 0.5,
      growthMotion: 0.4,
      expressionAmbience: 0.55,
    },
    voiceKinds: isAmbient
      ? ['drone', 'pad', 'sub', 'bell']
      : ['drone', 'pad', 'bell', 'pluck', 'sub'],
  };
}
