import { densityChar } from './CharacterPalette';
import { paintBotanicalScene } from './BotanicalScenes';
import { pickThemeChar } from './ThemeCharacters';
import type { SliderVizState } from './SliderVisualEffects';
import type { BranchSegment, PresetTheme, VizParticle } from './types';

export type GridDimensions = {
  width: number;
  height: number;
};

type CellLayer = {
  char: string;
  priority: number;
};

/**
 * Efficient ASCII grid renderer with layer priority compositing.
 * Background and ground patterns adapt per preset theme.
 */
export class AsciiRenderer {
  readonly width: number;
  readonly height: number;

  private grid: CellLayer[][];
  private stringCache: string = '';
  private dirty = true;

  constructor(dimensions: GridDimensions) {
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.grid = this.createEmptyGrid();
  }

  clear(): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.grid[y][x] = { char: ' ', priority: 0 };
      }
    }
    this.dirty = true;
  }

  paintBackground(density: number, seed: number, contrast: number, theme: PresetTheme): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const themedNoise = backgroundNoise(theme, x, y, seed);
        const threshold = backgroundThreshold(theme, density);

        if (themedNoise > threshold) {
          const char = themeCharForBackground(theme, density, contrast, x, y, seed);
          this.setChar(x, y, char, 1);
        }
      }
    }
  }

  /** Full-frame representational botanical scene — primary visual layer per preset. */
  paintBotanicalScene(
    theme: PresetTheme,
    time: number,
    energy: number,
    amplitude: number,
    animSpeed: number,
    sliders: SliderVizState,
    interactionPulse: number,
  ): void {
    paintBotanicalScene({
      width: this.width,
      height: this.height,
      theme,
      time,
      energy,
      amplitude,
      animSpeed,
      sliders,
      interactionPulse,
      paint: (x, y, char, priority) => this.setChar(x, y, char, priority),
    });
  }

  paintGround(contrast: number, theme: PresetTheme): void {
    const groundY = this.height - 2;

    for (let x = 0; x < this.width; x += 1) {
      let char: string;
      switch (theme.spatialLayout) {
        case 'horizon-wide':
          char = contrast > 50 ? '~' : '.';
          break;
        case 'ground-heavy':
          char = contrast > 50 ? '▓' : '▒';
          break;
        case 'symmetric-radial':
        case 'radial-burst':
          char = contrast > 50 ? '─' : '-';
          break;
        default:
          char = contrast > 50 ? '─' : '_';
      }
      this.setChar(x, groundY, char, 2);

      if (theme.spatialLayout === 'horizon-wide' && x % 3 === 0) {
        this.setChar(x, groundY - 1, pickThemeChar(theme, x + groundY), 1);
      }
    }
  }

  paintSegments(segments: BranchSegment[], priority: number): void {
    for (const segment of segments) {
      this.setChar(Math.round(segment.x), Math.round(segment.y), segment.char, priority);
    }
  }

  paintParticles(particles: readonly VizParticle[], priority: number): void {
    for (const particle of particles) {
      const alpha = 1 - particle.life / particle.maxLife;
      if (alpha > 0.1) {
        this.setChar(Math.round(particle.x), Math.round(particle.y), particle.char, priority);
      }
    }
  }

  paintWindRipples(time: number, lfoDepth: number, centerY: number, theme: PresetTheme): void {
    if (lfoDepth < 0.1) {
      return;
    }

    const y = Math.round(centerY);
    const rippleChar = theme.motionStyle === 'horizon-wave' ? '~' : pickThemeChar(theme, y);

    for (let x = 0; x < this.width; x += 1) {
      const wave =
        theme.motionStyle === 'breathing'
          ? Math.sin(x * 0.25 + time * 1.5) * lfoDepth
          : Math.sin(x * 0.4 + time * 3) * lfoDepth;

      if (Math.abs(wave) > 0.6) {
        this.setChar(x, y, rippleChar, 3);
      }
    }
  }

  paintSpectrumColumns(
    spectrum: number[],
    baseY: number,
    amplitude: number,
    theme: PresetTheme,
  ): void {
    if (spectrum.length === 0 || amplitude < 0.01) {
      return;
    }

    const chars =
      theme.growthBehavior === 'downward-root'
        ? [' ', '▒', '▓', '█']
        : theme.growthBehavior === 'crystal-facet'
          ? [' ', '+', 'x', 'X', '◆']
          : [' ', '·', '░', '▒', '▓', '█'];

    const columnWidth = this.width / spectrum.length;

    for (let i = 0; i < spectrum.length; i += 1) {
      const value = Math.min(1, spectrum[i] * (0.6 + amplitude * 1.4));
      const barHeight = Math.round(value * 8);
      const x = Math.floor(i * columnWidth + columnWidth / 2);

      for (let h = 0; h < barHeight; h += 1) {
        const charIndex = Math.min(chars.length - 1, Math.floor((h / 8) * chars.length));
        this.setChar(x, baseY - h, chars[charIndex], 5);
      }
    }
  }

  paintWaveform(
    waveform: number[],
    centerY: number,
    amplitude: number,
    theme: PresetTheme,
  ): void {
    if (waveform.length < 2 || amplitude < 0.02) {
      return;
    }

    const step = this.width / waveform.length;
    const dot = pickThemeChar(theme, centerY);
    const peak = theme.motionStyle === 'burst-rhythm' ? pickThemeChar(theme, centerY + 1) : '•';

    for (let i = 0; i < waveform.length; i += 1) {
      const x = Math.round(i * step);
      const y = Math.round(centerY + waveform[i] * 3 * (0.5 + amplitude));
      this.setChar(x, y, dot, 4);
      if (Math.abs(waveform[i]) > 0.5) {
        this.setChar(x, y - 1, peak, 5);
      }
    }
  }

  paintAmplitudeHalo(
    cx: number,
    cy: number,
    radius: number,
    amplitude: number,
    theme: PresetTheme,
  ): void {
    if (amplitude < 0.04) {
      return;
    }

    const r = Math.round(radius * (1 + amplitude * 2));

    for (let dx = -r; dx <= r; dx += 1) {
      for (let dy = -r; dy <= r; dy += 1) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist <= r && dist >= r - 1) {
          const char = pickThemeChar(theme, cx + dx + cy + dy + Math.floor(amplitude * 10));
          this.setChar(cx + dx, cy + dy, char, 7);
        }
      }
    }
  }

  paintBassPulse(bass: number, groundY: number, theme: PresetTheme): void {
    if (bass < 0.08) {
      return;
    }

    const span = Math.round(bass * (this.width * (theme.spatialLayout === 'ground-heavy' ? 0.8 : 0.6)));
    const cx = Math.floor(this.width / 2);
    const char = theme.motionStyle === 'heavy-pulse' ? '█' : bass > 0.5 ? '▓' : '▒';

    for (let x = cx - span; x <= cx + span; x += 1) {
      if (x >= 0 && x < this.width) {
        this.setChar(x, groundY, char, 4);
      }
    }
  }

  setChar(x: number, y: number, char: string, priority: number): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }

    const cell = this.grid[y][x];
    if (priority >= cell.priority) {
      cell.char = char;
      cell.priority = priority;
      this.dirty = true;
    }
  }

  toString(): string {
    if (!this.dirty && this.stringCache) {
      return this.stringCache;
    }

    this.stringCache = this.grid
      .map((row) => row.map((cell) => cell.char).join(''))
      .join('\n');
    this.dirty = false;
    return this.stringCache;
  }

  private createEmptyGrid(): CellLayer[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({ char: ' ', priority: 0 })),
    );
  }
}

