import type { ModulationControlValues, SoundControlValues } from '../../types/instrument';
import type { AmbientRouting } from './timbreProfile';
import type { TimbreProfile } from './timbreProfile';

/** Normalized macro inputs 0–1. */
export type MacroInputs = {
  mold: number;
  tone: number;
  texture: number;
  bloom: number;
  drift: number;
  energy: number;
  evolutionPhase: number;
  densityBias: number;
};

export function macrosFromControls(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
  evolutionPhase: number,
  densityBias: number,
): MacroInputs {
  return {
    mold: sound.mold / 100,
    tone: sound.tone / 100,
    texture: sound.texture / 100,
    bloom: sound.bloom / 100,
    drift: modulation.drift / 100,
    energy: modulation.energy / 100,
    evolutionPhase,
    densityBias,
  };
}

/** Preset-specific macro interpretation — bloom, mold, texture, drift. */
export type MacroBehavior = {
  /** Filter openness / organic movement */
  filterOpen: number;
  /** Space / delay / reverb depth */
  spaceDepth: number;
  /** Shimmer / chorus / stereo width */
  shimmer: number;
  /** Degradation / instability / mold character */
  degradation: number;
  /** Texture layer gain */
  textureGain: number;
  /** LFO / drift rate multiplier */
  driftRate: number;
  /** Voice density influence */
  densityScale: number;
};

export function applyPresetMacroBehavior(
  routing: AmbientRouting,
  profile: TimbreProfile,
  macros: MacroInputs,
): MacroBehavior {
  switch (routing) {
    case 'plantasonic':
      return plantasonicMacros(profile, macros);
    case 'botanical':
      return junoMacros(profile, macros);
    default:
      return standardMacros(profile, macros);
  }
}

function plantasonicMacros(profile: TimbreProfile, m: MacroInputs): MacroBehavior {
  return {
    filterOpen:
      profile.performanceMacros.growthFilter * 0.4 +
      m.bloom * 0.45 +
      m.evolutionPhase * 0.12,
    spaceDepth:
      profile.performanceMacros.growthSpace * 0.35 +
      m.bloom * 0.5 +
      m.energy * 0.15,
    shimmer:
      profile.motionBehavior.granularShimmer
        ? 0.25 + m.bloom * 0.55 + m.texture * 0.2
        : m.bloom * 0.35,
    degradation:
      m.mold * 0.85 +
      (profile.effectsChain.wowFlutter ?? 0.1) * m.mold * 0.4,
    textureGain:
      profile.textureLayer.organicBed * 2 +
      profile.textureLayer.filteredNoise * 3 +
      m.texture * 0.35 +
      m.bloom * 0.15,
    driftRate:
      profile.modulation.vlfRate * (0.6 + m.drift * 1.4 + m.evolutionPhase * 0.3),
    densityScale: m.densityBias * (0.75 + m.energy * 0.35 + m.bloom * 0.1),
  };
}

function junoMacros(profile: TimbreProfile, m: MacroInputs): MacroBehavior {
  const chorusBase = profile.effectsChain.chorusDepth ?? 0.5;
  return {
    filterOpen: 0.4 + m.bloom * 0.35 + m.tone * 0.25,
    spaceDepth:
      profile.performanceMacros.growthSpace * 0.4 +
      m.bloom * 0.45 +
      (profile.motionBehavior.bbdStyleDelay ? m.bloom * 0.2 : 0),
    shimmer: chorusBase * (0.5 + m.bloom * 0.65 + m.energy * 0.15),
    degradation:
      m.mold * 0.7 +
      (profile.effectsChain.wowFlutter ?? 0.08) * m.mold * 0.55,
    textureGain: profile.textureLayer.airLevel * 0.6 + m.texture * 0.4 + m.mold * 0.12,
    driftRate:
      profile.modulation.vlfRate * (0.5 + m.drift * 1.2) +
      m.mold * 0.04,
    densityScale: m.densityBias * (0.8 + m.energy * 0.3),
  };
}

function standardMacros(profile: TimbreProfile, m: MacroInputs): MacroBehavior {
  return {
    filterOpen: 0.35 + m.tone * 0.35 + m.bloom * 0.2,
    spaceDepth: profile.performanceMacros.growthSpace * 0.3 + m.bloom * 0.55,
    shimmer: m.bloom * 0.4 + m.texture * 0.15,
    degradation: m.mold * 0.65,
    textureGain: profile.textureLayer.airLevel * 4 + m.texture * 0.35,
    driftRate: profile.modulation.vlfRate * (0.7 + m.drift * 1.1),
    densityScale: m.densityBias * (0.78 + m.energy * 0.28),
  };
}
