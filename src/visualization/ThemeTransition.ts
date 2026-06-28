import { interpolateMusicalColor } from '../visuals/colorMusicTheory';
import type { CharacterCategory, PresetTheme } from './types';
import { resolvePresetTheme } from './PresetVisualThemes';

/** Discrete theme fields crossfade after this eased progress (0–1). */
const DISCRETE_FIELD_THRESHOLD = 0.88;

/** Smooth crossfade between preset visual themes. */
export class ThemeTransition {
  private current: PresetTheme;
  private target: PresetTheme;
  private progress = 1;
  private readonly durationSec: number;

  constructor(initial: PresetTheme, durationSec = 1.4) {
    this.current = initial;
    this.target = initial;
    this.durationSec = durationSec;
  }

  get activeTheme(): PresetTheme {
    return this.progress >= 1 ? this.target : this.blendedTheme();
  }

  get isTransitioning(): boolean {
    return this.progress < 1;
  }

  /** Raw linear progress 0–1 for overlay sync. */
  get transitionProgress(): number {
    return this.progress;
  }

  setTarget(presetId: string, presetName: string): boolean {
    const next = resolvePresetTheme(presetId, presetName);
    if (next.id === this.target.id && this.progress >= 1) {
      return false;
    }

    if (this.progress < 1) {
      this.current = this.blendedTheme();
    } else {
      this.current = this.target;
    }

    this.target = next;
    this.progress = 0;
    return true;
  }

  advance(dt: number): void {
    if (this.progress >= 1) {
      return;
    }
    this.progress = Math.min(1, this.progress + dt / this.durationSec);
  }

  shouldHardReset(): boolean {
    return this.progress < 0.35 && this.target.hardResetOnChange;
  }

  private blendedTheme(): PresetTheme {
    const t = easeInOut(this.progress);
    const a = this.current;
    const b = this.target;
    const blendPalette = (from: string[], to: string[]): string[] => {
      if (from.length === 0) {
        return to;
      }
      if (to.length === 0) {
        return from;
      }
      const len = Math.max(from.length, to.length);
      const out: string[] = [];
      for (let i = 0; i < len; i += 1) {
        out.push(interpolateMusicalColor(from[i] ?? from[0], to[i] ?? to[0], t).hex);
      }
      return out;
    };

    const useTargetDiscrete = t >= DISCRETE_FIELD_THRESHOLD;

    return {
      ...a,
      ...b,
      id: useTargetDiscrete ? b.id : a.id,
      name: useTargetDiscrete ? b.name : a.name,
      asciiState: useTargetDiscrete ? b.asciiState : a.asciiState,
      engineSpecies: useTargetDiscrete ? b.engineSpecies : a.engineSpecies,
      category: useTargetDiscrete ? b.category : a.category,
      visualMetadata: useTargetDiscrete ? b.visualMetadata : a.visualMetadata,
      species: useTargetDiscrete ? b.species : a.species,
      accentChars: useTargetDiscrete ? b.accentChars : blendCharacterSet(a.accentChars, b.accentChars, t),
      growthStyle: useTargetDiscrete ? b.growthStyle : a.growthStyle,
      particleBehavior: useTargetDiscrete ? b.particleBehavior : a.particleBehavior,
      bloomBehavior: useTargetDiscrete ? b.bloomBehavior : a.bloomBehavior,
      density: lerp(a.density, b.density, t),
      animationSpeed: lerp(a.animationSpeed, b.animationSpeed, t),
      windStrength: lerp(a.windStrength, b.windStrength, t),
      rhythm: lerp(a.rhythm, b.rhythm, t),
      contrast: lerp(a.contrast, b.contrast, t),
      characterSet: useTargetDiscrete ? b.characterSet : blendCharacterSet(a.characterSet, b.characterSet, t),
      palette: useTargetDiscrete ? b.palette : blendCategoryPalette(a.palette, b.palette, t),
      particleBias: useTargetDiscrete ? b.particleBias : a.particleBias,
      growthBehavior: useTargetDiscrete ? b.growthBehavior : a.growthBehavior,
      motionStyle: useTargetDiscrete ? b.motionStyle : a.motionStyle,
      spatialLayout: useTargetDiscrete ? b.spatialLayout : a.spatialLayout,
      decayBehavior: useTargetDiscrete ? b.decayBehavior : a.decayBehavior,
      colorHint: interpolateMusicalColor(a.colorHint, b.colorHint, t).hex,
      colorPalette: blendPalette(a.colorPalette, b.colorPalette),
    };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Gradually introduce target glyphs as transition progresses. */
function blendCharacterSet(from: string[], to: string[], t: number): string[] {
  if (from.length === 0) {
    return to;
  }
  if (to.length === 0) {
    return from;
  }
  const len = Math.max(from.length, to.length);
  const out: string[] = [];
  for (let i = 0; i < len; i += 1) {
    const threshold = 0.35 + (i / len) * 0.55;
    out.push(t >= threshold ? (to[i % to.length] ?? to[0]) : (from[i % from.length] ?? from[0]));
  }
  return out;
}

function blendCategoryPalette(from: CharacterCategory[], to: CharacterCategory[], t: number): CharacterCategory[] {
  if (from.length === 0) {
    return to;
  }
  if (to.length === 0) {
    return from;
  }
  const len = Math.max(from.length, to.length);
  const out: CharacterCategory[] = [];
  for (let i = 0; i < len; i += 1) {
    const threshold = 0.4 + (i / len) * 0.5;
    out.push(t >= threshold ? (to[i % to.length] ?? to[0]) : (from[i % from.length] ?? from[0]));
  }
  return out;
}
