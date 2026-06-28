import type { InstrumentVisualState, OrganismVisualParams } from '../../types/instrument';
import { Edge } from './Edge';
import { GRAMMAR_SYMBOLS, type GrammarStateName } from './Grammar';
import { Node } from './Node';
import type { OrganismMetadata } from './Organism';
import { Organism } from './Organism';

export type { InstrumentVisualState, OrganismVisualParams };

const CENTER_X = 6;
const CENTER_Y = 5;

function baseMetadata(stateName: GrammarStateName): OrganismMetadata {
  return { stateName, generation: 0 };
}

function addGrowthCore(organism: Organism, centerEnergy: number, branchEnergy: number): void {
  const seed = new Node({
    id: 'seed',
    x: CENTER_X,
    y: CENTER_Y + 2,
    biologicalState: centerEnergy > 0.2 ? 'growing' : 'dormant',
    energy: Math.max(0.15, centerEnergy * 0.5),
    data: { roles: ['state', 'preset'], presetId: 'seed' },
  });

  const stem = new Node({
    id: 'stem',
    x: CENTER_X,
    y: CENTER_Y + 1,
    biologicalState: 'growing',
    energy: centerEnergy,
    data: { roles: ['voice', 'oscillator'], voiceIndex: 0, oscillatorId: 'primary' },
  });

  const center = new Node({
    id: 'center',
    x: CENTER_X,
    y: CENTER_Y,
    biologicalState: 'active',
    energy: centerEnergy,
    data: { roles: ['oscillator', 'harmonic'], harmonicGroup: 'center' },
  });

  const apex = new Node({
    id: 'apex',
    x: CENTER_X,
    y: CENTER_Y - 2,
    biologicalState: centerEnergy >= 0.8 ? 'blooming' : 'active',
    energy: centerEnergy,
    data: { roles: ['harmonic'], harmonicGroup: 'center' },
  });

  const left = new Node({
    id: 'branch-left',
    x: CENTER_X - 3,
    y: CENTER_Y,
    biologicalState: branchEnergy >= 0.65 ? 'active' : 'growing',
    energy: branchEnergy,
    data: { roles: ['voice'], voiceIndex: 1 },
  });

  const right = new Node({
    id: 'branch-right',
    x: CENTER_X + 3,
    y: CENTER_Y,
    biologicalState: branchEnergy >= 0.65 ? 'active' : 'growing',
    energy: branchEnergy,
    data: { roles: ['voice'], voiceIndex: 2 },
  });

  organism
    .addNode(seed)
    .addNode(stem)
    .addNode(center)
    .addNode(apex)
    .addNode(left)
    .addNode(right)
    .addEdge(new Edge({ id: 'e-seed-stem', from: 'seed', to: 'stem', kind: 'energyTransfer' }))
    .addEdge(new Edge({ id: 'e-stem-center', from: 'stem', to: 'center', kind: 'signalFlow' }))
    .addEdge(new Edge({ id: 'e-center-apex', from: 'center', to: 'apex', kind: 'signalFlow' }))
    .addEdge(new Edge({ id: 'e-center-left', from: 'center', to: 'branch-left', kind: 'harmonic' }))
    .addEdge(new Edge({ id: 'e-center-right', from: 'center', to: 'branch-right', kind: 'harmonic' }))
    .addEdge(
      new Edge({
        id: 'e-left-right',
        from: 'branch-left',
        to: 'branch-right',
        kind: 'synchronization',
      }),
    );
}

function addPlayingExpansion(organism: Organism): void {
  organism.addNode(
    new Node({
      id: 'pulse-left',
      x: CENTER_X - 5,
      y: CENTER_Y + 1,
      biologicalState: 'active',
      energy: 0.9,
      data: { roles: ['modulation'], modulationSourceId: 'lfo' },
    }),
  );

  organism.addNode(
    new Node({
      id: 'pulse-right',
      x: CENTER_X + 5,
      y: CENTER_Y + 1,
      biologicalState: 'active',
      energy: 0.9,
      data: { roles: ['modulation'], modulationSourceId: 'envelope' },
    }),
  );

  organism
    .addEdge(
      new Edge({
        id: 'e-left-pulse',
        from: 'branch-left',
        to: 'pulse-left',
        kind: 'modulation',
      }),
    )
    .addEdge(
      new Edge({
        id: 'e-right-pulse',
        from: 'branch-right',
        to: 'pulse-right',
        kind: 'modulation',
      }),
    );
}

