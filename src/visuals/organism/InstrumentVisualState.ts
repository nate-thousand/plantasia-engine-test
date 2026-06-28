import type { InstrumentVisualState, OrganismVisualParams } from '../../types/instrument';
import { buildOrganismFromState } from './OrganismMappings';
import { buildOrganismState, type BuildOrganismStateInput } from './OrganismState';

export type { InstrumentVisualState, OrganismVisualParams };
export { buildOrganismState, type OrganismState } from './OrganismState';
export { buildOrganismFromState } from './OrganismMappings';
export { KEYBOARD_VISUAL_MAP } from './NoteVisualMapper';

/** Build organism graph from legacy params shape (hook compatibility). */
export function createOrganismForParams(params: OrganismVisualParams) {
  const state = buildOrganismState({
    audioReady: params.visualState !== 'dormant',
    visualState: params.visualState,
    activeNotes: params.activeNotes,
    lastNote: params.lastNote,
    sound: {
      volume: params.volume,
      tone: params.tone,
      texture: params.texture,
      bloom: params.bloom,
    },
    modulation: {
      growthRate: params.growthRate,
      drift: params.drift,
      mutation: params.mutation,
      energy: params.energy,
    },
    preset: params.preset,
    interactionBoost: 0,
  });

  return buildOrganismFromState(state);
}

/** Build organism from full pipeline input. */
export function createOrganismFromInput(input: BuildOrganismStateInput) {
  return buildOrganismFromState(buildOrganismState(input));
}

export function visualStateIndicator(state: InstrumentVisualState): string {
  switch (state) {
    case 'dormant':
      return '○';
    case 'playing':
      return '● · · ·';
    case 'resting':
      return '● ·';
    default:
      return '• │ •';
  }
}

export function organismStateLabel(lifeState: string, noteCount: number): string {
  if (noteCount > 0) {
    return `${lifeState} · ${noteCount}n`;
  }
  return lifeState;
}

export function midiStateIndicator(state: 'off' | 'pending' | 'connected'): string {
  switch (state) {
    case 'connected':
      return 'MIDI ●';
    case 'pending':
      return 'MIDI ○';
    default:
      return 'MIDI —';
  }
}
