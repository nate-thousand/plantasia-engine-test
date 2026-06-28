import { Edge } from './Edge';
import { GRAMMAR_SYMBOLS, type GrammarStateName } from './Grammar';
import { Node } from './Node';

export type OrganismMetadata = {
  stateName: GrammarStateName;
  generation: number;
};

/**
 * Procedural organism graph — nodes and connections driven by ASCII grammar rules.
 */
export class Organism {
  readonly nodes: Map<string, Node> = new Map();
  readonly edges: Edge[] = [];
  readonly metadata: OrganismMetadata;

  constructor(metadata: OrganismMetadata) {
    this.metadata = metadata;
  }

  addNode(node: Node): this {
    this.nodes.set(node.id, node);
    return this;
  }

  addEdge(edge: Edge): this {
    this.edges.push(edge);
    return this;
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  listNodes(): Node[] {
    return [...this.nodes.values()];
  }

  /**
   * First procedural organism — minimal growth pattern from grammar rules.
   * Seed → sprout → branch (no hardcoded decorative artwork).
   */
  static createInitial(): Organism {
    const organism = new Organism({ stateName: 'growth', generation: 0 });

    const seed = new Node({
      id: 'seed',
      x: 5,
      y: 6,
      biologicalState: 'dormant',
      energy: 0.1,
      symbol: GRAMMAR_SYMBOLS.seed,
      data: { roles: ['state', 'preset'], presetId: 'seed' },
    });

    const stem = new Node({
      id: 'stem',
      x: 5,
      y: 4,
      biologicalState: 'growing',
      energy: 0.55,
      data: { roles: ['voice', 'oscillator'], voiceIndex: 0, oscillatorId: 'primary' },
    });

    const apex = new Node({
      id: 'apex',
      x: 5,
      y: 2,
      biologicalState: 'active',
      energy: 0.85,
      data: { roles: ['oscillator', 'harmonic'], harmonicGroup: 'center' },
    });

    const left = new Node({
      id: 'branch-left',
      x: 2,
      y: 3,
      biologicalState: 'growing',
      energy: 0.6,
      data: { roles: ['voice', 'modulation'], voiceIndex: 1, modulationSourceId: 'lfo' },
    });

    const center = new Node({
      id: 'branch-center',
      x: 5,
      y: 3,
      biologicalState: 'active',
      energy: 0.7,
      data: { roles: ['harmonic', 'effect'], effectId: 'reverb', harmonicGroup: 'triad' },
    });

    const right = new Node({
      id: 'branch-right',
      x: 8,
      y: 3,
      biologicalState: 'growing',
      energy: 0.6,
      data: { roles: ['voice', 'modulation'], voiceIndex: 2, modulationSourceId: 'envelope' },
    });

    organism
      .addNode(seed)
      .addNode(stem)
      .addNode(apex)
      .addNode(left)
      .addNode(center)
      .addNode(right)
      .addEdge(new Edge({ id: 'e-seed-stem', from: 'seed', to: 'stem', kind: 'energyTransfer' }))
      .addEdge(new Edge({ id: 'e-stem-apex', from: 'stem', to: 'apex', kind: 'signalFlow' }))
      .addEdge(new Edge({ id: 'e-stem-left', from: 'stem', to: 'branch-left', kind: 'harmonic' }))
      .addEdge(new Edge({ id: 'e-stem-center', from: 'stem', to: 'branch-center', kind: 'signalFlow' }))
      .addEdge(new Edge({ id: 'e-stem-right', from: 'stem', to: 'branch-right', kind: 'harmonic' }))
      .addEdge(
        new Edge({
          id: 'e-left-center',
          from: 'branch-left',
          to: 'branch-center',
          kind: 'synchronization',
        }),
      )
      .addEdge(
        new Edge({
          id: 'e-center-right',
          from: 'branch-center',
          to: 'branch-right',
          kind: 'synchronization',
        }),
      );

    return organism;
  }
}