/** Map energy slider (0–100) to a row of soft particles beneath the organism. */
function applyEnergyDensity(organism: Organism, energy: number): void {
  const normalized = energy / 100;
  const particleCount = Math.max(1, Math.round(normalized * 9));
  const startX = CENTER_X - Math.floor(particleCount / 2);
  const pathGlyphs = Array.from({ length: particleCount }, (_, index) => ({
    x: startX + index,
    y: CENTER_Y + 3,
    symbol: GRAMMAR_SYMBOLS.softParticle,
  }));

  if (pathGlyphs.length === 0) {
    return;
  }

  organism.addEdge(
    new Edge({
      id: 'e-energy-density',
      from: 'seed',
      to: 'seed',
      kind: 'energyTransfer',
      pathGlyphs,
    }),
  );
}

/** Map mutation slider (0–100) to visible ╳ disruptions at branch hub. */
function applyMutationDisruption(organism: Organism, mutation: number): void {
  if (mutation < 20) {
    return;
  }

  organism.addEdge(
    new Edge({
      id: 'e-mutation-hub',
      from: 'branch-left',
      to: 'branch-right',
      kind: 'modulation',
      pathGlyphs: [
        { x: CENTER_X - 1, y: CENTER_Y, symbol: GRAMMAR_SYMBOLS.diagUpRight },
        { x: CENTER_X, y: CENTER_Y, symbol: GRAMMAR_SYMBOLS.mutation },
        { x: CENTER_X + 1, y: CENTER_Y, symbol: GRAMMAR_SYMBOLS.diagDownRight },
      ],
    }),
  );
}

/** Map bloom slider (0–100) to flower cross around the apex node. */
function applyBloomShape(organism: Organism, bloom: number): void {
  if (bloom < 15) {
    return;
  }

  const span = bloom >= 60 ? 2 : 1;
  const y = CENTER_Y - 2;

  organism.addEdge(
    new Edge({
      id: 'e-bloom-cross',
      from: 'apex',
      to: 'apex',
      kind: 'signalFlow',
      pathGlyphs: [
        { x: CENTER_X - span, y, symbol: GRAMMAR_SYMBOLS.diagUpRight },
        { x: CENTER_X, y, symbol: GRAMMAR_SYMBOLS.active },
        { x: CENTER_X + span, y, symbol: GRAMMAR_SYMBOLS.diagDownRight },
        { x: CENTER_X, y: y - 1, symbol: GRAMMAR_SYMBOLS.vertical },
        { x: CENTER_X, y: y + 1, symbol: GRAMMAR_SYMBOLS.vertical },
        { x: CENTER_X - span, y: y - 1, symbol: GRAMMAR_SYMBOLS.horizontal },
        { x: CENTER_X + span, y: y + 1, symbol: GRAMMAR_SYMBOLS.horizontal },
      ],
    }),
  );
}

function buildBaseOrganism(visualState: InstrumentVisualState): Organism {
  if (visualState === 'dormant') {
    const organism = new Organism(baseMetadata('seed'));

    organism
      .addNode(
        new Node({
          id: 'seed',
          x: CENTER_X,
          y: CENTER_Y,
          biologicalState: 'dormant',
          energy: 0.08,
          symbol: GRAMMAR_SYMBOLS.seed,
          data: { roles: ['state'] },
        }),
      )
      .addNode(
        new Node({
          id: 'ghost',
          x: CENTER_X,
          y: CENTER_Y - 1,
          biologicalState: 'dormant',
          energy: 0.05,
          symbol: GRAMMAR_SYMBOLS.dormant,
          data: { roles: ['state'] },
        }),
      )
      .addEdge(
        new Edge({
          id: 'e-potential',
          from: 'seed',
          to: 'ghost',
          kind: 'energyTransfer',
        }),
      );

    return organism;
  }

  if (visualState === 'playing') {
    const organism = new Organism(baseMetadata('growth'));
    addGrowthCore(organism, 0.95, 0.85);
    addPlayingExpansion(organism);
    return organism;
  }

  if (visualState === 'resting') {
    const organism = new Organism(baseMetadata('growth'));
    addGrowthCore(organism, 0.72, 0.55);
    return organism;
  }

  const organism = new Organism(baseMetadata('sprout'));
  addGrowthCore(organism, 0.78, 0.45);
  return organism;
}

/** Build a procedural organism from transport state and control surface sliders. */
export function createOrganismForParams(params: OrganismVisualParams): Organism {
  const organism = buildBaseOrganism(params.visualState);

  if (params.visualState === 'dormant') {
    return organism;
  }

  applyEnergyDensity(organism, params.energy);
  applyMutationDisruption(organism, params.mutation);
  applyBloomShape(organism, params.bloom);

  return organism;
}

/** @deprecated Use createOrganismForParams */
export function createOrganismForVisualState(state: InstrumentVisualState): Organism {
  return createOrganismForParams({ visualState: state, energy: 0, mutation: 0, bloom: 0 });
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
      return '●';
  }
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
