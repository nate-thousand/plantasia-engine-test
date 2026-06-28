import type { GrammarSymbol } from './Grammar';

/** What a connection represents in the living instrument. */
export type ConnectionKind =
  | 'signalFlow'
  | 'modulation'
  | 'energyTransfer'
  | 'harmonic'
  | 'synchronization';

export type OrganismEdgeOptions = {
  id: string;
  from: string;
  to: string;
  kind?: ConnectionKind;
  /** Optional explicit path override for future procedural routing. */
  pathGlyphs?: Array<{ x: number; y: number; symbol: GrammarSymbol }>;
};

/**
 * A directed connection between two nodes.
 * Static in this milestone — reserved for signal and modulation flow.
 */
export class Edge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly kind: ConnectionKind;
  readonly pathGlyphs: Array<{ x: number; y: number; symbol: GrammarSymbol }>;

  constructor(options: OrganismEdgeOptions) {
    this.id = options.id;
    this.from = options.from;
    this.to = options.to;
    this.kind = options.kind ?? 'signalFlow';
    this.pathGlyphs = options.pathGlyphs ?? [];
  }
}
