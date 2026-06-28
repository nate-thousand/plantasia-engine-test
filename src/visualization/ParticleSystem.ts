import { pickThemeChar, pickThemeAccent } from './ThemeCharacters';
import {
  themeDelayTrail,
  themeDistortionRoughness,
  themeNoteParticleCount,
  themeReverbAtmosphere,
} from './ThemeBehaviors';
import type { CharacterCategory, PresetTheme, SoundVizParams, VizParticle } from './types';
import { FEEDBACK_GAIN } from './VisualFeedback';

let particleIdCounter = 0;

export class ParticleSystem {
  private particles: VizParticle[] = [];
  private readonly maxParticles: number;

  constructor(maxParticles = 120) {
    this.maxParticles = maxParticles;
  }

  get count(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }

  spawnSpores(
    x: number,
    y: number,
    count: number,
    theme: PresetTheme,
    velocity: number,
  ): void {
    const themedCount = count > 0 ? count : themeNoteParticleCount(theme, velocity);

    for (let i = 0; i < themedCount; i += 1) {
      if (this.particles.length >= this.maxParticles) {
        break;
      }

      const { vx, vy } = themeParticleVelocity(theme, velocity);

      this.particles.push({
        x: x + themeSpreadX(theme, i),
        y: y + themeSpreadY(theme, i),
        vx,
        vy,
        char: pickThemeChar(theme, particleIdCounter++ + velocity + i),
        life: 0,
        maxLife: themeParticleLife(theme),
        category: theme.particleBias,
      });
    }
  }

  spawnEchoSeeds(x: number, y: number, delayWet: number, theme: PresetTheme): void {
    const trail = themeDelayTrail(theme, delayWet);
    if (trail < 0.5) {
      return;
    }

    const count = Math.round(trail);
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= this.maxParticles) {
        break;
      }

      const isFall = theme.motionStyle === 'seed-pop';
      this.particles.push({
        x: x + (Math.random() - 0.5) * 2,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: isFall ? 0.2 + Math.random() * 0.5 : -0.1 - Math.random() * 0.2,
        char: pickThemeChar(theme, particleIdCounter++ + i),
        life: 0,
        maxLife: 0.6 + delayWet * 2,
        category: 'seed',
      });
    }
  }

  spawnFallingLeaves(x: number, y: number, count: number, theme: PresetTheme): void {
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= this.maxParticles) {
        break;
      }

      this.particles.push({
        x: x + (Math.random() - 0.5) * 3,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: theme.motionStyle === 'heavy-pulse' ? 0.1 : 0.3 + Math.random() * 0.4,
        char: pickThemeChar(theme, particleIdCounter++ + i),
        life: 0,
        maxLife: theme.decayBehavior === 'slow-root' ? 3 + Math.random() : 1.5 + Math.random(),
        category: theme.particleBias,
      });
    }
  }

  spawnWindParticles(
    gridWidth: number,
    gridHeight: number,
    sound: SoundVizParams,
    theme: PresetTheme,
  ): void {
    if (sound.lfoRate < 0.05 || Math.random() > theme.windStrength * 0.3) {
      return;
    }

    if (this.particles.length >= this.maxParticles) {
      return;
    }

    const yBias = theme.spatialLayout === 'horizon-wide' ? gridHeight * 0.7 : gridHeight * 0.4;

    this.particles.push({
      x: Math.random() * gridWidth,
      y: Math.random() * yBias,
      vx: theme.windStrength * (0.5 + sound.lfoDepth),
      vy: theme.motionStyle === 'horizon-wave' ? Math.sin(particleIdCounter) * 0.05 : Math.sin(particleIdCounter) * 0.1,
      char: pickThemeChar(theme, particleIdCounter++),
      life: 0,
      maxLife: 1 + Math.random() * theme.rhythm,
      category: theme.particleBias,
    });
  }

  spawnReverbSpores(
    gridWidth: number,
    gridHeight: number,
    reverbWet: number,
    theme: PresetTheme,
  ): void {
    const rate = themeReverbAtmosphere(theme, reverbWet);
    if (rate < 0.5 || Math.random() > reverbWet) {
      return;
    }

    if (this.particles.length >= this.maxParticles) {
      return;
    }

    const y =
      theme.spatialLayout === 'horizon-wide'
        ? gridHeight * (0.5 + Math.random() * 0.3)
        : Math.random() * gridHeight;

    this.particles.push({
      x: Math.random() * gridWidth,
      y,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      char: pickThemeChar(theme, particleIdCounter++),
      life: 0,
      maxLife: 2 + reverbWet * 5,
      category: 'spore',
    });
  }

  spawnDistortionArtifacts(
    x: number,
    y: number,
    sound: SoundVizParams,
    theme: PresetTheme,
  ): void {
    const roughness = themeDistortionRoughness(theme, sound.distortion);
    if (roughness < 0.15 || Math.random() > roughness) {
      return;
    }

    if (this.particles.length >= this.maxParticles) {
      return;
    }

    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 2,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 0.8,
      char: pickThemeAccent(theme, particleIdCounter++),
      life: 0,
      maxLife: 0.4 + roughness,
      category: 'bark',
    });
  }

  update(
    dt: number,
    gridWidth: number,
    gridHeight: number,
    sound: SoundVizParams,
    theme: PresetTheme,
    reduceMotion: boolean,
  ): void {
    const speedScale = (reduceMotion ? 0.3 : 1) * FEEDBACK_GAIN;

    this.particles = this.particles.filter((particle) => {
      particle.life += dt;

      switch (theme.motionStyle) {
        case 'swarm-drift':
          particle.x += particle.vx * dt * 8 * speedScale;
          particle.y += particle.vy * dt * 8 * speedScale;
          particle.vx += (Math.random() - 0.5) * 0.02;
          particle.vy += (Math.random() - 0.5) * 0.02;
          break;
        case 'glitch-symmetry':
          particle.x += particle.vx * dt * 12 * speedScale;
          particle.y += particle.vy * dt * 12 * speedScale;
          if (Math.random() > 0.97) {
            particle.x += (Math.random() - 0.5) * 2;
          }
          break;
        case 'seed-pop':
          particle.x += particle.vx * dt * 10 * speedScale;
          particle.y += (particle.vy + 0.15) * dt * 10 * speedScale;
          break;
        case 'horizon-wave':
          particle.x += (particle.vx + Math.sin(particle.life * 2) * 0.08) * dt * 6 * speedScale;
          particle.y += particle.vy * dt * 4 * speedScale;
          break;
        case 'crawl-static':
          particle.x += particle.vx * dt * 3 * speedScale;
          particle.y += particle.vy * dt * 2 * speedScale;
          break;
        default:
          particle.x += particle.vx * dt * 10 * speedScale;
          particle.y += particle.vy * dt * 10 * speedScale;
      }

      if (particle.category === 'wind') {
        particle.x += Math.sin(particle.life * sound.lfoRate * 6) * 0.05 * sound.lfoDepth;
      }

      if (particle.category === 'water') {
        particle.y += Math.sin(particle.life * 4) * 0.02;
      }

      return (
        particle.life < particle.maxLife &&
        particle.x >= 0 &&
        particle.x < gridWidth &&
        particle.y >= 0 &&
        particle.y < gridHeight
      );
    });
  }

  list(): readonly VizParticle[] {
    return this.particles;
  }
}

