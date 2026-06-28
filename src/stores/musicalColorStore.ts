import type { ActiveNoteState } from './engineStore';
import {
  blendWithAmbient,
  detectTonalCenter,
  interpolateMusicalColor,
  toMusicalColor,
  type MusicalColor,
  type TonalCenterResult,
} from '../visuals/colorMusicTheory';

export type MusicalColorFrameState = {
  display: MusicalColor;
  target: MusicalColor;
  ambient: MusicalColor;
  tonal: TonalCenterResult;
  /** 0–1 blend toward musical color vs preset ambient. */
  musicalWeight: number;
  /** Brief bloom during modulation (0–1). */
  bloom: number;
  currentNote: string | null;
};

const DEFAULT_AMBIENT = '#7FD88F';
const INTERPOLATION_MS = 2800;
const SILENCE_FADE_MS = 4200;
const BLOOM_DECAY_MS = 900;

let state: MusicalColorFrameState = createInitialState(DEFAULT_AMBIENT);
const listeners = new Set<() => void>();

function createInitialState(ambientHex: string): MusicalColorFrameState {
  const ambient = toMusicalColor(ambientHex);
  return {
    display: ambient,
    target: ambient,
    ambient,
    tonal: detectTonalCenter([]),
    musicalWeight: 0,
    bloom: 0,
    currentNote: null,
  };
}

export function getMusicalColorStore(): MusicalColorFrameState {
  return state;
}

export function subscribeMusicalColorStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function resetMusicalColorStore(ambientHex = DEFAULT_AMBIENT): void {
  state = createInitialState(ambientHex);
  emit();
}

export type MusicalColorTickInput = {
  activeNotes: readonly ActiveNoteState[];
  presetAmbientHex: string;
  deltaMs: number;
};

/** Per-frame musical color advance — call from the visualization loop. */
export function tickMusicalColor(input: MusicalColorTickInput): MusicalColorFrameState {
  const ambient = toMusicalColor(input.presetAmbientHex || DEFAULT_AMBIENT);
  const midis = input.activeNotes.map((n) => n.midi);
  const velocities = input.activeNotes.map((n) => n.velocity);
  const tonal = detectTonalCenter(midis, velocities);

  const hasNotes = midis.length > 0;
  const targetHex = hasNotes
    ? tonal.targetHex
    : blendWithAmbient(state.display.hex, ambient.hex, 0.15);

  const target = toMusicalColor(targetHex);
  const targetWeight = hasNotes
    ? Math.min(1, 0.45 + tonal.confidence * 0.55)
    : Math.max(0, state.musicalWeight - input.deltaMs / SILENCE_FADE_MS);

  const targetChanged = target.hex !== state.target.hex && hasNotes;
  const bloom = targetChanged
    ? Math.min(1, state.bloom + 0.55)
    : Math.max(0, state.bloom - input.deltaMs / BLOOM_DECAY_MS);

  const t = Math.min(1, input.deltaMs / INTERPOLATION_MS);
  const displayHex = interpolateMusicalColor(state.display.hex, target.hex, t * (0.35 + targetWeight * 0.65)).hex;
  const display = toMusicalColor(displayHex);
  const musicalWeight = state.musicalWeight + (targetWeight - state.musicalWeight) * t;

  const currentNote =
    midis.length === 1
      ? input.activeNotes[0]?.label ?? null
      : midis.length > 1
        ? tonal.chordName
        : null;

  state = {
    display,
    target,
    ambient,
    tonal,
    musicalWeight,
    bloom,
    currentNote,
  };
  emit();
  return state;
}
