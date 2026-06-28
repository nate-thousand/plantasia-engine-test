import type { ActiveNoteState } from '../../stores/engineStore';
import { Edge } from './Edge';
import { GRAMMAR_SYMBOLS, type GrammarStateName } from './GrammarSymbols';
import { GRID_CENTER_X, GRID_CENTER_Y } from './gridConstants';
import { applyEnergyVisuals } from './EnergyVisualMapper';
import {
  mapNotesToVisuals,
  type NoteVisualPlacement,
} from './NoteVisualMapper';
import { Node } from './Node';
import type { OrganismLifeState, OrganismState, HarmonyProfile } from './OrganismState';
import { classifyHarmony, resolveLifeState } from './OrganismState';
import { Organism } from './Organism';
import { applyToneVisuals } from './ToneVisualMapper';
import {
  connectionWebGlyphs,
  diamondBurstGlyphs,
  dormantBreathGlyphs,
  idleEcosystemGlyphs,
  interactionScatterGlyphs,
  ringGlyphs,
  scatterFieldGlyphs,
  signalPathFromCenter,
  transportChordBurstGlyphs,
  type GlyphPoint,
} from './VisualGlyphs';

function grammarStateForLife(lifeState: OrganismLifeState): GrammarStateName {
  switch (lifeState) {
    case 'dormant':
      return 'seed';
    case 'idle':
    case 'resolution':
      return 'sprout';
    case 'single':
      return 'branch';
    case 'harmony':
      return 'harmony';
    case 'tension':
      return 'growth';
    default:
      return 'growth';
  }
}

function addPathGlyphs(organism: Organism, id: string, glyphs: GlyphPoint[], kind: Edge['kind'] = 'energyTransfer'): void {
  if (glyphs.length === 0) {
    return;
  }

  organism.addEdge(
    new Edge({
      id,
      from: 'core',
      to: 'core',
      kind,
      pathGlyphs: glyphs,
    }),
  );
}

function addDormantOrganism(organism: Organism): void {
  organism.addNode(
    new Node({
      id: 'core',
      x: GRID_CENTER_X,
      y: GRID_CENTER_Y,
      biologicalState: 'dormant',
      energy: 0.08,
      symbol: GRAMMAR_SYMBOLS.dormant,
      data: { roles: ['state'] },
    }),
  );

  addPathGlyphs(organism, 'dormant-breath', dormantBreathGlyphs());
}

function addIdleSpine(organism: Organism): void {
  organism.addNode(
    new Node({
      id: 'core',
      x: GRID_CENTER_X,
      y: GRID_CENTER_Y,
      biologicalState: 'growing',
      energy: 0.55,
      symbol: GRAMMAR_SYMBOLS.seed,
      data: { roles: ['state', 'preset'], presetId: 'core' },
    }),
  );

  addPathGlyphs(organism, 'idle-ecosystem', idleEcosystemGlyphs());
}

function applyPresetIdentity(organism: Organism, state: OrganismState): void {
  const { preset } = state;
  const density = Math.round(preset.density * 20);

  if (preset.growthStyle === 'network') {
    addPathGlyphs(
      organism,
      'preset-network',
      [
        ...connectionWebGlyphs([
          { x: GRID_CENTER_X - 8, y: GRID_CENTER_Y },
          { x: GRID_CENTER_X + 8, y: GRID_CENTER_Y },
          { x: GRID_CENTER_X, y: GRID_CENTER_Y - 6 },
          { x: GRID_CENTER_X, y: GRID_CENTER_Y + 6 },
        ]),
        ...scatterFieldGlyphs(GRID_CENTER_X, GRID_CENTER_Y, density, 12, 8, GRAMMAR_SYMBOLS.intersection),
      ],
      'synchronization',
    );
  }

  if (preset.growthStyle === 'upward') {
    addPathGlyphs(
      organism,
      'preset-upward',
      scatterFieldGlyphs(GRID_CENTER_X, GRID_CENTER_Y - 8, density, 8, 6, GRAMMAR_SYMBOLS.vertical),
    );
  }

  if (preset.growthStyle === 'radial') {
    addPathGlyphs(
      organism,
      'preset-radial',
      ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, 6, GRAMMAR_SYMBOLS.densityMedium),
    );
  }

  if (preset.mutationLevel >= 0.45) {
    const span = Math.round(preset.mutationLevel * 5);
    addPathGlyphs(
      organism,
      'preset-mutation-bias',
      [
        { x: GRID_CENTER_X + span, y: GRID_CENTER_Y - span, symbol: GRAMMAR_SYMBOLS.mutation },
        ...ringGlyphs(GRID_CENTER_X + span, GRID_CENTER_Y - span, 2, GRAMMAR_SYMBOLS.densityLow),
      ],
      'modulation',
    );
  }

  if (preset.bloomShape === 'diamond') {
    addPathGlyphs(organism, 'preset-bloom-diamond', diamondBurstGlyphs(GRID_CENTER_X, GRID_CENTER_Y - 7, 3));
  }
}