function themeParticleVelocity(theme: PresetTheme, velocity: number): { vx: number; vy: number } {
  const v = velocity / 127;
  switch (theme.motionStyle) {
    case 'seed-pop':
      return {
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.1 + Math.random() * 0.8,
      };
    case 'heavy-pulse':
      return {
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.05 + Math.random() * 0.2,
      };
    case 'burst-rhythm':
      return {
        vx: (Math.random() - 0.5) * 1.5 * (0.5 + v),
        vy: -0.5 - Math.random() * 1.2 * v,
      };
    case 'swarm-drift':
      return {
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
      };
    case 'glitch-symmetry':
      return {
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + v),
        vy: (Math.random() - 0.5) * 0.8,
      };
    case 'horizon-wave':
      return {
        vx: 0.2 + Math.random() * 0.3,
        vy: (Math.random() - 0.5) * 0.15,
      };
    default:
      return {
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.2 - Math.random() * 0.6,
      };
  }
}

function themeSpreadX(theme: PresetTheme, index: number): number {
  switch (theme.spatialLayout) {
    case 'horizon-wide':
    case 'wide-organic':
      return (Math.random() - 0.5) * 6;
    case 'sparse-vertical':
      return (Math.random() - 0.5) * 1.5;
    case 'radial-burst':
    case 'symmetric-radial':
      return Math.cos(index) * 2;
    default:
      return (Math.random() - 0.5) * 2;
  }
}

function themeSpreadY(theme: PresetTheme, index: number): number {
  switch (theme.spatialLayout) {
    case 'ground-heavy':
      return Math.random() * 1.5;
    case 'radial-burst':
    case 'symmetric-radial':
      return Math.sin(index) * 2;
    default:
      return (Math.random() - 0.5) * 2;
  }
}

function themeParticleLife(theme: PresetTheme): number {
  switch (theme.decayBehavior) {
    case 'fast-fade':
      return 0.6 + Math.random();
    case 'atmospheric-fade':
      return 3 + Math.random() * 3;
    case 'slow-root':
      return 2.5 + Math.random() * 2;
    case 'fragment-cloud':
      return 1.5 + Math.random() * 2.5;
    default:
      return 1.2 + Math.random() * 2;
  }
}

export function categoryForEffect(
  effect: 'delay' | 'reverb' | 'chorus' | 'phaser' | 'distortion',
): CharacterCategory {
  switch (effect) {
    case 'delay':
      return 'seed';
    case 'reverb':
      return 'spore';
    case 'chorus':
      return 'leaf';
    case 'phaser':
      return 'water';
    case 'distortion':
      return 'bark';
    default:
      return 'spore';
  }
}
