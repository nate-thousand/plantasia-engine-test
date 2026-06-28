import { pickChar, pickFromCategories } from './CharacterPalette';
import {
  midiToHorizontalPosition,
  midiToVerticalPosition,
  velocityToBrightness,
  velocityToGrowthSpeed,
} from './NoteEvents';
import { speciesForOscillator } from './PresetThemes';
import { pickFromThemePalette, pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import {
  themeAttackMultiplier,
  themeBranchAngle,
  themeReleaseRate,
  themeResonanceBranch,
  themeSegmentTarget,
  themeSwayAmplitude,
  themeVerticalBias,
} from './ThemeBehaviors';
import {
  getThemeReactiveProfile,
  themePlantGrowthBoost,
} from './ThemeReactiveBehavior';
import type { AudioVizFeedback } from '../audio/visualization/AudioTap';
import type {
  BranchSegment,
  NoteSpawnEvent,
  PlantInstance,
  PlantSpecies,
  PresetTheme,
  SoundVizParams,
} from './types';

let plantIdCounter = 0;

function nextPlantId(): string {
  plantIdCounter += 1;
  return `plant-${plantIdCounter}`;
}

export function resolveSpecies(
  theme: PresetTheme,
  sound: SoundVizParams,
): PlantSpecies {
  if (sound.mutation > 60) {
    return 'spore';
  }
  return speciesForOscillator(sound.oscillatorType) ?? theme.species;
}

export function spawnPlant(
  event: NoteSpawnEvent,
  theme: PresetTheme,
  sound: SoundVizParams,
  gridWidth: number,
  gridHeight: number,
): PlantInstance {
  const species = resolveSpecies(theme, sound);
  const x = midiToHorizontalPosition(event.midi, event.pan, gridWidth);
  const y = midiToVerticalPosition(event.midi, gridHeight);

  return {
    id: nextPlantId(),
    midi: event.midi,
    velocity: event.velocity,
    x,
    y,
    pan: event.pan,
    species,
    phase: 'growing',
    age: 0,
    growth: 0,
    brightness: velocityToBrightness(event.velocity),
    segments: buildInitialSegments(x, y, species, theme, event.midi, event.velocity),
    releaseProgress: 0,
  };
}

function buildInitialSegments(
  x: number,
  y: number,
  species: PlantSpecies,
  theme: PresetTheme,
  midi: number,
  velocity: number,
): BranchSegment[] {
  const segments: BranchSegment[] = [];
  const seed = midi * 7 + x * 3 + y;

  segments.push({
    x,
    y,
    char: pickThemeChar(theme, seed),
    angle: themeVerticalBias(theme) > 0 ? Math.PI / 2 : -Math.PI / 2,
  });

  let length: number;
  switch (theme.growthBehavior) {
    case 'downward-root':
      length = 6 + Math.round(velocity / 40);
      break;
    case 'fast-bloom':
      length = 2 + Math.round(velocity / 50);
      break;
    case 'seed-arc':
      length = 2;
      break;
    case 'crystal-facet':
      length = 4;
      break;
    case 'field-wave':
      length = 3;
      break;
    case 'moss-crawl':
      length = 5;
      break;
    default:
      length = species === 'trunk' ? 5 : species === 'vine' ? 4 : 3;
  }

  const verticalBias = themeVerticalBias(theme);

  for (let i = 1; i <= length; i += 1) {
    const angle =
      (verticalBias > 0 ? Math.PI / 2 : -Math.PI / 2) +
      Math.sin(seed + i) * (theme.growthBehavior === 'crystal-facet' ? 0.05 : 0.4);

    const dx = Math.round(Math.cos(angle) * i * 0.8);
    const dy = Math.round(Math.sin(angle) * i * (verticalBias > 0 ? 0.9 : -0.9));

    segments.push({
      x: x + dx,
      y: y + dy,
      char: pickFromThemePalette(theme, seed + i),
      angle,
    });
  }

  if (theme.growthBehavior === 'fast-bloom' && velocity > 60) {
    const tip = segments[segments.length - 1];
    if (tip) {
      for (let b = 0; b < 4; b += 1) {
        const bloomAngle = (b / 4) * Math.PI * 2;
        segments.push({
          x: tip.x + Math.round(Math.cos(bloomAngle)),
          y: tip.y + Math.round(Math.sin(bloomAngle)),
          char: pickThemeAccent(theme, seed + b),
          angle: bloomAngle,
        });
      }
    }
  }

  return segments;
}

export function updatePlant(
  plant: PlantInstance,
  dt: number,
  sound: SoundVizParams,
  theme: PresetTheme,
  gridWidth: number,
  gridHeight: number,
  reduceMotion: boolean,
  audio?: AudioVizFeedback,
): void {
  plant.age += dt;

  const profile = getThemeReactiveProfile(theme.visualMetadata);
  const silentAudio: AudioVizFeedback = {
    amplitude: 0,
    peak: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    brightness: 0,
    isActive: false,
    spectrum: [],
    waveform: [],
  };
  const reactiveBoost = themePlantGrowthBoost(
    profile,
    plant.midi,
    plant.velocity,
    audio ?? silentAudio,
  );

  const growthSpeed =
    velocityToGrowthSpeed(plant.velocity) *
    themeAttackMultiplier(theme, sound.attack) *
    theme.animationSpeed *
    reactiveBoost *
    (0.5 + sound.growthRate / 100);

  if (plant.phase === 'growing') {
    plant.growth = Math.min(1, plant.growth + dt * growthSpeed * 0.8);

    if (plant.growth >= 1) {
      plant.phase = 'sustain';
    }

    expandBranches(plant, theme, sound, gridWidth, gridHeight);
  }

  if (plant.phase === 'sustain') {
    swayPlant(plant, theme, sound, reduceMotion);
    maybeBranch(plant, theme, sound);
  }

  if (plant.phase === 'releasing') {
    const releaseRate = themeReleaseRate(theme, sound.release, reduceMotion);
    plant.releaseProgress = Math.min(1, plant.releaseProgress + dt * releaseRate);

    if (plant.releaseProgress >= 1) {
      plant.phase = 'faded';
    }
  }
}

function expandBranches(
  plant: PlantInstance,
  theme: PresetTheme,
  sound: SoundVizParams,
  gridWidth: number,
  gridHeight: number,
): void {
  const targetSegments = themeSegmentTarget(theme, sound, plant.growth);

  while (plant.segments.length < targetSegments) {
    const last = plant.segments[plant.segments.length - 1];
    if (!last) {
      break;
    }

    const seed = plant.midi + plant.segments.length * 13;
    const branchAngle = themeBranchAngle(theme, last.angle, sound, seed);
    const nx = Math.max(1, Math.min(gridWidth - 2, last.x + Math.round(Math.cos(branchAngle))));
    const ny = Math.max(1, Math.min(gridHeight - 2, last.y + Math.round(Math.sin(branchAngle))));

    plant.segments.push({
      x: nx,
      y: ny,
      char: pickFromThemePalette(theme, seed),
      angle: branchAngle,
    });
  }
}

function swayPlant(
  plant: PlantInstance,
  theme: PresetTheme,
  sound: SoundVizParams,
  reduceMotion: boolean,
): void {
  if (reduceMotion) {
    return;
  }

  const sway = themeSwayAmplitude(theme, sound);

  for (const [index, segment] of plant.segments.entries()) {
    switch (theme.motionStyle) {
      case 'heavy-pulse':
        segment.x += Math.round(Math.sin(plant.age * 8) * sway * (index === 0 ? 0.3 : 0.1));
        break;
      case 'glitch-symmetry':
        if (Math.random() > 0.95) {
          segment.x += Math.round((Math.random() - 0.5) * 2);
        } else {
          segment.x += Math.round(Math.sin(plant.age * 2 + index) * sway);
        }
        break;
      case 'horizon-wave':
        segment.y += Math.round(Math.sin(plant.age + index * 0.3) * sway * 0.5);
        segment.x += Math.round(Math.cos(plant.age * 0.5) * sway);
        break;
      default:
        segment.x += Math.round(Math.sin(plant.age * 2 + index) * sway);
    }
  }
}

function maybeBranch(plant: PlantInstance, theme: PresetTheme, sound: SoundVizParams): void {
  const branchChance = themeResonanceBranch(theme, sound.resonance);
  if (sound.resonance < 30 || Math.random() > branchChance) {
    return;
  }

  const anchor = plant.segments[Math.floor(plant.segments.length / 2)];
  if (!anchor) {
    return;
  }

  const angle = themeBranchAngle(theme, anchor.angle, sound, plant.midi + plant.segments.length);
  plant.segments.push({
    x: anchor.x + Math.round(Math.cos(angle) * 2),
    y: anchor.y + Math.round(Math.sin(angle) * 2),
    char: pickThemeAccent(theme, plant.midi + plant.segments.length),
    angle,
  });
}

export function releasePlant(plant: PlantInstance): void {
  if (plant.phase !== 'faded') {
    plant.phase = 'releasing';
  }
}

export function isPlantVisible(plant: PlantInstance): boolean {
  return plant.phase !== 'faded';
}

export function drawPlantSegments(
  plant: PlantInstance,
  sound: SoundVizParams,
  audio: AudioVizFeedback,
  theme: PresetTheme,
): BranchSegment[] {
  if (plant.phase === 'faded') {
    return [];
  }

  const opacity = plant.phase === 'releasing' ? 1 - plant.releaseProgress : 1;
  if (opacity <= 0.05) {
    return [];
  }

  const count = plant.phase === 'releasing'
    ? Math.max(1, Math.floor(plant.segments.length * (1 - plant.releaseProgress)))
    : plant.segments.length;

  const audioBright = plant.brightness * (0.4 + audio.amplitude * 0.9 + audio.peak * 0.4);
  const openness = 0.5 + (sound.filterCutoff / 100) * 0.5;

  return plant.segments.slice(0, count).map((segment, index) => {
    const bright = audioBright * openness + audio.brightness * 0.3;
    const isTip = index === count - 1;
    const isRoot = index === 0;

    let char = segment.char;

    switch (theme.growthBehavior) {
      case 'fast-bloom':
        if (bright > 0.7 && isTip) {
          char = pickThemeAccent(theme, plant.midi + index + Math.round(audio.peak * 10));
        } else if (isTip) {
          char = pickThemeChar(theme, plant.midi + index);
        }
        break;
      case 'crystal-facet':
        if (bright > 0.6 || sound.resonance > 50) {
          char = pickThemeAccent(theme, plant.midi + index + Math.round(sound.resonance));
        }
        if (audio.treble > 0.4 && index % 2 === 0) {
          char = pickThemeChar(theme, plant.midi + index + 7);
        }
        break;
      case 'downward-root':
        if (audio.bass > 0.35 && isRoot) {
          char = pickThemeChar(theme, plant.midi);
        } else if (isTip) {
          char = pickFromCategories(theme.palette, plant.midi + index);
        }
        break;
      case 'seed-arc':
        if (isTip && bright > 0.5) {
          char = pickThemeAccent(theme, plant.midi + index);
        }
        break;
      case 'moss-crawl':
        if (sound.distortion > 0.3 && Math.random() > 0.7) {
          char = pickChar('bark', plant.midi + index);
        }
        break;
      default:
        if (bright > 0.85 && isTip) {
          char = pickThemeAccent(theme, plant.midi + index);
        } else if (bright > 0.65 && isTip) {
          char = pickThemeChar(theme, plant.midi + index);
        }
    }

    if (theme.decayBehavior === 'distort-decay' && plant.phase === 'releasing') {
      char = pickChar('bark', plant.midi + index + Math.round(plant.releaseProgress * 10));
    }

    return { ...segment, char };
  });
}

export function resetPlantGenerator(): void {
  plantIdCounter = 0;
}
