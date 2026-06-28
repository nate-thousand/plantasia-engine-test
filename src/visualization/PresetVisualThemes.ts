import type {
  CharacterCategory,
  DecayBehavior,
  GrowthBehavior,
  MotionStyle,
  PresetTheme,
  PlantSpecies,
  SpatialLayout,
} from './types';

/** Full visual theme definition for a preset — one unique ASCII ecosystem per preset. */
export type PresetVisualThemeDefinition = {
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
  growthStyle: PresetTheme['growthStyle'];
  particleBias: CharacterCategory;
  animationSpeed: number;
  windStrength: number;
  spatialLayout: SpatialLayout;
  rhythm: number;
  contrast: number;
  hardResetOnChange: boolean;
  accentChars: string[];
};

export const PRESET_VISUAL_THEMES: Record<string, PresetVisualThemeDefinition> = {
  seed: {
    id: 'seed',
    name: 'Seed',
    characterSet: ['.', "'", '`', '*', '+', '°', '◌', '·'],
    density: 0.28,
    motionStyle: 'seed-pop',
    growthBehavior: 'seed-arc',
    particleBehavior: 'Quick seed pops with falling arcs and short trails',
    bloomBehavior: 'Tiny burst on attack, sparse scatter',
    decayBehavior: 'fast-fade',
    colorPalette: ['#c8d8b0', '#a8b890', '#e8f0d8'],
    species: 'vine',
    palette: ['seed', 'grass', 'moss'],
    growthStyle: 'upward',
    particleBias: 'seed',
    animationSpeed: 1.15,
    windStrength: 0.12,
    spatialLayout: 'sparse-vertical',
    rhythm: 0.85,
    contrast: 0.45,
    hardResetOnChange: false,
    accentChars: ['*', '+', '°'],
  },
  root: {
    id: 'root',
    name: 'Root',
    characterSet: ['█', '▓', '▒', '░', '|', '/', '\\', '#', '%', '@'],
    density: 0.88,
    motionStyle: 'heavy-pulse',
    growthBehavior: 'downward-root',
    particleBehavior: 'Ground dust and root fragments on attack',
    bloomBehavior: 'Dense vertical trunk burst on note',
    decayBehavior: 'slow-root',
    colorPalette: ['#4a3c32', '#6b5b4f', '#8a7060', '#2a2218'],
    species: 'trunk',
    palette: ['bark', 'root', 'stone', 'moss'],
    growthStyle: 'cascade',
    particleBias: 'stone',
    animationSpeed: 0.38,
    windStrength: 0.08,
    spatialLayout: 'ground-heavy',
    rhythm: 0.35,
    contrast: 0.82,
    hardResetOnChange: false,
    accentChars: ['█', '▓', '#'],
  },
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    characterSet: ['*', '+', '✦', '✧', '^', '/', '\\', '|', '<', '>'],
    density: 0.62,
    motionStyle: 'burst-rhythm',
    growthBehavior: 'fast-bloom',
    particleBehavior: 'Bright rhythmic star particles on sustain',
    bloomBehavior: 'Flowers open wide on sustain, sharp stems',
    decayBehavior: 'quick-petal',
    colorPalette: ['#ffb8d0', '#ff8cb0', '#ffd0e8', '#ff6090'],
    species: 'bloom',
    palette: ['flower', 'leaf', 'vine'],
    growthStyle: 'radial',
    particleBias: 'flower',
    animationSpeed: 1.05,
    windStrength: 0.42,
    spatialLayout: 'radial-burst',
    rhythm: 0.92,
    contrast: 0.78,
    hardResetOnChange: false,
    accentChars: ['✦', '✧', '*'],
  },
  mycelium: {
    id: 'mycelium',
    name: 'Mycelium',
    characterSet: ['.', ',', "'", '`', ':', ';', '°', '·', '◌'],
    density: 0.72,
    motionStyle: 'swarm-drift',
    growthBehavior: 'network-mycelium',
    particleBehavior: 'Floating spore clouds with swarm drift and delay trails',
    bloomBehavior: 'Cluster bloom into organic clouds',
    decayBehavior: 'fragment-cloud',
    colorPalette: ['#b8b8a0', '#989880', '#d8d8c0', '#888870'],
    species: 'spore',
    palette: ['spore', 'moss', 'root'],
    growthStyle: 'network',
    particleBias: 'spore',
    animationSpeed: 0.55,
    windStrength: 0.22,
    spatialLayout: 'network-cloud',
    rhythm: 0.48,
    contrast: 0.52,
    hardResetOnChange: false,
    accentChars: ['·', '◌', '°'],
  },
  mutation: {
    id: 'mutation',
    name: 'Mutation',
    characterSet: ['#', '@', '%', 'x', 'X', '*', '+', '░', '▒', '▓'],
    density: 0.9,
    motionStyle: 'glitch-symmetry',
    growthBehavior: 'crystal-facet',
    particleBehavior: 'Glitch fragments and distortion decay artifacts',
    bloomBehavior: 'Chaotic burst with rough edges',
    decayBehavior: 'distort-decay',
    colorPalette: ['#a0ff80', '#80d060', '#c0ff90', '#608040'],
    species: 'spore',
    palette: ['bark', 'stone', 'wind', 'spore'],
    growthStyle: 'cascade',
    particleBias: 'wind',
    animationSpeed: 0.95,
    windStrength: 0.65,
    spatialLayout: 'chaotic-scatter',
    rhythm: 0.88,
    contrast: 0.88,
    hardResetOnChange: true,
    accentChars: ['#', '@', 'X'],
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    characterSet: ['.', ',', "'", '`', ':', ';', '~', '°', '◌', '○', '░', '▒'],
    density: 0.48,
    motionStyle: 'breathing',
    growthBehavior: 'slow-vine',
    particleBehavior: 'Soft moss spores with gentle drift',
    bloomBehavior: 'Wide frond expansion with soft pulsing',
    decayBehavior: 'gentle-unfurl',
    colorPalette: ['#5a8f5a', '#7cb87c', '#98c898', '#3a6f3a'],
    species: 'fern',
    palette: ['leaf', 'grass', 'vine', 'moss'],
    growthStyle: 'upward',
    particleBias: 'leaf',
    animationSpeed: 0.42,
    windStrength: 0.38,
    spatialLayout: 'wide-organic',
    rhythm: 0.32,
    contrast: 0.42,
    hardResetOnChange: false,
    accentChars: ['(', ')', '~'],
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    characterSet: ['~', '.', ',', ':', ';', '◌', '○', '░', '▒', '°'],
    density: 0.38,
    motionStyle: 'horizon-wave',
    growthBehavior: 'field-wave',
    particleBehavior: 'Atmospheric spores with long reverb trails',
    bloomBehavior: 'Wide horizontal reef bloom',
    decayBehavior: 'atmospheric-fade',
    colorPalette: ['#ff9090', '#ffb0a0', '#ffd0c8', '#ff7070'],
    species: 'crystal',
    palette: ['water', 'spore', 'stone', 'flower'],
    growthStyle: 'network',
    particleBias: 'water',
    animationSpeed: 0.35,
    windStrength: 0.28,
    spatialLayout: 'horizon-wide',
    rhythm: 0.28,
    contrast: 0.38,
    hardResetOnChange: false,
    accentChars: ['~', '◌', '○'],
  },
  vine: {
    id: 'vine',
    name: 'Vine',
    characterSet: ['.', ',', "'", '`', ':', ';', '~', '°', '◌', '○', '░', '▒'],
    density: 0.44,
    motionStyle: 'breathing',
    growthBehavior: 'slow-vine',
    particleBehavior: 'Drifting pollen with soft branch trails',
    bloomBehavior: 'Slow curling vine expansion',
    decayBehavior: 'gentle-unfurl',
    colorPalette: ['#7cb87c', '#98c898', '#5a985a', '#b8d8b8'],
    species: 'vine',
    palette: ['vine', 'leaf', 'root', 'grass'],
    growthStyle: 'network',
    particleBias: 'wind',
    animationSpeed: 0.48,
    windStrength: 0.52,
    spatialLayout: 'network-drape',
    rhythm: 0.38,
    contrast: 0.44,
    hardResetOnChange: false,
    accentChars: ['~', '^', '|'],
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal',
    characterSet: ['+', 'x', 'X', '/', '\\', '<', '>', '{', '}', '[', ']', '◆', '◇'],
    density: 0.68,
    motionStyle: 'glitch-symmetry',
    growthBehavior: 'crystal-facet',
    particleBehavior: 'Sparkle facets on velocity, resonance shimmer',
    bloomBehavior: 'Sharp symmetrical facet burst',
    decayBehavior: 'shatter-fade',
    colorPalette: ['#80d0ff', '#a0e8ff', '#60b8e0', '#c0f0ff'],
    species: 'crystal',
    palette: ['stone', 'water', 'wind', 'spore'],
    growthStyle: 'radial',
    particleBias: 'water',
    animationSpeed: 0.72,
    windStrength: 0.18,
    spatialLayout: 'symmetric-radial',
    rhythm: 0.68,
    contrast: 0.72,
    hardResetOnChange: false,
    accentChars: ['◆', '◇', '+'],
  },
  'juno-flowers': {
    id: 'juno-flowers',
    name: 'Juno Flowers',
    characterSet: ['*', '+', '✦', '✧', '^', '/', '\\', '|', '<', '>', '○', '●'],
    density: 0.58,
    motionStyle: 'burst-rhythm',
    growthBehavior: 'fast-bloom',
    particleBehavior: 'Rhythmic petal shimmer and star bursts',
    bloomBehavior: 'Large flower cross opens on sustain',
    decayBehavior: 'quick-petal',
    colorPalette: ['#c9a0dc', '#e0b8f0', '#a880c8', '#f0d0ff'],
    species: 'flower',
    palette: ['flower', 'leaf', 'spore', 'water'],
    growthStyle: 'radial',
    particleBias: 'flower',
    animationSpeed: 0.88,
    windStrength: 0.32,
    spatialLayout: 'radial-burst',
    rhythm: 0.82,
    contrast: 0.68,
    hardResetOnChange: false,
    accentChars: ['✧', '✦', '●'],
  },
};

