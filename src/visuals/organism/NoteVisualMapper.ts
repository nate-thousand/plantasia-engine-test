import type { ActiveNoteState } from '../../stores/engineStore';
import { GRAMMAR_SYMBOLS, type GrammarSymbol } from './GrammarSymbols';
import {
  GRID_CENTER_X,
  GRID_CENTER_Y,
} from './gridConstants';
import {
  noteAuraGlyphs,
  signalPathFromCenter,
  velocityRippleGlyphs,
  type GlyphPoint,
} from './VisualGlyphs';

export { GRID_CENTER_X, GRID_CENTER_Y } from './gridConstants';

/** Pitch-class → organism form (docs/brand/ASCII_GRAMMAR.md). */
export type PitchForm = {
  role: string;
  offsetX: number;
  offsetY: number;
  nodeSymbol: GrammarSymbol;
  edgeGlyphs: GlyphPoint[];
};

const PITCH_FORMS: PitchForm[] = [
  {
    role: 'center-root',
    offsetX: 0,
    offsetY: 0,
    nodeSymbol: GRAMMAR_SYMBOLS.activation,
    edgeGlyphs: [
      { x: 0, y: 2, symbol: GRAMMAR_SYMBOLS.seed },
      { x: 0, y: 3, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: -2, y: 1, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 2, y: 1, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 0, y: -2, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: -3, symbol: GRAMMAR_SYMBOLS.seed },
    ],
  },
  {
    role: 'mutation',
    offsetX: -4,
    offsetY: -4,
    nodeSymbol: GRAMMAR_SYMBOLS.mutation,
    edgeGlyphs: [
      { x: -3, y: -2, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: -2, y: -3, symbol: GRAMMAR_SYMBOLS.mutation },
      { x: -1, y: -4, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: -4, y: -1, symbol: GRAMMAR_SYMBOLS.densityMedium },
      { x: -5, y: -3, symbol: GRAMMAR_SYMBOLS.densityLow },
    ],
  },
  {
    role: 'upward-growth',
    offsetX: 0,
    offsetY: -7,
    nodeSymbol: GRAMMAR_SYMBOLS.active,
    edgeGlyphs: [
      { x: 0, y: -1, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: -2, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: -3, symbol: GRAMMAR_SYMBOLS.seed },
      { x: 0, y: -4, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: -5, symbol: GRAMMAR_SYMBOLS.seed },
      { x: -1, y: -4, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 1, y: -4, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    ],
  },
  {
    role: 'curved-growth',
    offsetX: 5,
    offsetY: -5,
    nodeSymbol: GRAMMAR_SYMBOLS.seed,
    edgeGlyphs: [
      { x: 2, y: -2, symbol: GRAMMAR_SYMBOLS.curveNE },
      { x: 3, y: -3, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 4, y: -4, symbol: GRAMMAR_SYMBOLS.curveNE },
      { x: 5, y: -5, symbol: GRAMMAR_SYMBOLS.active },
      { x: 3, y: -4, symbol: GRAMMAR_SYMBOLS.softParticle },
    ],
  },
  {
    role: 'branch',
    offsetX: -8,
    offsetY: 0,
    nodeSymbol: GRAMMAR_SYMBOLS.active,
    edgeGlyphs: [
      { x: -2, y: 0, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: -4, y: 0, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: -6, y: 0, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: -8, y: 0, symbol: GRAMMAR_SYMBOLS.active },
      { x: -7, y: -1, symbol: GRAMMAR_SYMBOLS.seed },
      { x: -7, y: 1, symbol: GRAMMAR_SYMBOLS.seed },
      { x: -5, y: -2, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: -5, y: 2, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    ],
  },
  {
    role: 'root-spread',
    offsetX: 0,
    offsetY: 7,
    nodeSymbol: GRAMMAR_SYMBOLS.active,
    edgeGlyphs: [
      { x: 0, y: 2, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 0, y: 4, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: 6, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 0, y: 7, symbol: GRAMMAR_SYMBOLS.active },
      { x: -3, y: 5, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 3, y: 5, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: -2, y: 7, symbol: GRAMMAR_SYMBOLS.seed },
      { x: 2, y: 7, symbol: GRAMMAR_SYMBOLS.seed },
    ],
  },
  {
    role: 'tension-cross',
    offsetX: 8,
    offsetY: 0,
    nodeSymbol: GRAMMAR_SYMBOLS.mutation,
    edgeGlyphs: [
      { x: 4, y: -2, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 6, y: 0, symbol: GRAMMAR_SYMBOLS.mutation },
      { x: 4, y: 2, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 8, y: -2, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 8, y: 2, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 7, y: -1, symbol: GRAMMAR_SYMBOLS.densityMedium },
      { x: 7, y: 1, symbol: GRAMMAR_SYMBOLS.densityMedium },
    ],
  },
  {
    role: 'harmony-connection',
    offsetX: -7,
    offsetY: -4,
    nodeSymbol: GRAMMAR_SYMBOLS.active,
    edgeGlyphs: [
      { x: -3, y: -4, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: -1, y: -4, symbol: GRAMMAR_SYMBOLS.intersection },
      { x: 1, y: -4, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: 3, y: -4, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: -5, y: -3, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 5, y: -3, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: -7, y: -4, symbol: GRAMMAR_SYMBOLS.active },
      { x: 7, y: -4, symbol: GRAMMAR_SYMBOLS.active },
    ],
  },
  {
    role: 'particle-shimmer',
    offsetX: 6,
    offsetY: 5,
    nodeSymbol: GRAMMAR_SYMBOLS.softParticle,
    edgeGlyphs: [
      { x: 3, y: 2, symbol: GRAMMAR_SYMBOLS.softParticle },
      { x: 4, y: 3, symbol: GRAMMAR_SYMBOLS.softParticle },
      { x: 5, y: 4, symbol: GRAMMAR_SYMBOLS.seed },
      { x: 6, y: 5, symbol: GRAMMAR_SYMBOLS.seed },
      { x: 5, y: 6, symbol: GRAMMAR_SYMBOLS.densityLow },
      { x: 7, y: 4, symbol: GRAMMAR_SYMBOLS.densityLow },
      { x: 4, y: 5, symbol: GRAMMAR_SYMBOLS.softParticle },
      { x: 6, y: 3, symbol: GRAMMAR_SYMBOLS.softParticle },
    ],
  },
  {
    role: 'bloom',
    offsetX: 0,
    offsetY: -10,
    nodeSymbol: GRAMMAR_SYMBOLS.active,
    edgeGlyphs: [
      { x: -3, y: -10, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 0, y: -10, symbol: GRAMMAR_SYMBOLS.active },
      { x: 3, y: -10, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: 0, y: -11, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: -12, symbol: GRAMMAR_SYMBOLS.seed },
      { x: 0, y: -8, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: -2, y: -9, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 2, y: -9, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      { x: -4, y: -10, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: 4, y: -10, symbol: GRAMMAR_SYMBOLS.horizontal },
    ],
  },
  {
    role: 'asymmetry',
    offsetX: 7,
    offsetY: -7,
    nodeSymbol: GRAMMAR_SYMBOLS.seed,
    edgeGlyphs: [
      { x: 4, y: -4, symbol: GRAMMAR_SYMBOLS.curveNE },
      { x: 5, y: -5, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 6, y: -6, symbol: GRAMMAR_SYMBOLS.curveNE },
      { x: 7, y: -7, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: 8, y: -6, symbol: GRAMMAR_SYMBOLS.softParticle },
      { x: 6, y: -8, symbol: GRAMMAR_SYMBOLS.densityLow },
    ],
  },
  {
    role: 'resolution',
    offsetX: 0,
    offsetY: 4,
    nodeSymbol: GRAMMAR_SYMBOLS.seed,
    edgeGlyphs: [
      { x: -4, y: 2, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: -2, y: 2, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: 0, y: 2, symbol: GRAMMAR_SYMBOLS.intersection },
      { x: 2, y: 2, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: 4, y: 2, symbol: GRAMMAR_SYMBOLS.horizontal },
      { x: 0, y: 3, symbol: GRAMMAR_SYMBOLS.vertical },
      { x: 0, y: 4, symbol: GRAMMAR_SYMBOLS.seed },
      { x: -1, y: 3, symbol: GRAMMAR_SYMBOLS.softParticle },
      { x: 1, y: 3, symbol: GRAMMAR_SYMBOLS.softParticle },
    ],
  },
];

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function octaveNumber(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Octave placement: lower → rootward (+y), higher → bloomward (−y). */
export function octaveYOffset(midi: number): number {
  const octave = octaveNumber(midi);
  if (octave <= 2) {
    return 4;
  }
  if (octave >= 6) {
    return -4;
  }
  if (octave <= 3) {
    return 2;
  }
  if (octave >= 5) {
    return -2;
  }
  return 0;
}

/** Velocity → node glyph + density texture. */
export function velocityToGlyphs(velocity: number): {
  node: GrammarSymbol;
  density: GrammarSymbol;
} {
  if (velocity >= 85) {
    return { node: GRAMMAR_SYMBOLS.active, density: GRAMMAR_SYMBOLS.densityHigh };
  }
  if (velocity >= 43) {
    return { node: GRAMMAR_SYMBOLS.seed, density: GRAMMAR_SYMBOLS.densityMedium };
  }
  return { node: GRAMMAR_SYMBOLS.softParticle, density: GRAMMAR_SYMBOLS.densityLow };
}

export function pitchFormForMidi(midi: number): PitchForm {
  return PITCH_FORMS[pitchClass(midi)] ?? PITCH_FORMS[0];
}

export type NoteVisualPlacement = {
  noteId: string;
  midi: number;
  label: string;
  x: number;
  y: number;
  nodeSymbol: GrammarSymbol;
  densitySymbol: GrammarSymbol;
  edgeGlyphs: GlyphPoint[];
  role: string;
};

function translateGlyphs(glyphs: GlyphPoint[], dx: number, dy: number): GlyphPoint[] {
  return glyphs.map((glyph) => ({ x: glyph.x + dx, y: glyph.y + dy, symbol: glyph.symbol }));
}

/** Map an active note to grid placement and grammar glyphs. */
export function mapNoteToVisual(note: ActiveNoteState): NoteVisualPlacement {
  const form = pitchFormForMidi(note.midi);
  const yOctave = octaveYOffset(note.midi);
  const { node, density } = velocityToGlyphs(note.velocity);

  const x = GRID_CENTER_X + form.offsetX;
  const y = GRID_CENTER_Y + form.offsetY + yOctave;

  const formGlyphs = translateGlyphs(form.edgeGlyphs, x - form.offsetX, y - form.offsetY - yOctave);

  const edgeGlyphs = [
    ...formGlyphs,
    ...signalPathFromCenter(x, y, 14),
    ...noteAuraGlyphs(x, y, note.velocity),
    ...velocityRippleGlyphs(x, y, note.velocity),
  ];

  return {
    noteId: `note-${note.midi}`,
    midi: note.midi,
    label: note.label,
    x,
    y,
    nodeSymbol: note.velocity >= 70 ? form.nodeSymbol : node,
    densitySymbol: density,
    edgeGlyphs,
    role: form.role,
  };
}

export function mapNotesToVisuals(notes: ActiveNoteState[]): NoteVisualPlacement[] {
  return notes.map(mapNoteToVisual);
}

/** Keyboard key → expected pitch role (for docs / testing). */
export const KEYBOARD_VISUAL_MAP: Record<string, { midi: number; role: string }> = {
  a: { midi: 60, role: 'center-root' },
  w: { midi: 61, role: 'mutation' },
  s: { midi: 62, role: 'upward-growth' },
  e: { midi: 63, role: 'curved-growth' },
  d: { midi: 64, role: 'branch' },
  f: { midi: 65, role: 'root-spread' },
  t: { midi: 66, role: 'tension-cross' },
  g: { midi: 67, role: 'harmony-connection' },
  y: { midi: 68, role: 'particle-shimmer' },
  h: { midi: 69, role: 'bloom' },
  u: { midi: 70, role: 'asymmetry' },
  j: { midi: 71, role: 'resolution' },
  k: { midi: 72, role: 'bloom' },
};