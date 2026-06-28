import type { PresetTheme, SoundVizParams } from './types';

/** Theme-specific growth speed multiplier from attack slider. */
export function themeAttackMultiplier(theme: PresetTheme, attack: number): number {
  switch (theme.growthBehavior) {
    case 'seed-arc':
      return 0.4 + attack * 3.5;
    case 'fast-bloom':
      return 0.3 + attack * 4;
    case 'downward-root':
      return 0.15 + attack * 1.2;
    case 'slow-vine':
    case 'field-wave':
      return 0.1 + attack * 0.8;
    case 'crystal-facet':
      return 0.25 + attack * 2.5;
    case 'particle-cloud':
    case 'network-mycelium':
      return 0.2 + attack * 1.5;
    case 'moss-crawl':
      return 0.08 + attack * 0.5;
    default:
      return 0.5 + attack * 2;
  }
}

/** Theme-specific release / fade rate. */
export function themeReleaseRate(theme: PresetTheme, release: number, reduceMotion: boolean): number {
  const base = reduceMotion ? 0.3 : 1;
  switch (theme.decayBehavior) {
    case 'fast-fade':
      return base * (1.2 + release * 2.5);
    case 'quick-petal':
      return base * (1 + release * 2);
    case 'slow-root':
      return base * (0.25 + release * 0.4);
    case 'gentle-unfurl':
    case 'atmospheric-fade':
      return base * (0.35 + release * 0.6);
    case 'fragment-cloud':
      return base * (0.6 + release * 1.2);
    case 'distort-decay':
      return base * (0.8 + release * 1.8);
    case 'shatter-fade':
      return base * (0.9 + release * 2);
    default:
      return base * (0.8 + release * 1.5);
  }
}

/** Filter cutoff → visual openness / density per theme. */
export function themeFilterOpenness(theme: PresetTheme, filterCutoff: number): number {
  const norm = filterCutoff / 100;
  switch (theme.growthBehavior) {
    case 'moss-crawl':
    case 'particle-cloud':
      return 0.3 + norm * 0.5;
    case 'downward-root':
      return 0.5 + norm * 0.3;
    case 'crystal-facet':
      return 0.4 + norm * 0.8;
    default:
      return 0.4 + norm * 0.6;
  }
}

/** Resonance → branching / sparkle intensity. */
export function themeResonanceBranch(theme: PresetTheme, resonance: number): number {
  const norm = resonance / 100;
  switch (theme.growthBehavior) {
    case 'crystal-facet':
      return norm * 0.12;
    case 'fast-bloom':
      return norm * 0.08;
    case 'network-mycelium':
    case 'particle-cloud':
      return norm * 0.06;
    case 'downward-root':
      return norm * 0.03;
    case 'slow-vine':
      return norm * 0.04;
    default:
      return norm * 0.05;
  }
}

/** Target segment count from bloom + theme density. */
export function themeSegmentTarget(
  theme: PresetTheme,
  sound: SoundVizParams,
  growth: number,
): number {
  const bloomFactor = sound.bloom / 100;
  const resFactor = sound.resonance / 100;
  const openness = themeFilterOpenness(theme, sound.filterCutoff);

  let base: number;
  switch (theme.growthBehavior) {
    case 'downward-root':
      base = 4 + bloomFactor * 10 + resFactor * 4;
      break;
    case 'fast-bloom':
      base = 3 + bloomFactor * 14 + resFactor * 8;
      break;
    case 'crystal-facet':
      base = 3 + bloomFactor * 8 + resFactor * 10;
      break;
    case 'seed-arc':
      base = 2 + bloomFactor * 5 + resFactor * 3;
      break;
    case 'particle-cloud':
    case 'network-mycelium':
      base = 2 + bloomFactor * 6 + resFactor * 5;
      break;
    case 'field-wave':
      base = 2 + bloomFactor * 4 + resFactor * 2;
      break;
    case 'moss-crawl':
      base = 5 + bloomFactor * 6 * openness;
      break;
    case 'slow-vine':
    default:
      base = 3 + bloomFactor * 7 + resFactor * 5;
      break;
  }

  return Math.round(base * growth * (0.5 + theme.density));
}

