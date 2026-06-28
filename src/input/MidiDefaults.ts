/** Targets for MIDI CC, learn, and pad routing. */
export type MidiControlTarget =
  | 'volume'
  | 'tone'
  | 'texture'
  | 'bloom'
  | 'growthRate'
  | 'drift'
  | 'mutation'
  | 'energy'
  | 'presetPrevious'
  | 'presetNext'
  | 'presetRandom'
  | 'play'
  | 'stop'
  | 'hold';

export type MidiPadAction =
  | 'play'
  | 'stop'
  | 'presetPrevious'
  | 'presetNext'
  | 'presetRandom'
  | 'hold'
  | 'energyBurst'
  | 'mutationBurst'
  | 'bloomBurst'
  | 'toneBurst'
  | 'textureBurst'
  | 'growthBurst'
  | 'driftBurst'
  | 'volumeBoost'
  | 'reverbBurst'
  | 'chorusBurst';

/** Slider / action targets exposed in the learn UI. */
export const MIDI_LEARN_TARGETS: MidiControlTarget[] = [
  'volume',
  'tone',
  'texture',
  'bloom',
  'growthRate',
  'drift',
  'mutation',
  'energy',
  'presetPrevious',
  'presetNext',
  'presetRandom',
  'play',
  'stop',
  'hold',
];

export const MIDI_LEARN_TARGET_LABELS: Record<MidiControlTarget, string> = {
  volume: 'Volume',
  tone: 'Tone',
  texture: 'Texture',
  bloom: 'Bloom',
  growthRate: 'Growth',
  drift: 'Drift',
  mutation: 'Mutation',
  energy: 'Energy',
  presetPrevious: 'Prev Preset',
  presetNext: 'Next Preset',
  presetRandom: 'Random Preset',
  play: 'Play',
  stop: 'Stop',
  hold: 'Hold',
};

/** Standard MIDI CC → Plantasia control (GM / common synth layout). */
export const STANDARD_CC_MAP: Record<number, MidiControlTarget> = {
  7: 'volume',
  74: 'tone',
  71: 'texture',
  73: 'bloom',
  72: 'growthRate',
  1: 'drift',
  2: 'mutation',
  11: 'energy',
};

/**
 * Akai MPK Mini knob fallback — CC 1–8 map to knobs 1–8 when device name contains "MPK".
 * Learned mappings always override this profile.
 */
export const MPK_MINI_KNOB_CC_MAP: Record<number, MidiControlTarget> = {
  1: 'volume',
  2: 'tone',
  3: 'texture',
  4: 'bloom',
  5: 'growthRate',
  6: 'drift',
  7: 'mutation',
  8: 'energy',
};

/** Default pad note assignments (Akai MPK Mini bank A — C3–G3). */
export const DEFAULT_PAD_NOTE_ACTIONS: Record<number, MidiPadAction> = {
  48: 'play',
  49: 'stop',
  50: 'presetPrevious',
  51: 'presetNext',
  52: 'presetRandom',
  53: 'hold',
  54: 'energyBurst',
  55: 'mutationBurst',
};

/** CC values sometimes used for MPK Mini pad banks in CC mode. */
export const DEFAULT_PAD_CC_ACTIONS: Record<number, MidiPadAction> = {
  20: 'play',
  21: 'stop',
  22: 'presetPrevious',
  23: 'presetNext',
  24: 'presetRandom',
  25: 'hold',
  26: 'energyBurst',
  27: 'mutationBurst',
};

export function isSliderTarget(target: MidiControlTarget): target is keyof typeof SLIDER_TARGET_KEYS {
  return target in SLIDER_TARGET_KEYS;
}

export const SLIDER_TARGET_KEYS = {
  volume: true,
  tone: true,
  texture: true,
  bloom: true,
  growthRate: true,
  drift: true,
  mutation: true,
  energy: true,
} as const;

export type SliderControlTarget = keyof typeof SLIDER_TARGET_KEYS;

export function isActionTarget(
  target: MidiControlTarget,
): target is Exclude<MidiControlTarget, SliderControlTarget> {
  return !isSliderTarget(target);
}

/** Convert MIDI 0–127 to slider 0–100. */
export function midiValueToSlider(midiValue: number): number {
  return Math.round((Math.max(0, Math.min(127, midiValue)) / 127) * 100);
}

/** Convert slider 0–100 to MIDI 0–127. */
export function sliderToMidiValue(sliderValue: number): number {
  return Math.round((Math.max(0, Math.min(100, sliderValue)) / 100) * 127);
}

export function isMpkMiniDevice(deviceName: string | null | undefined): boolean {
  return (deviceName ?? '').toLowerCase().includes('mpk');
}
