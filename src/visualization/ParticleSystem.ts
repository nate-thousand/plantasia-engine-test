import { pickThemeChar, pickThemeAccent } from './ThemeCharacters';
import { FEEDBACK_GAIN, INTERACTION_FLARE_LAYERS } from './VisualFeedback';
import {
  themeDelayTrail,
  themeDistortionRoughness,
  themeNoteParticleCount,
  themeReverbAtmosphere,
} from './ThemeBehaviors';
import type { CharacterCategory, PresetTheme, SoundVizParams, VizParticle } from './types';

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
    force = false,
  ): void {
    const rate = themeReverbAtmosphere(theme, reverbWet);
    if (!force && (rate < 0.5 || Math.random() > reverbWet)) {
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

  /** Explosive multi-pattern burst for keyboard, slider, and MIDI interactions. */
  spawnInteractionFlare(
    x: number,
    y: number,
    intensity: number,
    theme: PresetTheme,
    gridWidth: number,
    gridHeight: number,
  ): void {
    for (let layer = 0; layer < INTERACTION_FLARE_LAYERS; layer += 1) {
      this.spawnInteractionFlareLayer(
        x + (layer - 1) * 2,
        y + layer,
        intensity,
        theme,
        gridWidth,
        gridHeight,
        layer,
      );
    }

    const anchors = [
      { x: Math.round(gridWidth * 0.15), y: Math.round(gridHeight * 0.2) },
      { x: Math.round(gridWidth * 0.85), y: Math.round(gridHeight * 0.25) },
      { x: Math.round(gridWidth * 0.5), y: Math.round(gridHeight * 0.85) },
    ];
    const norm = intensity / 127;
    if (norm > 0.2) {
      for (const anchor of anchors) {
        this.spawnInteractionFlareLayer(
          anchor.x,
          anchor.y,
          Math.round(intensity * 0.75),
          theme,
          gridWidth,
          gridHeight,
          0,
        );
      }
    }
  }

  private spawnInteractionFlareLayer(
    x: number,
    y: number,
    intensity: number,
    theme: PresetTheme,
    gridWidth: number,
    gridHeight: number,
    layer: number,
  ): void {
    const norm = Math.max(0, Math.min(1, intensity / 127));
    const layerBoost = 1 + layer * 0.35;
    const sporeCount = Math.round((10 + norm * 48) * (FEEDBACK_GAIN / 6) * layerBoost);
    this.spawnSpores(x, y, sporeCount, theme, intensity);

    const ringSteps = Math.round((6 + norm * 22) * layerBoost);
    for (let i = 0; i < ringSteps; i += 1) {
      if (this.particles.length >= this.maxParticles) {
        break;
      }
      const angle = (i / ringSteps) * Math.PI * 2;
      const radius = (1.5 + norm * 8) * layerBoost;
      const { vx, vy } = themeParticleVelocity(theme, intensity);
      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: vx + Math.cos(angle) * (0.6 + norm * 2),
        vy: vy + Math.sin(angle) * (0.6 + norm * 2),
        char: pickThemeAccent(theme, particleIdCounter++ + i + layer * 17),
        life: 0,
        maxLife: 1.2 + norm * 3.5,
        category: theme.particleBias,
      });
    }

    const innerRing = Math.round((3 + norm * 10) * layerBoost);
    for (let i = 0; i < innerRing; i += 1) {
      if (this.particles.length >= this.maxParticles) {
        break;
      }
      const angle = (i / innerRing) * Math.PI * 2 + layer * 0.4;
      const radius = 0.5 + norm * 2.5;
      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle + Math.PI / 2) * (1.2 + norm * 2),
        vy: Math.sin(angle + Math.PI / 2) * (1.2 + norm * 2),
        char: pickThemeChar(theme, particleIdCounter++ + i),
        life: 0,
        maxLife: 0.5 + norm * 1.8,
        category: 'seed',
      });
    }

    const scatter = Math.round((8 + norm * 32) * (FEEDBACK_GAIN / 8));
    for (let i = 0; i < scatter; i += 1) {
      const sx = Math.floor(Math.random() * gridWidth);
      const sy = Math.floor(Math.random() * (gridHeight - 2));
      this.spawnSpores(sx, sy, Math.round(2 + norm * 5), theme, intensity);
    }

    this.spawnEchoSeeds(x, y, 0.35 + norm * 0.75, theme);
    for (let i = 0; i < Math.round(3 + norm * 12); i += 1) {
      this.spawnReverbSpores(gridWidth, gridHeight, 0.5 + norm * 0.5, theme, true);
    }
    for (let i = 0; i < Math.round(1 + norm * 4); i += 1) {
      this.spawnWindParticles(
        gridWidth,
        gridHeight,
        { lfoDepth: norm, lfoRate: 0.35 } as SoundVizParams,
        theme,
      );
    }
    if (norm > 0.08) {
      this.spawnDistortionArtifacts(
        x,
        y,
        { distortion: 0.2 + norm * 0.8, delayWet: norm, reverbWet: norm } as SoundVizParams,
        theme,
      );
    }

    const columns = Math.round(norm * 8 * layerBoost);
    for (let c = 0; c < columns; c += 1) {
      const colX = Math.floor(Math.random() * gridWidth);
      const colH = Math.round(2 + norm * (gridHeight * 0.6));
      for (let row = 0; row < colH; row += 1) {
        if (this.particles.length >= this.maxParticles) {
          break;
        }
        this.particles.push({
          x: colX,
          y: Math.max(0, y - row),
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.25 + Math.random() * 0.6,
          char: pickThemeChar(theme, particleIdCounter++ + c + row),
          life: 0,
          maxLife: 0.6 + norm * 2,
          category: theme.particleBias,
        });
      }
    }
  }

  update(
    dt: number,
    gridWidth: number,
    gridHeight: number,
    sound: SoundVizParams,
    theme: PresetTheme,
    reduceMotion: boolean,
  ): void {
    const speedScale = reduceMotion ? 0.35 : 1;

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