function addNoteVisual(organism: Organism, placement: NoteVisualPlacement): void {
  organism.addNode(
    new Node({
      id: placement.noteId,
      x: placement.x,
      y: placement.y,
      biologicalState: 'active',
      energy: placement.nodeSymbol === GRAMMAR_SYMBOLS.active ? 0.9 : 0.55,
      symbol: placement.nodeSymbol,
      data: {
        roles: ['oscillator', 'voice'],
        harmonicGroup: placement.role,
      },
    }),
  );

  organism.addEdge(
    new Edge({
      id: `edge-${placement.noteId}`,
      from: 'core',
      to: placement.noteId,
      kind: 'signalFlow',
      pathGlyphs: placement.edgeGlyphs,
    }),
  );

  organism.addEdge(
    new Edge({
      id: `density-${placement.noteId}`,
      from: placement.noteId,
      to: placement.noteId,
      kind: 'energyTransfer',
      pathGlyphs: [
        { x: placement.x, y: placement.y + 1, symbol: placement.densitySymbol },
        { x: placement.x - 1, y: placement.y + 2, symbol: GRAMMAR_SYMBOLS.densityLow },
        { x: placement.x + 1, y: placement.y + 2, symbol: GRAMMAR_SYMBOLS.densityLow },
        ...ringGlyphs(placement.x, placement.y, 2, GRAMMAR_SYMBOLS.softParticle),
      ],
    }),
  );
}

function applyChordStructure(
  organism: Organism,
  notes: ActiveNoteState[],
  harmony: HarmonyProfile,
): void {
  if (notes.length < 2) {
    return;
  }

  const placements = mapNotesToVisuals(notes);
  const xs = placements.map((p) => p.x);
  const ys = placements.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const midX = Math.round((minX + maxX) / 2);
  const midY = Math.round((minY + maxY) / 2);

  addPathGlyphs(
    organism,
    'chord-web',
    connectionWebGlyphs(placements.map((p) => ({ x: p.x, y: p.y }))),
    'synchronization',
  );

  if (harmony === 'consonant') {
    addPathGlyphs(
      organism,
      'chord-harmony',
      [
        ...diamondBurstGlyphs(midX, midY, 3 + notes.length),
        ...diamondBurstGlyphs(midX, minY - 2, 2 + notes.length),
        { x: minX, y: midY, symbol: GRAMMAR_SYMBOLS.diagUpRight },
        { x: maxX, y: midY, symbol: GRAMMAR_SYMBOLS.diagDownRight },
        { x: midX, y: maxY + 1, symbol: GRAMMAR_SYMBOLS.active },
        ...scatterFieldGlyphs(midX, midY, notes.length * 6, maxX - minX + 2, maxY - minY + 2, GRAMMAR_SYMBOLS.seed),
      ],
      'harmonic',
    );
    return;
  }

  if (harmony === 'dissonant' || harmony === 'cluster') {
    addPathGlyphs(
      organism,
      'chord-tension',
      [
        { x: minX, y: minY - 1, symbol: GRAMMAR_SYMBOLS.active },
        { x: maxX, y: maxY + 1, symbol: GRAMMAR_SYMBOLS.active },
        { x: midX, y: midY, symbol: GRAMMAR_SYMBOLS.mutation },
        { x: midX - 2, y: midY - 2, symbol: GRAMMAR_SYMBOLS.diagUpRight },
        { x: midX + 2, y: midY + 2, symbol: GRAMMAR_SYMBOLS.diagDownRight },
        ...ringGlyphs(midX, midY, 3 + notes.length, GRAMMAR_SYMBOLS.mutation),
        ...signalPathFromCenter(minX, maxY, 8),
      ],
      'modulation',
    );

    if (harmony === 'cluster') {
      addPathGlyphs(
        organism,
        'chord-cluster-texture',
        scatterFieldGlyphs(midX, midY, 20 + notes.length * 4, 8, 6, GRAMMAR_SYMBOLS.densityHigh),
      );
    }
  }
}

function applyInteractionBoost(organism: Organism, state: OrganismState): void {
  addPathGlyphs(organism, 'interaction-scatter', interactionScatterGlyphs(state.interactionBoost));

  if (state.visualState === 'playing' && state.activeNotes.length === 0) {
    addPathGlyphs(organism, 'transport-chord-burst', transportChordBurstGlyphs());
  }

  if (state.lastNote) {
    const last = mapNotesToVisuals([state.lastNote])[0];
    addPathGlyphs(
      organism,
      'last-note-echo',
      [
        ...ringGlyphs(last.x, last.y, 4, GRAMMAR_SYMBOLS.softParticle),
        ...scatterFieldGlyphs(last.x, last.y, 8 + Math.round(state.interactionBoost / 12), 5, 4, GRAMMAR_SYMBOLS.densityLow),
      ],
    );
  }
}

/** Build a procedural organism graph from composed visual state. */
export function buildOrganismFromState(state: OrganismState): Organism {
  const lifeState = resolveLifeState(state);
  const harmony = classifyHarmony(state.activeNotes);
  const grammarState = grammarStateForLife(lifeState);
  const organism = new Organism({ stateName: grammarState, generation: 0 });

  if (lifeState === 'dormant') {
    addDormantOrganism(organism);
    return organism;
  }

  addIdleSpine(organism);
  applyPresetIdentity(organism, state);

  const notePlacements = mapNotesToVisuals(state.activeNotes);
  for (const placement of notePlacements) {
    addNoteVisual(organism, placement);
  }

  if (state.activeNotes.length >= 2) {
    applyChordStructure(organism, state.activeNotes, harmony);
  }

  if (lifeState === 'resolution') {
    addPathGlyphs(
      organism,
      'resolution-return',
      [
        ...diamondBurstGlyphs(GRID_CENTER_X, GRID_CENTER_Y, 2),
        ...ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, 4, GRAMMAR_SYMBOLS.softParticle),
      ],
      'harmonic',
    );
  }

  applyToneVisuals(organism, state.sound, 'core');
  applyEnergyVisuals(organism, state.modulation, state.sound.mold, 'core');
  applyInteractionBoost(organism, state);

  return organism;
}

export { mapNotesToVisuals, velocityToGlyphs } from './NoteVisualMapper';
export { moldDecayIntensity, toneBrightnessSymbol } from './ToneVisualMapper';
export { energyParticleGlyphs } from './EnergyVisualMapper';
