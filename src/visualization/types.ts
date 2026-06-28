import type { ActiveNoteState } from '../stores/engineStore';
import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';

/** Botanical character categories for procedural rendering. */
export type CharacterCategory =
  | 'seed'
  | 'moss'
  | 'grass'
  | 'vine'
  | 'leaf'
  | 'flower'
  | 'bark'
  | 'root'
  | 'water'
  | 'wind'
  | 'spore'
  | 'stone';

export type PlantSpecies =
  | 'vine'
  | 'crystal'
  | 'spore'
  | 'moss'
  | 'flower'
  | 'trunk'
  | 'bloom'
  | 'fern';

export type PlantPhase = 'growing' | 'sustain' | 'releasing' | 'faded';

export type BranchSegment = {
  x: number;
  y: number;
  char: string;
  angle: number;
};

export type PlantInstance = {
  id: string;
  midi: number;
  velocity: number;
  x: number;
  y: number;
  pan: number;
  species: PlantSpecies;
  phase: PlantPhase;
  age: number;
  growth: number;
  brightness: number;
  segments: BranchSegment[];
  releaseProgress: number;
};

export type VizParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  life: number;
  maxLife: number;
  category: CharacterCategory;
};

/** Derived synthesis parameters mapped to visuals. */
export type SoundVizParams = {
  volume: number;
  tone: number;
  texture: number;
  bloom: number;
  growthRate: number;
  drift: number;
  mutation: number;
  energy: number;
  filterCutoff: number;
  resonance: number;
  lfoRate: number;
  lfoDepth: number;
  delayWet: number;
  reverbWet: number;
  chorus: number;
  phaser: number;
  distortion: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  oscillatorType: 'analog' | 'fm' | 'granular' | 'noise' | 'pad' | 'bass' | 'lead';
};

export type MotionStyle =
  | 'breathing'
  | 'heavy-pulse'
  | 'burst-rhythm'
  | 'glitch-symmetry'
  | 'swarm-drift'
  | 'crawl-static'
  | 'seed-pop'
  | 'horizon-wave';

export type GrowthBehavior =
  | 'slow-vine'
  | 'downward-root'
  | 'fast-bloom'
  | 'crystal-facet'
  | 'particle-cloud'
  | 'moss-crawl'
  | 'seed-arc'
  | 'field-wave'
  | 'network-mycelium';

export type DecayBehavior =
  | 'fast-fade'
  | 'slow-root'
  | 'quick-petal'
  | 'fragment-cloud'
  | 'distort-decay'
  | 'gentle-unfurl'
  | 'atmospheric-fade'
  | 'shatter-fade';

export type SpatialLayout =
  | 'sparse-vertical'
  | 'ground-heavy'
  | 'radial-burst'
  | 'network-cloud'
  | 'chaotic-scatter'
  | 'wide-organic'
  | 'horizon-wide'
  | 'network-drape'
  | 'symmetric-radial';

export type PresetTheme = {
  id: string;
  name: string;
  characterSet: string[];
  density: number;
  motionStyle: MotionStyle;
  growthBehavior: GrowthBehavior;
  particleBehavior: string;
  bloomBehavior: string;
  decayBehavior: DecayBehavior;
  colorPalette: string[];
  species: PlantSpecies;
  palette: CharacterCategory[];
  accentChars: string[];
  growthStyle: 'upward' | 'radial' | 'network' | 'cascade';
  particleBias: CharacterCategory;
  animationSpeed: number;
  windStrength: number;
  spatialLayout: SpatialLayout;
  rhythm: number;
  contrast: number;
  hardResetOnChange: boolean;
  colorHint: string;
};

export type VizAccessibility = {
  density: number;
  animationSpeed: number;
  characterScale: number;
  contrast: number;
  reduceMotion: boolean;
};

export type VizInputSnapshot = {
  audioReady: boolean;
  activeNotes: ActiveNoteState[];
  sound: SoundControlValues;
  modulation: ModulationControlValues;
  presetId: string;
  presetName: string;
  interactionBoost: number;
  audio: AudioVizFeedback;
  time: number;
  pitchBend: number;
  modWheel: number;
  channelPressure: number;
  midiEffectTick: number;
  midiEffectKind: string | null;
  midiEffectIntensity: number;
  controlHighlightTick: number;
};

export type NoteSpawnEvent = {
  midi: number;
  velocity: number;
  source: 'keyboard' | 'midi' | 'sequencer' | 'automation';
  pan: number;
};

export type NoteReleaseEvent = {
  midi: number;
  source: 'keyboard' | 'midi' | 'sequencer' | 'automation';
};