function backgroundNoise(theme: PresetTheme, x: number, y: number, seed: number): number {
  switch (theme.motionStyle) {
    case 'horizon-wave':
      return Math.sin(x * 0.15 + seed * 0.3) * Math.cos(y * 0.08);
    case 'glitch-symmetry':
      return Math.abs(Math.sin(x * 0.5 + seed) * Math.cos(y * 0.5 + seed * 0.7));
    case 'crawl-static':
      return Math.sin(x * 0.6 + seed * 0.2) * Math.cos(y * 0.15);
    case 'swarm-drift':
      return Math.sin(x * 0.4 + seed * 1.2 + y * 0.1) * Math.cos(y * 0.35);
    default:
      return Math.sin(x * 0.3 + seed) * Math.cos(y * 0.25 + seed * 0.7);
  }
}

function backgroundThreshold(theme: PresetTheme, density: number): number {
  switch (theme.growthBehavior) {
    case 'moss-crawl':
      return 0.5 - density * 0.35;
    case 'field-wave':
      return 0.92 - density * 0.4;
    case 'seed-arc':
      return 0.95 - density * 0.3;
    default:
      return 0.85 - density * 0.5;
  }
}

function themeCharForBackground(
  theme: PresetTheme,
  density: number,
  contrast: number,
  x: number,
  y: number,
  seed: number,
): string {
  if (theme.characterSet.length > 0 && Math.random() < 0.7) {
    return pickThemeChar(theme, x + y * 100 + seed);
  }
  return densityChar(density * (contrast / 100), x + y * 100 + seed);
}

export function computeGridDimensions(
  containerWidth: number,
  containerHeight: number,
  charWidth: number,
  charHeight: number,
): GridDimensions {
  const width = Math.max(1, Math.floor(containerWidth / charWidth));
  const height = Math.max(1, Math.floor(containerHeight / charHeight));
  return { width, height };
}
