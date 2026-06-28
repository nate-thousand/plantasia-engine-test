import type { PresetTheme } from './types';
import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import { FEEDBACK_GAIN } from './VisualFeedback';

export type MidiVisualEffectKind =
  | 'energyBurst'
  | 'mutationBurst'
  | 'bloomBurst'
  | 'toneBurst'
  | 'textureBurst'
  | 'growthBurst'
  | 'driftBurst'
  | 'moldBoost'
  | 'reverbBurst'
  | 'chorusBurst'
  | 'pitchBend'
  | 'knobTwist'
  | 'presetChange'
  | 'padHit'
  | 'play'
  | 'stop';

export type MidiVisualEffect = {
  kind: MidiVisualEffectKind;
  intensity: number;
  tick: number;
  controlTarget?: string;
};

/** Particle count for a MIDI effect scaled by preset theme. */
export function themeMidiParticleCount(
  theme: PresetTheme,
  kind: MidiVisualEffectKind,
  intensity: number,
): number {
  const norm = intensity / 127;
  const base = Math.round((2 + norm * 10 * (0.5 + theme.rhythm)) * FEEDBACK_GAIN);

  switch (kind) {
    case 'energyBurst':
    case 'mutationBurst':
      return theme.motionStyle === 'burst-rhythm'
        ? Math.round(base * 1.8)
        : theme.motionStyle === 'seed-pop'
          ? Math.round(base * 0.6)
          : base;
    case 'bloomBurst':
      return theme.growthBehavior === 'fast-bloom' ? Math.round(base * 2) : base;
    case 'reverbBurst':
      return theme.spatialLayout === 'horizon-wide' ? Math.round(base * 2.2) : Math.round(base * 1.4);
    case 'pitchBend':
      return Math.round((3 + norm * 8) * FEEDBACK_GAIN);
    case 'presetChange':
      return Math.round((6 + theme.density * 12) * FEEDBACK_GAIN);
    case 'knobTwist':
      return Math.round((1 + norm * 4 * theme.contrast) * FEEDBACK_GAIN);
    default:
      return base;
  }
}

/** Horizontal spread for pitch-bend driven particles. */
export function themePitchSpread(theme: PresetTheme, bend: number): number {
  const scale =
    theme.spatialLayout === 'horizon-wide' || theme.spatialLayout === 'wide-organic' ? 0.35 : 0.2;
  return bend * theme.windStrength * scale;
}

/** Accent char for a MIDI effect type under the current preset. */
export function themeMidiEffectChar(
  theme: PresetTheme,
  kind: MidiVisualEffectKind,
  seed: number,
): string {
  switch (kind) {
    case 'energyBurst':
    case 'bloomBurst':
    case 'padHit':
      return pickThemeAccent(theme, seed);
    case 'mutationBurst':
    case 'textureBurst':
      return theme.decayBehavior === 'distort-decay'
        ? pickThemeChar(theme, seed + 3)
        : pickThemeAccent(theme, seed + 1);
    case 'pitchBend':
      return theme.motionStyle === 'horizon-wave' ? '~' : pickThemeChar(theme, seed);
    case 'presetChange':
      return pickThemeAccent(theme, seed + 7);
    case 'reverbBurst':
      return pickThemeChar(theme, seed + 2);
    default:
      return pickThemeChar(theme, seed);
  }
}

/** Map pad action string to visual effect kind. */
export function padActionToEffectKind(action: string): MidiVisualEffectKind {
  const map: Record<string, MidiVisualEffectKind> = {
    play: 'play',
    stop: 'stop',
    energyBurst: 'energyBurst',
    mutationBurst: 'mutationBurst',
    bloomBurst: 'bloomBurst',
    toneBurst: 'toneBurst',
    textureBurst: 'textureBurst',
    growthBurst: 'growthBurst',
    driftBurst: 'driftBurst',
    moldBoost: 'moldBoost',
    reverbBurst: 'reverbBurst',
    chorusBurst: 'chorusBurst',
    presetPrevious: 'presetChange',
    presetNext: 'presetChange',
    presetRandom: 'presetChange',
  };
  return map[action] ?? 'padHit';
}

/** Boost amount for temporary slider bursts from Bank B pads. */
export function padActionBoostAmount(action: string, velocity: number): number {
  const v = velocity / 127;
  switch (action) {
    case 'bloomBurst':
    case 'reverbBurst':
      return Math.round(18 + v * 28);
    case 'toneBurst':
    case 'textureBurst':
      return Math.round(15 + v * 25);
    case 'growthBurst':
    case 'driftBurst':
      return Math.round(12 + v * 22);
    case 'moldBoost':
      return Math.round(10 + v * 20);
    case 'chorusBurst':
      return Math.round(14 + v * 24);
    default:
      return Math.round(15 + v * 25);
  }
}

export function padActionControlKey(
  action: string,
): 'bloom' | 'tone' | 'texture' | 'growthRate' | 'drift' | 'mold' | 'energy' | 'mutation' | null {
  switch (action) {
    case 'bloomBurst':
      return 'bloom';
    case 'toneBurst':
      return 'tone';
    case 'textureBurst':
      return 'texture';
    case 'growthBurst':
      return 'growthRate';
    case 'driftBurst':
      return 'drift';
    case 'moldBoost':
      return 'mold';
    case 'reverbBurst':
      return 'bloom';
    case 'chorusBurst':
      return 'texture';
    case 'energyBurst':
      return 'energy';
    case 'mutationBurst':
      return 'mutation';
    default:
      return null;
  }
}
