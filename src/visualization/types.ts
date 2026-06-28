import type { PlantasiaPreset } from 'plantasia-sound-engine';
import type { ActiveNoteState } from '../stores/engineStore';
import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import type { SourceEnergyMap, UnifiedVisualEnergyState, VisualEnergyBehavior } from './VisualEnergy';
import type { VisualRenderMode } from './VisualMode';

export type { VisualEnergyBehavior, UnifiedVisualEnergyState, SourceEnergyMap, VisualRenderMode };

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
  mold: number;
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
  | 'slow-drape'
  | 'atmospheric-fade'
  | 'shatter-fade';

export type SpatialLayout =
  | 'sparse-vertical'
  | 'ground-heavy'
  | 'radial-burst'
  | 'meadow-grid'
  | 'network-cloud'
  | 'chaotic-scatter'
  | 'wide-organic'
  | 'horizon-wide'
  | 'network-drape'
  | 'symmetric-radial';

export type PresetTheme = {
  id: string;
  name: string;
  /** Engine organism / ascii lifecycle state. */
  asciiState: string;
  /** Engine species label (e.g. Plantasonic, Fern). */
  engineSpecies: string;
  /** Manifest or JSON category when available. */
  category: string | null;
  /** Optional future visual metadata from the engine preset. */
  visualMetadata: import('../presets/types').PresetVisualMetadata;
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
  activePreset: PlantasiaPreset | null;
  asciiState: string;
  engineSpecies: string;
  category: string | null;
  visualMetadata: import('../presets/types').PresetVisualMetadata;
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
  /** Pointer position in grid coordinates + decaying activity. */
  pointer: {
    gridX: number;
    gridY: number;
    active: boolean;
    activity: number;
    velocity: number;
    isTouch: boolean;
  };
  /** Unified visual energy model (Milestone 12B). */
  energy: UnifiedVisualEnergyState;
  /** idleHome vs activePlay render path (Milestone 12D idle). */
  renderMode: VisualRenderMode;
  /** Derived ASCII behavior from energy. */
  energyBehavior: VisualEnergyBehavior;
  /** 0–1 preset theme crossfade progress (0 = mid-transition). */
  presetTransition: number;
  /** Active Scriabin musical color frame (Milestone 12D). */
  musicalColor: MusicalColorFrame;
  /** Expressive performance transforms (Milestone 13C). */
  performance: import('./PerformanceAnimation').PerformanceAnimationState;
  /** Transport ambient session active (Milestone 13D). */
  ambientActive: boolean;
};

/** Runtime musical color passed into the ASCII renderer for glyph tinting. */
export type MusicalColorFrame = {
  displayHex: string;
  ambientHex: string;
  weight: number;
  bloom: number;
};

export type AsciiFrameOutput = {
  text: string;
  html: string;
  musicalColor: MusicalColorFrame;
  /** Blended preset ambient — drives UI accent crossfade. */
  ambientColorHint: string;
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
