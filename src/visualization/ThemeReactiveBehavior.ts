import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import type { PresetVisualMetadata } from '../presets/types';

/** Per-theme audio-reactive multipliers — keyed by engine visual.asciiTheme. */
export type ThemeReactiveProfile = {
  bassBranchExtend: number;
  trebleBloomBoost: number;
  velocityDensityScale: number;
  sustainDriftBoost: number;
  slowNoteGlow: number;
  pitchBloomThreshold: number;
};

const DEFAULT_PROFILE: ThemeReactiveProfile = {
  bassBranchExtend: 1,
  trebleBloomBoost: 1,
  velocityDensityScale: 1,
  sustainDriftBoost: 1,
  slowNoteGlow: 1,
  pitchBloomThreshold: 60,
};

const THEME_PROFILES: Record<string, Partial<ThemeReactiveProfile>> = {
  seed: {
    trebleBloomBoost: 1.15,
    velocityDensityScale: 0.85,
    sustainDriftBoost: 1.1,
  },
  fern: {
    sustainDriftBoost: 1.3,
    slowNoteGlow: 1.2,
    velocityDensityScale: 0.95,
  },
  coral: {
    sustainDriftBoost: 1.15,
    velocityDensityScale: 0.7,
    trebleBloomBoost: 1.25,
  },
  vine: {
    sustainDriftBoost: 1.35,
    velocityDensityScale: 1.15,
    bassBranchExtend: 1.1,
  },
  crystal: {
    trebleBloomBoost: 1.4,
    sustainDriftBoost: 1.25,
    slowNoteGlow: 1.35,
  },
  juno: {
    trebleBloomBoost: 1.45,
    pitchBloomThreshold: 62,
    velocityDensityScale: 1.05,
  },
  bloom: {
    trebleBloomBoost: 1.55,
    pitchBloomThreshold: 64,
    velocityDensityScale: 1.1,
  },
  roots: {
    bassBranchExtend: 1.85,
    trebleBloomBoost: 0.75,
    velocityDensityScale: 0.9,
  },
  root: {
    bassBranchExtend: 1.85,
    trebleBloomBoost: 0.75,
  },
  rainforest: {
    velocityDensityScale: 1.45,
    sustainDriftBoost: 1.2,
  },
  winter: {
    sustainDriftBoost: 1.65,
    slowNoteGlow: 1.4,
    velocityDensityScale: 0.85,
  },
  'night-bloom': {
    slowNoteGlow: 1.75,
    sustainDriftBoost: 1.35,
    bassBranchExtend: 1.15,
  },
  'juno-flowers': {
    trebleBloomBoost: 1.5,
    slowNoteGlow: 1.65,
    sustainDriftBoost: 1.3,
    pitchBloomThreshold: 62,
  },
  moss: {
    velocityDensityScale: 0.75,
    slowNoteGlow: 1.1,
  },
  desert: {
    velocityDensityScale: 0.65,
    sustainDriftBoost: 0.8,
    trebleBloomBoost: 1.2,
  },
  canopy: {
    sustainDriftBoost: 1.25,
    velocityDensityScale: 1.05,
  },
  plantasonic: {
    sustainDriftBoost: 1.2,
    slowNoteGlow: 1.15,
  },
  mycelium: {
    velocityDensityScale: 1.2,
    sustainDriftBoost: 1.1,
  },
  mutation: {
    velocityDensityScale: 1.35,
    trebleBloomBoost: 1.3,
  },
};

export function getThemeReactiveProfile(
  visual: PresetVisualMetadata | undefined,
): ThemeReactiveProfile {
  const key = visual?.asciiTheme;
  if (!key) {
    return DEFAULT_PROFILE;
  }

  const overrides = THEME_PROFILES[key] ?? {};
  return { ...DEFAULT_PROFILE, ...overrides };
}

export function themePlantGrowthBoost(
  profile: ThemeReactiveProfile,
  midi: number,
  velocity: number,
  audio: AudioVizFeedback,
): number {
  let boost = 1;

  if (midi >= profile.pitchBloomThreshold) {
    boost *= profile.trebleBloomBoost;
  }

  boost *= 1 + (velocity / 127) * (profile.velocityDensityScale - 1);
  boost *= 1 + audio.bass * (profile.bassBranchExtend - 1) * 0.5;

  return boost;
}

export function themeSustainParticleRate(
  profile: ThemeReactiveProfile,
  noteAge: number,
  audio: AudioVizFeedback,
): number {
  if (noteAge < 0.4) {
    return 1;
  }

  return 1 + (profile.sustainDriftBoost - 1) * Math.min(1, noteAge / 2) * (0.5 + audio.amplitude);
}

export function themeGlowIntensity(
  profile: ThemeReactiveProfile,
  velocity: number,
  audio: AudioVizFeedback,
): number {
  return (0.4 + (velocity / 127) * 0.6) * profile.slowNoteGlow * (0.7 + audio.peak * 0.3);
}