export function getPresetVisualTheme(presetId: string, presetName: string): PresetVisualThemeDefinition {
  const theme = PRESET_VISUAL_THEMES[presetId];
  if (theme) {
    return { ...theme, name: presetName };
  }
  return { ...PRESET_VISUAL_THEMES.seed, id: presetId, name: presetName };
}

export function toPresetTheme(def: PresetVisualThemeDefinition): PresetTheme {
  return {
    id: def.id,
    name: def.name,
    characterSet: def.characterSet,
    density: def.density,
    motionStyle: def.motionStyle,
    growthBehavior: def.growthBehavior,
    particleBehavior: def.particleBehavior,
    bloomBehavior: def.bloomBehavior,
    decayBehavior: def.decayBehavior,
    colorPalette: def.colorPalette,
    species: def.species,
    palette: def.palette,
    accentChars: def.accentChars,
    growthStyle: def.growthStyle,
    particleBias: def.particleBias,
    animationSpeed: def.animationSpeed,
    windStrength: def.windStrength,
    spatialLayout: def.spatialLayout,
    rhythm: def.rhythm,
    contrast: def.contrast,
    hardResetOnChange: def.hardResetOnChange,
    colorHint: def.colorPalette[0] ?? '#8fbc8f',
  };
}

export function resolvePresetTheme(presetId: string, presetName: string): PresetTheme {
  return toPresetTheme(getPresetVisualTheme(presetId, presetName));
}

export function listPresetVisualThemes(): PresetVisualThemeDefinition[] {
  return Object.values(PRESET_VISUAL_THEMES);
}

export function speciesForOscillator(type: string): PlantSpecies {
  const map: Record<string, PlantSpecies> = {
    analog: 'vine',
    fm: 'crystal',
    granular: 'spore',
    noise: 'moss',
    pad: 'flower',
    bass: 'trunk',
    lead: 'bloom',
  };
  return map[type] ?? 'vine';
}

export function fallbackTheme(): PresetTheme {
  return resolvePresetTheme('seed', 'Seed');
}
