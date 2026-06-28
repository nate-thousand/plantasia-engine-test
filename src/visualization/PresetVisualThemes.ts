import { resolveReleasePresetThemeKey } from './releasePresetThemes';
import type { PlantasiaPreset } from 'plantasia-sound-engine';
import { findPresetById } from '../presets/engineRegistry';
import { extractVisualMetadata } from '../presets/presetMetadata';
import type { PresetVisualMetadata } from '../presets/types';
import type {
  CharacterCategory,
  DecayBehavior,
  GrowthBehavior,
  MotionStyle,
  PlantSpecies,
  PresetTheme,
  SpatialLayout,
} from './types';

/** Visual theme definition derived from engine metadata — never keyed by preset id. */
export type PresetVisualThemeDefinition = {
  id: string;
  name: string;
  asciiState: string;
  engineSpecies: string;
  category: string | null;
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
  visualMetadata: PresetVisualMetadata;
};

type ThemeTemplate = Omit<PresetVisualThemeDefinition, 'id' | 'name' | 'asciiState' | 'engineSpecies' | 'category' | 'visualMetadata'>;

const THEME_TEMPLATES: Record<string, ThemeTemplate> = {
  seed: {
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
    characterSet: ['~', '^', '|', '/', '\\', '╲', '╱', '⌇', '⌯', '≈', '∿', '◠'],
    density: 0.52,
    motionStyle: 'horizon-wave',
    growthBehavior: 'slow-vine',
    particleBehavior: 'Draping tendrils with downward pollen trails',
    bloomBehavior: 'Vertical canopy drape with curling tendrils',
    decayBehavior: 'slow-drape',
    colorPalette: ['#4a7a3a', '#6b9a52', '#8cb870', '#2a5020'],
    species: 'vine',
    palette: ['vine', 'leaf', 'root', 'grass'],
    growthStyle: 'cascade',
    particleBias: 'vine',
    animationSpeed: 0.55,
    windStrength: 0.62,
    spatialLayout: 'network-drape',
    rhythm: 0.42,
    contrast: 0.52,
    hardResetOnChange: false,
    accentChars: ['~', '⌯', '╱'],
  },
  crystal: {
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
  juno: {
    characterSet: ['*', '+', '✦', '✧', '○', '●', '◦', '·', '❀', '✿', '❁', '⌇'],
    density: 0.64,
    motionStyle: 'burst-rhythm',
    growthBehavior: 'fast-bloom',
    particleBehavior: 'Rhythmic petal shimmer with meadow cross-patterns',
    bloomBehavior: 'Large meadow flower grid opens on sustain',
    decayBehavior: 'quick-petal',
    colorPalette: ['#c9a0dc', '#e0b8f0', '#a880c8', '#f0d0ff', '#9060b0'],
    species: 'flower',
    palette: ['flower', 'leaf', 'spore', 'water'],
    growthStyle: 'radial',
    particleBias: 'flower',
    animationSpeed: 0.92,
    windStrength: 0.28,
    spatialLayout: 'meadow-grid',
    rhythm: 0.78,
    contrast: 0.64,
    hardResetOnChange: false,
    accentChars: ['✧', '❀', '●'],
  },
  plantasonic: {
    characterSet: ['~', '≈', '∿', '◠', '◡', '●', '○', '·', '∘', '░', '▒', '✦'],
    density: 0.56,
    motionStyle: 'breathing',
    growthBehavior: 'slow-vine',
    particleBehavior: 'Warm analog shimmer with lush harmonic drift',
    bloomBehavior: 'Wide evolving bloom with stereo motion',
    decayBehavior: 'atmospheric-fade',
    colorPalette: ['#d4a574', '#8fbc8f', '#c9a0dc', '#f0e6d2', '#a880c8'],
    species: 'flower',
    palette: ['flower', 'vine', 'grass', 'water'],
    growthStyle: 'network',
    particleBias: 'flower',
    animationSpeed: 0.62,
    windStrength: 0.36,
    spatialLayout: 'horizon-wide',
    rhythm: 0.58,
    contrast: 0.62,
    hardResetOnChange: false,
    accentChars: ['✦', '≈', '∿'],
  },
  moss: {
    characterSet: ['░', '▒', '▓', '·', '°', '◌', ':', ';', "'", '`', '∘'],
    density: 0.42,
    motionStyle: 'breathing',
    growthBehavior: 'seed-arc',
    particleBehavior: 'Creeping spore clusters with soft damp spread',
    bloomBehavior: 'Small organic clusters layer outward',
    decayBehavior: 'gentle-unfurl',
    colorPalette: ['#3a5a3a', '#5a7a52', '#7a9a6a', '#2a4028'],
    species: 'moss',
    palette: ['moss', 'grass', 'seed', 'root'],
    growthStyle: 'network',
    particleBias: 'moss',
    animationSpeed: 0.32,
    windStrength: 0.08,
    spatialLayout: 'sparse-vertical',
    rhythm: 0.28,
    contrast: 0.38,
    hardResetOnChange: false,
    accentChars: ['▒', '·', '°'],
  },
  roots: {
    characterSet: ['█', '▓', '▒', '░', '|', '/', '\\', '#', '%', '@', '╲', '╱'],
    density: 0.9,
    motionStyle: 'heavy-pulse',
    growthBehavior: 'downward-root',
    particleBehavior: 'Underground branch fragments on bass pulses',
    bloomBehavior: 'Fractal root network extends downward',
    decayBehavior: 'slow-root',
    colorPalette: ['#3a2a20', '#5a4030', '#7a5840', '#2a1a12'],
    species: 'trunk',
    palette: ['root', 'bark', 'stone', 'moss'],
    growthStyle: 'cascade',
    particleBias: 'root',
    animationSpeed: 0.32,
    windStrength: 0.06,
    spatialLayout: 'ground-heavy',
    rhythm: 0.3,
    contrast: 0.85,
    hardResetOnChange: false,
    accentChars: ['█', '╱', '#'],
  },
  canopy: {
    characterSet: ['(', ')', '~', '≈', '◠', '◡', '·', '°', '░', '▒', '∿', '⌇'],
    density: 0.5,
    motionStyle: 'horizon-wave',
    growthBehavior: 'slow-vine',
    particleBehavior: 'Leaf sway and wind ripples across wide canopy',
    bloomBehavior: 'Branch arms extend with gentle oscillation',
    decayBehavior: 'gentle-unfurl',
    colorPalette: ['#4a7a48', '#6a9a62', '#8aba82', '#3a5a38'],
    species: 'fern',
    palette: ['leaf', 'grass', 'vine', 'wind'],
    growthStyle: 'upward',
    particleBias: 'leaf',
    animationSpeed: 0.4,
    windStrength: 0.55,
    spatialLayout: 'wide-organic',
    rhythm: 0.35,
    contrast: 0.48,
    hardResetOnChange: false,
    accentChars: ['≈', '◠', '~'],
  },
  rainforest: {
    characterSet: ['~', '^', '|', '/', '\\', '╲', '╱', '≈', '∿', '◠', '·', '°'],
    density: 0.82,
    motionStyle: 'swarm-drift',
    growthBehavior: 'network-mycelium',
    particleBehavior: 'Rain streaks and vine tendrils with constant drift',
    bloomBehavior: 'Layered vegetation density on velocity',
    decayBehavior: 'fragment-cloud',
    colorPalette: ['#2a5a32', '#3a7a42', '#5a9a52', '#1a4020'],
    species: 'vine',
    palette: ['vine', 'leaf', 'water', 'grass'],
    growthStyle: 'network',
    particleBias: 'vine',
    animationSpeed: 0.72,
    windStrength: 0.58,
    spatialLayout: 'network-drape',
    rhythm: 0.55,
    contrast: 0.62,
    hardResetOnChange: false,
    accentChars: ['≈', '╱', '~'],
  },
  desert: {
    characterSet: ['.', ':', ';', '·', '°', '|', '/', '\\', '╱', '╲', '░', '▒'],
    density: 0.26,
    motionStyle: 'horizon-wave',
    growthBehavior: 'field-wave',
    particleBehavior: 'Heat shimmer and sparse sand drift',
    bloomBehavior: 'Minimal cactus spikes on attack',
    decayBehavior: 'atmospheric-fade',
    colorPalette: ['#c8a870', '#e8c890', '#a88850', '#f0d8a0'],
    species: 'crystal',
    palette: ['stone', 'wind', 'seed', 'bark'],
    growthStyle: 'radial',
    particleBias: 'wind',
    animationSpeed: 0.22,
    windStrength: 0.42,
    spatialLayout: 'horizon-wide',
    rhythm: 0.18,
    contrast: 0.32,
    hardResetOnChange: false,
    accentChars: ['·', '╱', ':'],
  },
  winter: {
    characterSet: ['*', '+', '·', '°', '∘', '○', '◦', '❄', '✧', '✦', '░', '▒'],
    density: 0.36,
    motionStyle: 'glitch-symmetry',
    growthBehavior: 'crystal-facet',
    particleBehavior: 'Drifting snowflakes and ice crystal shimmer',
    bloomBehavior: 'Long-note snow trails on sustain',
    decayBehavior: 'shatter-fade',
    colorPalette: ['#c8e8ff', '#a0d0f0', '#e8f4ff', '#88b8e0'],
    species: 'crystal',
    palette: ['water', 'wind', 'spore', 'stone'],
    growthStyle: 'radial',
    particleBias: 'water',
    animationSpeed: 0.28,
    windStrength: 0.22,
    spatialLayout: 'symmetric-radial',
    rhythm: 0.22,
    contrast: 0.42,
    hardResetOnChange: false,
    accentChars: ['❄', '✧', '°'],
  },
  'night-bloom': {
    characterSet: ['*', '+', '✦', '✧', '·', '°', '∘', '○', '●', '◦', '❋', '⌇'],
    density: 0.54,
    motionStyle: 'breathing',
    growthBehavior: 'fast-bloom',
    particleBehavior: 'Firefly glow pulses and slow vine drift',
    bloomBehavior: 'Dark flowers open with moonlit shimmer',
    decayBehavior: 'atmospheric-fade',
    colorPalette: ['#2a1848', '#4a2878', '#8060a8', '#c8a0e8', '#f0d8ff'],
    species: 'flower',
    palette: ['flower', 'vine', 'spore', 'water'],
    growthStyle: 'radial',
    particleBias: 'spore',
    animationSpeed: 0.38,
    windStrength: 0.18,
    spatialLayout: 'meadow-grid',
    rhythm: 0.42,
    contrast: 0.52,
    hardResetOnChange: false,
    accentChars: ['✧', '●', '❋'],
  },
};

/** Keys registered in the host ASCII theme template map. */
export const THEME_TEMPLATE_KEYS = Object.keys(THEME_TEMPLATES) as (keyof typeof THEME_TEMPLATES)[];

/** Returns a user-visible warning when visual.asciiTheme is unknown to the host. */
export function describeThemeResolution(preset: PlantasiaPreset): string | null {
  const raw = preset as PlantasiaPreset & Record<string, unknown>;
  const visual = extractVisualMetadata(preset, raw);
  const requested = visual.asciiTheme;

  if (requested && !(requested in THEME_TEMPLATES)) {
    const fallback = selectThemeTemplateKey(preset);
    return `Theme "${requested}" is not registered — using "${String(fallback)}" instead.`;
  }

  return null;
}

/** Resolve visual template key from a resolved PresetTheme (idle painters, overlays). */
export function resolveThemeTemplateKeyFromTheme(theme: PresetTheme): string {
  const releaseKey = resolveReleasePresetThemeKey(theme.id, '');
  if (releaseKey && releaseKey in THEME_TEMPLATES) {
    return releaseKey;
  }

  const fromMeta = theme.visualMetadata?.asciiTheme;
  if (fromMeta && fromMeta in THEME_TEMPLATES) {
    return fromMeta;
  }

  switch (theme.asciiState) {
    case 'seed':
      return 'seed';
    case 'growth':
      return theme.engineSpecies === 'Fern' ? 'fern' : 'root';
    case 'bloom':
      if (theme.engineSpecies === 'Crystal') {
        return 'crystal';
      }
      if (theme.engineSpecies === 'Juno Flowers') {
        return 'juno';
      }
      return 'bloom';
    case 'mutation':
      return 'mutation';
    case 'mycelium':
      return theme.engineSpecies === 'Vine' ? 'vine' : 'mycelium';
    case 'ecosystem':
      return theme.engineSpecies === 'Plantasonic' ? 'plantasonic' : 'coral';
    default:
      return 'seed';
  }
}

function selectThemeTemplateKey(preset: PlantasiaPreset): keyof typeof THEME_TEMPLATES {
  const releaseKey = resolveReleasePresetThemeKey(preset.id, '');
  if (releaseKey && releaseKey in THEME_TEMPLATES) {
    return releaseKey as keyof typeof THEME_TEMPLATES;
  }

  const raw = preset as PlantasiaPreset & Record<string, unknown>;
  const visual = extractVisualMetadata(preset, raw);
  const themeKey = visual.asciiTheme as keyof typeof THEME_TEMPLATES | undefined;
  if (themeKey && themeKey in THEME_TEMPLATES) {
    return themeKey;
  }

  const state = preset.asciiState;
  const species = preset.species;

  switch (state) {
    case 'seed':
      return 'seed';
    case 'growth':
      return species === 'Fern' ? 'fern' : 'root';
    case 'bloom':
      if (species === 'Crystal') {
        return 'crystal';
      }
      if (species === 'Juno Flowers') {
        return 'juno';
      }
      return 'bloom';
    case 'mutation':
      return 'mutation';
    case 'mycelium':
      return species === 'Vine' ? 'vine' : 'mycelium';
    case 'ecosystem':
      return species === 'Plantasonic' ? 'plantasonic' : 'coral';
    default:
      return 'seed';
  }
}

function applyVisualMetadataOverrides(
  template: ThemeTemplate,
  visual: PresetVisualMetadata,
): ThemeTemplate {
  const next = { ...template };

  if (visual.colorPalette?.length) {
    next.colorPalette = [...visual.colorPalette];
  }

  if (visual.motionStyle ?? visual.motion) {
    const motion = (visual.motionStyle ?? visual.motion) as MotionStyle;
    if (Object.values(THEME_TEMPLATES).some((t) => t.motionStyle === motion)) {
      next.motionStyle = motion;
    }
  }

  if (visual.visualIntensity != null) {
    const scale = 0.65 + visual.visualIntensity * 0.7;
    next.density = Math.min(1, next.density * scale);
    next.contrast = Math.min(1, next.contrast * scale);
    next.animationSpeed *= 0.75 + visual.visualIntensity * 0.5;
  }

  if (visual.animationStyle === 'slow') {
    next.animationSpeed *= 0.75;
  } else if (visual.animationStyle === 'fast') {
    next.animationSpeed *= 1.25;
  }

  return next;
}

/** Resolve a visual theme from engine preset metadata — no hardcoded preset ids. */
export function getPresetVisualTheme(
  preset: PlantasiaPreset,
  category: string | null = null,
): PresetVisualThemeDefinition {
  const raw = preset as PlantasiaPreset & Record<string, unknown>;
  const visual = extractVisualMetadata(preset, raw);
  const templateKey = selectThemeTemplateKey(preset);
  const template = applyVisualMetadataOverrides(
    THEME_TEMPLATES[templateKey] ?? THEME_TEMPLATES.seed,
    visual,
  );

  return {
    ...template,
    id: preset.id,
    name: preset.name,
    asciiState: preset.asciiState,
    engineSpecies: preset.species,
    category: category ?? (typeof raw.category === 'string' ? raw.category : null),
    visualMetadata: visual,
  };
}

export function getPresetVisualThemeById(
  presetId: string,
  presetName: string,
): PresetVisualThemeDefinition {
  const preset = findPresetById(presetId);
  if (preset) {
    return getPresetVisualTheme(preset);
  }

  return {
    ...THEME_TEMPLATES.seed,
    id: presetId,
    name: presetName,
    asciiState: 'seed',
    engineSpecies: 'Moss',
    category: null,
    visualMetadata: {},
  };
}

export function toPresetTheme(def: PresetVisualThemeDefinition): PresetTheme {
  return {
    id: def.id,
    name: def.name,
    asciiState: def.asciiState,
    engineSpecies: def.engineSpecies,
    category: def.category,
    visualMetadata: def.visualMetadata,
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

export function resolvePresetTheme(preset: PlantasiaPreset, category?: string | null): PresetTheme;
export function resolvePresetTheme(presetId: string, presetName: string): PresetTheme;
export function resolvePresetTheme(
  presetOrId: PlantasiaPreset | string,
  categoryOrName?: string | null,
): PresetTheme {
  if (typeof presetOrId === 'string') {
    return toPresetTheme(getPresetVisualThemeById(presetOrId, categoryOrName ?? presetOrId));
  }

  return toPresetTheme(getPresetVisualTheme(presetOrId, categoryOrName ?? null));
}

export function listPresetVisualThemes(): PresetVisualThemeDefinition[] {
  return Object.keys(THEME_TEMPLATES).map((key) => ({
    ...THEME_TEMPLATES[key],
    id: key,
    name: key,
    asciiState: key,
    engineSpecies: '',
    category: null,
    visualMetadata: {},
  }));
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
    sine: 'vine',
    triangle: 'moss',
    sawtooth: 'flower',
    square: 'trunk',
  };
  return map[type] ?? 'vine';
}

export function fallbackTheme(): PresetTheme {
  const preset = findPresetById('seed');
  if (preset) {
    return resolvePresetTheme(preset);
  }
  return toPresetTheme(getPresetVisualThemeById('seed', 'Seed'));
}
