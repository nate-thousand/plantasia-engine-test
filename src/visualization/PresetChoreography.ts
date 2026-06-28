import { resolveThemeTemplateKeyFromTheme } from './PresetVisualThemes';
import type { PresetTheme } from './types';

/** Preset motion family — unique choreography per Sound World archetype. */
export type ChoreographyFamily = 'plant' | 'mold' | 'space' | 'tape' | 'water';

export type ChoreographyProfile = {
  family: ChoreographyFamily;
  /** Scale pulse from bass. */
  scalePulse: number;
  /** Rotation from midrange. */
  rotationBias: number;
  /** Orbit speed multiplier. */
  orbitSpeed: number;
  /** Treble shimmer intensity. */
  shimmer: number;
  /** Camera push on bass hits. */
  cameraPush: number;
  /** Parallax depth. */
  parallax: number;
  /** Shear / wobble amount. */
  wobble: number;
  /** Peak event style. */
  peakStyle: 'bloom' | 'burst' | 'constellation' | 'corruption' | 'ripple' | 'roll';
};

const PLANT: ChoreographyProfile = {
  family: 'plant',
  scalePulse: 1,
  rotationBias: 0.35,
  orbitSpeed: 0.5,
  shimmer: 0.4,
  cameraPush: 0.55,
  parallax: 0.45,
  wobble: 0.2,
  peakStyle: 'bloom',
};

const MOLD: ChoreographyProfile = {
  family: 'mold',
  scalePulse: 0.85,
  rotationBias: 0.65,
  orbitSpeed: 0.35,
  shimmer: 0.55,
  cameraPush: 0.4,
  parallax: 0.35,
  wobble: 0.75,
  peakStyle: 'corruption',
};

const SPACE: ChoreographyProfile = {
  family: 'space',
  scalePulse: 0.7,
  rotationBias: 0.9,
  orbitSpeed: 1.2,
  shimmer: 0.85,
  cameraPush: 0.65,
  parallax: 0.8,
  wobble: 0.15,
  peakStyle: 'constellation',
};

const TAPE: ChoreographyProfile = {
  family: 'tape',
  scalePulse: 0.55,
  rotationBias: 0.25,
  orbitSpeed: 0.3,
  shimmer: 0.35,
  cameraPush: 0.3,
  parallax: 0.25,
  wobble: 0.9,
  peakStyle: 'roll',
};

const WATER: ChoreographyProfile = {
  family: 'water',
  scalePulse: 0.75,
  rotationBias: 0.4,
  orbitSpeed: 0.55,
  shimmer: 0.6,
  cameraPush: 0.5,
  parallax: 0.55,
  wobble: 0.45,
  peakStyle: 'ripple',
};

const BY_THEME: Record<string, ChoreographyProfile> = {
  seed: PLANT,
  moss: PLANT,
  roots: PLANT,
  root: PLANT,
  bloom: PLANT,
  fern: PLANT,
  canopy: PLANT,
  rainforest: PLANT,
  vine: PLANT,
  juno: PLANT,
  'night-bloom': PLANT,
  desert: PLANT,
  coral: WATER,
  mycelium: MOLD,
  mutation: MOLD,
  crystal: SPACE,
  winter: SPACE,
  plantasonic: TAPE,
};

export function getChoreographyForTheme(theme: PresetTheme): ChoreographyProfile {
  const key = resolveThemeTemplateKeyFromTheme(theme);
  return BY_THEME[key] ?? PLANT;
}
