import { interpolateMusicalColor } from '../visuals/colorMusicTheory';
import { densityChar } from './CharacterPalette';
import { paintBotanicalScene } from './BotanicalScenes';
import { paintInteractionOverlays, paintIdlePresetTransition, paintPresetTransitionOverlay } from './InteractionOverlays';
import { pickThemeChar } from './ThemeCharacters';
import type { SliderVizState } from './SliderVisualEffects';
import type {
  BranchSegment,
  MusicalColorFrame,
  PresetTheme,
  VisualEnergyBehavior,
  VisualRenderMode,
  VizParticle,
} from './types';

export type GridDimensions = {
  width: number;
  height: number;
};

type CellTint = 'subtle' | 'accent' | 'full';

type CellLayer = {
  char: string;
  priority: number;
  tint: CellTint | null;
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
  private htmlCache: string = '';
  private dirty = true;
  private musicalFrame: MusicalColorFrame | null = null;

  constructor(dimensions: GridDimensions) {
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.grid = this.createEmptyGrid();
  }

  clear(): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.grid[y][x] = { char: ' ', priority: 0, tint: null };
      }
    }
    this.dirty = true;
  }

  /** Apply active Scriabin musical color for glyph tinting this frame. */
  setMusicalFrame(frame: MusicalColorFrame | null): void {
    this.musicalFrame = frame;
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
    visualEnergy: number,
    pointer: {
      gridX: number;
      gridY: number;
      active: boolean;
      activity: number;
      velocity: number;
      isTouch: boolean;
    },
    energyBehavior: VisualEnergyBehavior,
    renderMode: VisualRenderMode,
    performance?: import('./PerformanceAnimation').PerformanceAnimationState,
    ambientActive?: boolean,
    playModeEnergy?: number,
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
      visualEnergy,
      renderMode,
      asciiDensityScale: energyBehavior.density,
      pointer,
      energyBehavior,
      performance,
      ambientActive,
      playModeEnergy,
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

    for (let x = 0; x < this.width; x += 2) {
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
      const barHeight = Math.round(value * 6);
      const x = Math.floor(i * columnWidth + columnWidth / 2);

      for (let h = 0; h < barHeight; h += 1) {
        const charIndex = Math.min(chars.length - 1, Math.floor((h / 6) * chars.length));
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

  paintInteractionOverlays(
    theme: PresetTheme,
    time: number,
    interactionPulse: number,
    energyBehavior: VisualEnergyBehavior,
    visualEnergy = 0.5,
  ): void {
    paintInteractionOverlays({
      width: this.width,
      height: this.height,
      theme,
      time,
      pulse: interactionPulse,
      visualEnergy,
      jitter: energyBehavior.jitter,
      spread: energyBehavior.spread,
      paint: (x, y, char, priority) => this.setChar(x, y, char, priority),
    });
  }

  paintPresetTransition(
    theme: PresetTheme,
    time: number,
    progress: number,
    energyBehavior: VisualEnergyBehavior,
    idle = false,
  ): void {
    const ctx = {
      width: this.width,
      height: this.height,
      theme,
      time,
      progress,
      distortion: energyBehavior.distortion,
      paint: (x: number, y: number, char: string, priority: number) => this.setChar(x, y, char, priority),
    };
    if (idle) {
      paintIdlePresetTransition(ctx);
    } else {
      paintPresetTransitionOverlay(ctx);
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
      cell.tint = resolveCellTint(char, priority, this.musicalFrame);
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
    return this.stringCache;
  }

  /** HTML with per-glyph Scriabin tint on accent layers (priority ≥ 3). */
  toHtml(): string {
    if (!this.dirty && this.htmlCache) {
      return this.htmlCache;
    }

    this.stringCache = this.grid
      .map((row) => row.map((cell) => cell.char).join(''))
      .join('\n');
    this.htmlCache = buildColoredHtml(this.grid, this.musicalFrame);
    this.dirty = false;
    return this.htmlCache;
  }

  private createEmptyGrid(): CellLayer[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({ char: ' ', priority: 0, tint: null })),
    );
  }
}

function resolveCellTint(
  char: string,
  priority: number,
  frame: MusicalColorFrame | null,
): CellTint | null {
  if (!frame || char === ' ' || priority < 3 || frame.weight < 0.04) {
    return null;
  }
  if (priority >= 8) {
    return 'full';
  }
  if (priority >= 5) {
    return 'accent';
  }
  return 'subtle';
}

function cellDisplayColor(cell: CellLayer, frame: MusicalColorFrame | null): string | null {
  if (!frame || !cell.tint) {
    return null;
  }
  const tintWeight = cell.tint === 'full' ? 1 : cell.tint === 'accent' ? 0.82 : 0.58;
  const blend = Math.min(1, Math.max(0.55, frame.weight * tintWeight + frame.bloom * 0.22));
  return interpolateMusicalColor(frame.ambientHex, frame.displayHex, blend).hex;
}

function buildColoredHtml(grid: CellLayer[][], frame: MusicalColorFrame | null): string {
  const lines: string[] = [];

  for (const row of grid) {
    let line = '';
    let runColor: string | null = null;
    let runChars = '';

    const flushRun = () => {
      if (runChars.length === 0) {
        return;
      }
      if (runColor) {
        line += `<span style="color:${runColor}">${escapeHtml(runChars)}</span>`;
      } else {
        line += escapeHtml(runChars);
      }
      runChars = '';
      runColor = null;
    };

    for (const cell of row) {
      const color = cellDisplayColor(cell, frame);
      if (color !== runColor) {
        flushRun();
        runColor = color;
      }
      runChars += cell.char;
    }
    flushRun();
    lines.push(line);
  }

  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

export { computeGridDimensions } from './viewportLayout';
