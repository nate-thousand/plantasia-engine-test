import type { PlantasiaPreset } from 'plantasia-sound-engine';
import {
  type PentatonicScaleType,
  buildScaleMidiNotes,
  freqToRootMidi,
  intervalsFromPresetScale,
} from './scales';

/** Harmonic rules for generative ambient — one profile per active preset. */
export type AmbientHarmonicProfile = {
  presetId: string;
  rootMidi: number;
  scaleType: PentatonicScaleType;
  presetIntervals: number[] | null;
  droneMidi: number;
  chordPalettes: number[][];
  voiceCount: number;
  octaveMin: number;
  octaveMax: number;
  maxLeapDegrees: number;
  scaleNotes: number[];
  weights: {
    stepwise: number;
    repeat: number;
    leap: number;
    pause: number;
    registerShift: number;
    textureBloom: number;
  };
};

const DEFAULT_WEIGHTS = {
  stepwise: 0.52,
  repeat: 0.28,
  leap: 0.12,
  pause: 0.04,
  registerShift: 0.03,
  textureBloom: 0.06,
} as const;

const CATEGORY_SCALE: Record<string, PentatonicScaleType> = {
  ambient: 'minor',
  textures: 'suspended',
  signature: 'major',
  flora: 'major',
  soundWorlds: 'major',
};

const ASCII_SCALE: Record<string, PentatonicScaleType> = {
  mycelium: 'minor',
  mutation: 'suspended',
  'night-bloom': 'japanese',
  crystal: 'japanese',
  desert: 'suspended',
  winter: 'minor',
};

function resolveScaleType(preset: PlantasiaPreset): PentatonicScaleType {
  if (preset.scale?.length) {
    return 'preset';
  }
  const fromAscii = preset.asciiState ? ASCII_SCALE[preset.asciiState] : undefined;
  if (fromAscii) {
    return fromAscii;
  }
  const category = preset.category ?? '';
  for (const [key, scale] of Object.entries(CATEGORY_SCALE)) {
    if (category.includes(key)) {
      return scale;
    }
  }
  return 'major';
}

function resolveRootMidi(preset: PlantasiaPreset): number {
  if (preset.scale?.length) {
    return freqToRootMidi(preset.scale[0] ?? 261.63);
  }

  if (preset.plantasonic != null) {
    return 48; // C3
  }
  if (preset.botanical != null) {
    return 52; // E3
  }
  if (preset.category?.includes('ambient')) {
    return 45; // A2
  }
  if (preset.asciiState === 'mutation') {
    return 50; // D3
  }

  return 48; // C3 default
}

function buildChordPalettes(scaleNoteCount: number): number[][] {
  const d = (i: number) => i % scaleNoteCount;
  return [
    [d(0), d(2), d(4)],
    [d(0), d(1), d(3)],
    [d(2), d(4), d(1)],
    [d(0), d(3)],
    [d(1), d(4)],
    [d(0), d(2)],
  ];
}

/** Build harmonic profile from the active preset. */
export function resolveHarmonicProfile(preset: PlantasiaPreset): AmbientHarmonicProfile {
  const scaleType = resolveScaleType(preset);
  const rootMidi = resolveRootMidi(preset);
  const presetIntervals =
    scaleType === 'preset' && preset.scale?.length
      ? intervalsFromPresetScale(preset.scale)
      : null;

  const octaveMin = preset.category?.includes('ambient') ? 2 : 3;
  const octaveMax = preset.plantasonic != null ? 5 : 4;
  const scaleNotes = buildScaleMidiNotes(
    rootMidi,
    scaleType,
    octaveMin,
    octaveMax,
    presetIntervals ?? undefined,
  );

  const droneMidi = scaleNotes.find((n) => n >= rootMidi - 2 && n <= rootMidi + 2) ?? rootMidi;

  const weights = resolvePresetWeights(preset);

  return {
    presetId: preset.id,
    rootMidi,
    scaleType,
    presetIntervals,
    droneMidi,
    chordPalettes: buildChordPalettes(presetIntervals?.length ?? 5),
    voiceCount: preset.plantasonic != null ? 6 : preset.botanical != null ? 5 : 4,
    octaveMin,
    octaveMax,
    maxLeapDegrees: 2,
    scaleNotes,
    weights,
  };
}

function resolvePresetWeights(preset: PlantasiaPreset): AmbientHarmonicProfile['weights'] {
  if (preset.plantasonic != null) {
    return {
      stepwise: 0.48,
      repeat: 0.22,
      leap: 0.1,
      pause: 0.12,
      registerShift: 0.05,
      textureBloom: 0.14,
    };
  }
  if (preset.botanical != null) {
    return {
      stepwise: 0.55,
      repeat: 0.25,
      leap: 0.08,
      pause: 0.05,
      registerShift: 0.04,
      textureBloom: 0.08,
    };
  }
  return { ...DEFAULT_WEIGHTS };
}
