import type { PresetTheme } from './types';
import { resolvePresetTheme } from './PresetVisualThemes';

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

    return {
      ...b,
      id: b.id,
      name: b.name,
      density: lerp(a.density, b.density, t),
      animationSpeed: lerp(a.animationSpeed, b.animationSpeed, t),
      windStrength: lerp(a.windStrength, b.windStrength, t),
      rhythm: lerp(a.rhythm, b.rhythm, t),
      contrast: lerp(a.contrast, b.contrast, t),
      characterSet: t < 0.5 ? a.characterSet : b.characterSet,
      palette: t < 0.5 ? a.palette : b.palette,
      particleBias: t < 0.5 ? a.particleBias : b.particleBias,
      growthBehavior: t < 0.5 ? a.growthBehavior : b.growthBehavior,
      motionStyle: t < 0.5 ? a.motionStyle : b.motionStyle,
      spatialLayout: t < 0.5 ? a.spatialLayout : b.spatialLayout,
      decayBehavior: t < 0.5 ? a.decayBehavior : b.decayBehavior,
      colorHint: t < 0.5 ? a.colorHint : b.colorHint,
      colorPalette: t < 0.5 ? a.colorPalette : b.colorPalette,
    };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
