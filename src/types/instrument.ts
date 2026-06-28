/** Base transport / organism visual modes. */
export type InstrumentVisualState = 'dormant' | 'active' | 'playing' | 'resting';

/** MIDI surface state — placeholder until Web MIDI milestone. */
export type MidiSurfaceState = 'off' | 'pending' | 'connected';

/** Normalized slider values (0–100). */
export type SoundControlValues = {
  volume: number;
  tone: number;
  texture: number;
  bloom: number;
};

/** Normalized slider values (0–100). */
export type ModulationControlValues = {
  growthRate: number;
  drift: number;
  mutation: number;
  energy: number;
};

/** Parameters passed to the organism builder. */
export type OrganismVisualParams = {
  visualState: InstrumentVisualState;
  /** Modulation energy slider — drives particle density in the organism. */
  energy: number;
  /** Modulation mutation slider — drives ╳ disruptions when > 0. */
  mutation: number;
  /** Sound bloom slider — drives bloom glyph scale when > 0. */
  bloom: number;
};

export type PresetSummary = {
  id: string;
  name: string;
};
