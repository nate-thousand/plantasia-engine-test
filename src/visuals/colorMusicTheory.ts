/**
 * Alexander Scriabin Prometheus color system — single source of truth for musical color.
 * All note, key, and Camelot color behavior must import from this module only.
 */

export type PitchClass =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';

export type KeyMode = 'major' | 'minor';

export type MusicalColor = {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
};

export type CamelotCode = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}${'A' | 'B'}`;

export type KeySignature = `${PitchClass} ${KeyMode}`;

/** Scriabin note → HEX (fully saturated for dark UI). */
export const NOTE_COLOR_MAP: Record<PitchClass, string> = {
  C: '#E84840', // Deep Red
  'C#': '#9860E0', // Violet
  D: '#E8A828', // Golden Yellow
  'D#': '#98A0B0', // Steel Gray
  E: '#38B8F0', // Sky Blue
  F: '#E84058', // Crimson Red
  'F#': '#4898FF', // Bright Blue
  G: '#F07828', // Orange Red
  'G#': '#B848E8', // Purple
  A: '#38D058', // Green
  'A#': '#F06888', // Rose
  B: '#4078F0', // Deep Blue
};

const PITCH_CLASSES: PitchClass[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const MAJOR_INTERVALS = [0, 4, 7];
const MINOR_INTERVALS = [0, 3, 7];

/** Major key → Scriabin tonic color (same hue as pitch class). */
export const KEY_COLOR_MAP: Record<KeySignature, string> = buildKeyColorMap(false);

/** Minor key → softened tonic (same hue, lower saturation/lightness). */
export const MINOR_KEY_COLOR_MAP: Record<KeySignature, string> = buildKeyColorMap(true);

/** All 24 Camelot wheel positions → musical key metadata + color. */
export const CAMELOT_COLOR_MAP: Record<
  CamelotCode,
  { key: KeySignature; tonic: PitchClass; hex: string }
> = {
  '1A': { key: 'G# minor', tonic: 'G#', hex: MINOR_KEY_COLOR_MAP['G# minor'] },
  '1B': { key: 'B major', tonic: 'B', hex: KEY_COLOR_MAP['B major'] },
  '2A': { key: 'D# minor', tonic: 'D#', hex: MINOR_KEY_COLOR_MAP['D# minor'] },
  '2B': { key: 'F# major', tonic: 'F#', hex: KEY_COLOR_MAP['F# major'] },
  '3A': { key: 'A# minor', tonic: 'A#', hex: MINOR_KEY_COLOR_MAP['A# minor'] },
  '3B': { key: 'C# major', tonic: 'C#', hex: KEY_COLOR_MAP['C# major'] },
  '4A': { key: 'F minor', tonic: 'F', hex: MINOR_KEY_COLOR_MAP['F minor'] },
  '4B': { key: 'G# major', tonic: 'G#', hex: KEY_COLOR_MAP['G# major'] },
  '5A': { key: 'C minor', tonic: 'C', hex: MINOR_KEY_COLOR_MAP['C minor'] },
  '5B': { key: 'D# major', tonic: 'D#', hex: KEY_COLOR_MAP['D# major'] },
  '6A': { key: 'G minor', tonic: 'G', hex: MINOR_KEY_COLOR_MAP['G minor'] },
  '6B': { key: 'A# major', tonic: 'A#', hex: KEY_COLOR_MAP['A# major'] },
  '7A': { key: 'D minor', tonic: 'D', hex: MINOR_KEY_COLOR_MAP['D minor'] },
  '7B': { key: 'F major', tonic: 'F', hex: KEY_COLOR_MAP['F major'] },
  '8A': { key: 'A minor', tonic: 'A', hex: MINOR_KEY_COLOR_MAP['A minor'] },
  '8B': { key: 'C major', tonic: 'C', hex: KEY_COLOR_MAP['C major'] },
  '9A': { key: 'E minor', tonic: 'E', hex: MINOR_KEY_COLOR_MAP['E minor'] },
  '9B': { key: 'G major', tonic: 'G', hex: KEY_COLOR_MAP['G major'] },
  '10A': { key: 'B minor', tonic: 'B', hex: MINOR_KEY_COLOR_MAP['B minor'] },
  '10B': { key: 'D major', tonic: 'D', hex: KEY_COLOR_MAP['D major'] },
  '11A': { key: 'F# minor', tonic: 'F#', hex: MINOR_KEY_COLOR_MAP['F# minor'] },
  '11B': { key: 'A major', tonic: 'A', hex: KEY_COLOR_MAP['A major'] },
  '12A': { key: 'C# minor', tonic: 'C#', hex: MINOR_KEY_COLOR_MAP['C# minor'] },
  '12B': { key: 'E major', tonic: 'E', hex: KEY_COLOR_MAP['E major'] },
};

export type TonalCenterResult = {
  pitchClass: PitchClass;
  mode: KeyMode | 'chromatic';
  keyName: string;
  camelot: CamelotCode | null;
  chordName: string | null;
  confidence: number;
  targetHex: string;
};

/** Resolve Scriabin color from MIDI note number (uses pitch class only). */
export function getColorForNote(midi: number, isMinor = false): MusicalColor {
  const pitchClass = midiToPitchClass(midi);
  const hex = isMinor ? softenHex(NOTE_COLOR_MAP[pitchClass]) : NOTE_COLOR_MAP[pitchClass];
  return toMusicalColor(hex);
}

/** Resolve color from pitch class name. */
export function getColorForPitchClass(pitchClass: PitchClass, isMinor = false): MusicalColor {
  const hex = isMinor ? softenHex(NOTE_COLOR_MAP[pitchClass]) : NOTE_COLOR_MAP[pitchClass];
  return toMusicalColor(hex);
}

/** Resolve color for a major or minor key signature. */
export function getColorForKey(key: KeySignature): MusicalColor {
  const hex = key.endsWith('minor')
    ? MINOR_KEY_COLOR_MAP[key]
    : KEY_COLOR_MAP[key];
  return toMusicalColor(hex);
}

/** Resolve color from Camelot wheel code (e.g. 8B, 5A). */
export function getColorForCamelotKey(camelot: CamelotCode): MusicalColor {
  return toMusicalColor(CAMELOT_COLOR_MAP[camelot].hex);
}

/** Smooth crossfade between two musical colors (0 = a, 1 = b). */
export function interpolateMusicalColor(a: string, b: string, t: number): MusicalColor {
  const clamped = Math.max(0, Math.min(1, t));
  const ca = toMusicalColor(a);
  const cb = toMusicalColor(b);
  const r = Math.round(ca.rgb.r + (cb.rgb.r - ca.rgb.r) * clamped);
  const g = Math.round(ca.rgb.g + (cb.rgb.g - ca.rgb.g) * clamped);
  const bVal = Math.round(ca.rgb.b + (cb.rgb.b - ca.rgb.b) * clamped);
  return toMusicalColor(rgbToHex(r, g, bVal));
}

/** Infer tonal center from active MIDI notes (velocity-weighted). */
export function detectTonalCenter(
  midis: readonly number[],
  velocities: readonly number[] = [],
): TonalCenterResult {
  if (midis.length === 0) {
    return {
      pitchClass: 'C',
      mode: 'chromatic',
      keyName: '—',
      camelot: null,
      chordName: null,
      confidence: 0,
      targetHex: NOTE_COLOR_MAP.C,
    };
  }

  if (midis.length === 1) {
    const pc = midiToPitchClass(midis[0]);
    return buildTonalResult(pc, 'major', 0.55, `${pc}`);
  }

  const pitchSet = new Set(midis.map((m) => midiToPitchClass(m)));
  const pitchClasses = [...pitchSet];

  let best: { root: PitchClass; mode: KeyMode; score: number; chord: string } | null = null;

  for (const root of PITCH_CLASSES) {
    for (const mode of ['major', 'minor'] as const) {
      const intervals = mode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
      const chordPcs = intervals.map((i) => addSemitones(root, i));
      const matchCount = chordPcs.filter((pc) => pitchSet.has(pc)).length;
      if (matchCount >= 3) {
        const score =
          matchCount * 10 +
          velocityWeightForRoot(midis, velocities, root) +
          (pitchClasses[0] === root ? 2 : 0);
        const chord = `${root}${mode === 'minor' ? 'm' : ''}`;
        if (!best || score > best.score) {
          best = { root, mode, score, chord };
        }
      }
    }
  }

  if (best) {
    const confidence = Math.min(1, best.score / 40);
    return buildTonalResult(best.root, best.mode, confidence, best.chord);
  }

  const bassMidi = midis.reduce((a, b) => (a < b ? a : b));
  const bassPc = midiToPitchClass(bassMidi);
  return buildTonalResult(bassPc, 'major', 0.35, pitchClasses.join('-'));
}

export function midiToPitchClass(midi: number): PitchClass {
  return PITCH_CLASSES[((midi % 12) + 12) % 12];
}

export function keyToCamelot(key: KeySignature): CamelotCode | null {
  for (const [code, entry] of Object.entries(CAMELOT_COLOR_MAP) as [
    CamelotCode,
    (typeof CAMELOT_COLOR_MAP)[CamelotCode],
  ][]) {
    if (entry.key === key) {
      return code;
    }
  }
  return null;
}

/** Boost saturation/lightness so colors read vivid on the dark canvas. */
export function saturateHex(hex: string): string {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]);
  const boostedS = s < 18 ? Math.min(40, s + 18) : Math.min(100, Math.max(78, s * 1.12));
  const boostedL = Math.min(72, Math.max(48, l * 1.08));
  return hslToHex(h, boostedS, boostedL);
}

export function toMusicalColor(hex: string): MusicalColor {
  const saturated = saturateHex(hex);
  const rgb = hexToRgb(saturated);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { hex: saturated, rgb, hsl };
}

export function blendWithAmbient(musicalHex: string, ambientHex: string, musicalWeight: number): string {
  return interpolateMusicalColor(ambientHex, musicalHex, musicalWeight).hex;
}

function buildTonalResult(
  root: PitchClass,
  mode: KeyMode,
  confidence: number,
  chordName: string,
): TonalCenterResult {
  const keyName = `${root} ${mode === 'minor' ? 'minor' : 'major'}` as KeySignature;
  const camelot = keyToCamelot(keyName);
  const targetHex =
    mode === 'minor' ? MINOR_KEY_COLOR_MAP[keyName] : KEY_COLOR_MAP[keyName];
  return {
    pitchClass: root,
    mode,
    keyName,
    camelot,
    chordName,
    confidence,
    targetHex,
  };
}

function buildKeyColorMap(minor: boolean): Record<KeySignature, string> {
  const map = {} as Record<KeySignature, string>;
  for (const pc of PITCH_CLASSES) {
    const majorKey = `${pc} major` as KeySignature;
    const minorKey = `${pc} minor` as KeySignature;
    const base = NOTE_COLOR_MAP[pc];
    map[majorKey] = base;
    map[minorKey] = minor ? softenHex(base) : base;
  }
  return map;
}

/** Minor keys: same hue, slightly softer than major but still vivid. */
function softenHex(hex: string): string {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]);
  return hslToHex(h, s * 0.9, l * 0.94);
}

function velocityWeightForRoot(
  midis: readonly number[],
  velocities: readonly number[],
  root: PitchClass,
): number {
  let sum = 0;
  for (let i = 0; i < midis.length; i += 1) {
    if (midiToPitchClass(midis[i]) === root) {
      sum += (velocities[i] ?? 100) / 127;
    }
  }
  return sum;
}

function addSemitones(root: PitchClass, semitones: number): PitchClass {
  const idx = PITCH_CLASSES.indexOf(root);
  return PITCH_CLASSES[(idx + semitones) % 12];
}

function normalizeHex(hex: string): string {
  const h = hex.replace('#', '');
  return `#${h.length === 3 ? h.split('').map((c) => c + c).join('') : h}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  h /= 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return rgbToHex(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}
