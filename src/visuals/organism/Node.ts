import {
  type BiologicalState,
  type GrammarSymbol,
  symbolForNode,
} from './Grammar';

/** Semantic roles a node may represent in the living instrument. */
export type NodeRole =
  | 'oscillator'
  | 'voice'
  | 'preset'
  | 'modulation'
  | 'effect'
  | 'harmonic'
  | 'state';

/** Placeholder bindings for future audio engine coupling. */
export type NodeEngineBindings = {
  activity: number;
  brightness: number;
  size: number;
  state: BiologicalState;
  growth: number;
};

/** Domain data attached to a node — placeholders for future engine mapping. */
export type OrganismNodeData = {
  roles: NodeRole[];
  oscillatorId?: string;
  voiceIndex?: number;
  presetId?: string;
  modulationSourceId?: string;
  effectId?: string;
  harmonicGroup?: string;
};

export type OrganismNodeOptions = {
  id: string;
  x: number;
  y: number;
  biologicalState?: BiologicalState;
  energy?: number;
  symbol?: GrammarSymbol;
  data?: Partial<OrganismNodeData>;
  engine?: Partial<NodeEngineBindings>;
};

/**
 * A single point in the organism graph.
 * Every node represents sound, state, or modulation — never decoration.
 */
export class Node {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  symbol: GrammarSymbol;
  biologicalState: BiologicalState;
  readonly data: OrganismNodeData;
  readonly engine: NodeEngineBindings;

  constructor(options: OrganismNodeOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.biologicalState = options.biologicalState ?? 'dormant';
    const energy = options.energy ?? 0.5;
    this.symbol = options.symbol ?? symbolForNode(this.biologicalState, energy);
    this.data = {
      roles: options.data?.roles ?? ['state'],
      oscillatorId: options.data?.oscillatorId,
      voiceIndex: options.data?.voiceIndex,
      presetId: options.data?.presetId,
      modulationSourceId: options.data?.modulationSourceId,
      effectId: options.data?.effectId,
      harmonicGroup: options.data?.harmonicGroup,
    };
    this.engine = {
      activity: options.engine?.activity ?? energy,
      brightness: options.engine?.brightness ?? energy,
      size: options.engine?.size ?? 1,
      state: options.engine?.state ?? this.biologicalState,
      growth: options.engine?.growth ?? 0,
    };
  }

  /** Reserved for future engine events — updates visual binding without rendering. */
  applyEngineUpdate(partial: Partial<NodeEngineBindings>): void {
    Object.assign(this.engine, partial);

    if (partial.state !== undefined) {
      this.biologicalState = partial.state;
    }

    if (
      partial.activity !== undefined ||
      partial.state !== undefined ||
      partial.brightness !== undefined
    ) {
      const energy = partial.activity ?? partial.brightness ?? this.engine.activity;
      this.symbol = symbolForNode(this.biologicalState, energy);
    }
  }
}