/** Branch angle bias per growth behavior. */
export function themeBranchAngle(
  theme: PresetTheme,
  lastAngle: number,
  sound: SoundVizParams,
  seed: number,
): number {
  const spread = 0.3 + sound.resonance / 200;

  switch (theme.growthBehavior) {
    case 'downward-root':
      return lastAngle + (Math.sin(seed) * 0.15 + 0.35);
    case 'fast-bloom':
      return lastAngle + (Math.random() > 0.5 ? 0.9 : -0.9) * (0.4 + spread);
    case 'crystal-facet': {
      const facet = Math.floor(seed % 4) * (Math.PI / 2);
      return facet + (Math.random() - 0.5) * 0.08;
    }
    case 'seed-arc':
      return lastAngle + (Math.random() - 0.5) * 0.6 + 0.25;
    case 'field-wave':
      return lastAngle + Math.sin(seed * 0.5) * 0.25;
    case 'network-mycelium':
    case 'particle-cloud':
      return lastAngle + (Math.random() - 0.5) * 0.9;
    case 'moss-crawl':
      return lastAngle + (Math.random() > 0.5 ? 0.15 : -0.15);
    case 'slow-vine':
    default:
      return lastAngle + (Math.random() - 0.5) * spread;
  }
}

/** Vertical direction bias for branch expansion. */
export function themeVerticalBias(theme: PresetTheme): number {
  switch (theme.growthBehavior) {
    case 'downward-root':
      return 1;
    case 'field-wave':
      return -0.15;
    case 'seed-arc':
      return -0.4;
    case 'fast-bloom':
      return -0.6;
    default:
      return -0.5;
  }
}

/** Motion sway amplitude per theme. */
export function themeSwayAmplitude(theme: PresetTheme, sound: SoundVizParams): number {
  const lfo = Math.sin(sound.lfoRate) * sound.lfoDepth;
  switch (theme.motionStyle) {
    case 'breathing':
      return lfo * 0.45 * theme.windStrength;
    case 'heavy-pulse':
      return lfo * 0.15;
    case 'burst-rhythm':
      return lfo * 0.35 * theme.rhythm;
    case 'glitch-symmetry':
      return (Math.random() > 0.92 ? lfo * 2 : lfo * 0.2) * theme.contrast;
    case 'swarm-drift':
      return lfo * 0.55;
    case 'crawl-static':
      return lfo * 0.08;
    case 'seed-pop':
      return lfo * 0.2;
    case 'horizon-wave':
      return Math.sin(sound.lfoRate * 2) * 0.3;
    default:
      return lfo * 0.3;
  }
}

/** Particle spawn count multiplier on note on. */
export function themeNoteParticleCount(theme: PresetTheme, velocity: number): number {
  const v = velocity / 127;
  switch (theme.motionStyle) {
    case 'seed-pop':
      return Math.round(1 + v * 4);
    case 'burst-rhythm':
      return Math.round(2 + v * 8);
    case 'heavy-pulse':
      return Math.round(1 + v * 3);
    case 'swarm-drift':
      return Math.round(3 + v * 10);
    case 'glitch-symmetry':
      return Math.round(2 + v * 6);
    case 'horizon-wave':
      return Math.round(1 + v * 5);
    default:
      return Math.round(2 + v * 5);
  }
}

/** Distortion roughness for decay artifacts. */
export function themeDistortionRoughness(theme: PresetTheme, distortion: number): number {
  if (theme.decayBehavior !== 'distort-decay' && theme.growthBehavior !== 'crystal-facet') {
    return distortion * 0.3;
  }
  return distortion * 0.9;
}

/** Delay trail length multiplier. */
export function themeDelayTrail(theme: PresetTheme, delayWet: number): number {
  switch (theme.motionStyle) {
    case 'horizon-wave':
    case 'swarm-drift':
      return delayWet * 10;
    case 'seed-pop':
      return delayWet * 4;
    default:
      return delayWet * 6;
  }
}

/** Reverb atmosphere particle rate. */
export function themeReverbAtmosphere(theme: PresetTheme, reverbWet: number): number {
  switch (theme.spatialLayout) {
    case 'horizon-wide':
    case 'wide-organic':
      return reverbWet * 12;
    case 'sparse-vertical':
      return reverbWet * 4;
    default:
      return reverbWet * 8;
  }
}
