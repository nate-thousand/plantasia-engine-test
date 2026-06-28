import type {
  InstrumentVisualState,
  ModulationControlValues,
  PresetSummary,
  SoundControlValues,
} from '../../types/instrument';
import type { PresetMetadata } from '../../presets/types';
import { formatCategoryLabel } from '../../presets/categories';
import type { ActiveNoteState } from '../../stores/engineStore';

const CONSONANT_INTERVALS = new Set([0, 3, 4, 7, 12]);
const DISSONANT_INTERVALS = new Set([1, 2, 6, 10, 11]);

/** High-level organism life modes driven by audio + input. */
export type OrganismLifeState =
  | 'dormant'
  | 'idle'
  | 'single'
  | 'chord'
  | 'harmony'
  | 'tension'
  | 'resolution';

/** Chord interval classification for visual structure selection. */
export type HarmonyProfile = 'none' | 'consonant' | 'dissonant' | 'cluster';

/** Placeholder preset visual identity derived from engine metadata. */
export type PresetVisualIdentity = {
  id: string;
  name: string;
  category: string;
  archetype: string;
  density: number;
  growthStyle: 'upward' | 'radial' | 'network' | 'minimal';
  mutationLevel: number;
  bloomShape: 'cross' | 'diamond' | 'field' | 'none';
  energyProfile: number;
};

/** Full visual state consumed by the organism renderer pipeline. */
export type OrganismState = {
  lifeState: OrganismLifeState;
  visualState: InstrumentVisualState;
  harmonyProfile: HarmonyProfile;
  activeNotes: ActiveNoteState[];
  lastNote: ActiveNoteState | null;
  sound: SoundControlValues;
  modulation: ModulationControlValues;
  preset: PresetVisualIdentity;
  /** Display label for overlay (e.g. "harmony", "tension"). */
  stateLabel: string;
  /** 0–100 burst intensity from MIDI pulse, transport, and active input. */
  interactionBoost: number;
};

export type BuildOrganismStateInput = {
  audioReady: boolean;
  visualState: InstrumentVisualState;
  activeNotes: ActiveNoteState[];
  lastNote: ActiveNoteState | null;
  sound: SoundControlValues;
  modulation: ModulationControlValues;
  preset: PresetSummary | null;
  presetMetadata?: PresetMetadata | null;
  interactionBoost?: number;
};

function growthStyleForAsciiState(asciiState: string | null): PresetVisualIdentity['growthStyle'] {
  switch (asciiState) {
    case 'bloom':
      return 'radial';
    case 'mycelium':
    case 'ecosystem':
      return 'network';
    case 'mutation':
      return 'radial';
    case 'growth':
      return 'upward';
    default:
      return 'minimal';
  }
}

function densityForAsciiState(asciiState: string | null): number {
  switch (asciiState) {
    case 'mycelium':
    case 'ecosystem':
      return 0.7;
    case 'mutation':
      return 0.85;
    case 'growth':
      return 0.55;
    case 'bloom':
      return 0.6;
    default:
      return 0.5;
  }
}

/** Preset visual identity from engine metadata — no hardcoded preset ids. */
export function buildPresetVisualIdentity(
  preset: PresetSummary | null,
  metadata?: PresetMetadata | null,
): PresetVisualIdentity {
  const id = metadata?.id ?? preset?.id ?? 'unknown';
  const name = metadata?.name ?? preset?.name ?? 'Unknown';
  const category = metadata?.category ?? preset?.category ?? 'unknown';
  const asciiState = metadata?.asciiState ?? preset?.asciiState ?? null;
  const mood = metadata?.mood ?? preset?.mood ?? '';

  return {
    id,
    name,
    category: category === 'unknown' ? 'unknown' : formatCategoryLabel(category),
    archetype: asciiState ?? 'organism',
    density: densityForAsciiState(asciiState),
    growthStyle: growthStyleForAsciiState(asciiState),
    mutationLevel: asciiState === 'mutation' ? 0.8 : mood.includes('disrupt') ? 0.5 : 0.2,
    bloomShape:
      asciiState === 'bloom' || mood.includes('bloom') || mood.includes('flower')
        ? 'diamond'
        : 'cross',
    energyProfile: asciiState === 'ecosystem' ? 0.68 : 0.55,
  };
}

function lifeStateLabel(lifeState: OrganismLifeState): string {
  switch (lifeState) {
    case 'dormant':
      return 'dormant';
    case 'idle':
      return 'idle';
    case 'single':
      return 'note';
    case 'chord':
      return 'chord';
    case 'harmony':
      return 'harmony';
    case 'tension':
      return 'tension';
    case 'resolution':
      return 'resolution';
    default:
      return 'active';
  }
}

/** Classify interval content across active notes. */
export function classifyHarmony(notes: ActiveNoteState[]): HarmonyProfile {
  if (notes.length < 2) {
    return 'none';
  }

  const sorted = [...notes].map((n) => n.midi).sort((a, b) => a - b);
  const intervals = new Set<number>();

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      intervals.add(Math.abs(sorted[j] - sorted[i]) % 12);
    }
  }

  const span = sorted[sorted.length - 1] - sorted[0];
  if (notes.length >= 3 && span <= 5) {
    return 'cluster';
  }

  let consonant = 0;
  let dissonant = 0;

  for (const interval of intervals) {
    if (CONSONANT_INTERVALS.has(interval)) {
      consonant += 1;
    }
    if (DISSONANT_INTERVALS.has(interval)) {
      dissonant += 1;
    }
  }

  if (dissonant > consonant) {
    return 'dissonant';
  }
  if (consonant > 0) {
    return 'consonant';
  }
  return 'cluster';
}

export function resolveLifeState(state: OrganismState): OrganismLifeState {
  if (state.lifeState === 'dormant' || state.visualState === 'dormant') {
    return 'dormant';
  }

  const noteCount = state.activeNotes.length;
  if (noteCount === 0) {
    return state.visualState === 'resting' ? 'resolution' : 'idle';
  }

  if (noteCount === 1) {
    return 'single';
  }

  const harmony = classifyHarmony(state.activeNotes);
  if (harmony === 'dissonant' || harmony === 'cluster') {
    return 'tension';
  }
  if (harmony === 'consonant') {
    return 'harmony';
  }
  return 'chord';
}

/** Compose OrganismState from engine store + control surface. */
export function buildOrganismState(input: BuildOrganismStateInput): OrganismState {
  const preset = buildPresetVisualIdentity(input.preset, input.presetMetadata);

  if (!input.audioReady || input.visualState === 'dormant') {
    return {
      lifeState: 'dormant',
      visualState: 'dormant',
      harmonyProfile: 'none',
      activeNotes: [],
      lastNote: null,
      sound: input.sound,
      modulation: input.modulation,
      preset,
      stateLabel: 'dormant',
      interactionBoost: 0,
    };
  }

  const interactionBoost = Math.min(
    100,
    (input.interactionBoost ?? 0) +
      input.activeNotes.length * 8 +
      (input.visualState === 'playing' ? 25 : 0),
  );

  const draft: OrganismState = {
    lifeState: 'idle',
    visualState: input.visualState,
    harmonyProfile: classifyHarmony(input.activeNotes),
    activeNotes: input.activeNotes,
    lastNote: input.lastNote,
    sound: input.sound,
    modulation: input.modulation,
    preset,
    stateLabel: 'idle',
    interactionBoost,
  };

  const lifeState = resolveLifeState(draft);

  return {
    ...draft,
    lifeState,
    stateLabel: lifeStateLabel(lifeState),
  };
}
