import { resolveThemeTemplateKeyFromTheme } from './PresetVisualThemes';
import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import { FEEDBACK_GAIN } from './VisualFeedback';
import type { PresetTheme } from './types';

export type InteractionOverlayContext = {
  width: number;
  height: number;
  theme: PresetTheme;
  time: number;
  pulse: number;
  /** Normalized energy — scales overlay density (sparse when low). */
  visualEnergy?: number;
  jitter?: number;
  spread?: number;
  paint: (x: number, y: number, char: string, priority: number) => void;
};

export type PresetTransitionContext = {
  width: number;
  height: number;
  theme: PresetTheme;
  time: number;
  /** 0–1 transition intensity (1 = just changed). */
  progress: number;
  distortion?: number;
  paint: (x: number, y: number, char: string, priority: number) => void;
};

type TransitionPainter = (ctx: PresetTransitionContext, themeKey: string) => void;

/** Preset change transition — curated motif per theme archetype. */
export function paintPresetTransitionOverlay(ctx: PresetTransitionContext): void {
  const { progress } = ctx;
  if (progress <= 0.03) {
    return;
  }

  const themeKey = resolveThemeTemplateKeyFromTheme(ctx.theme);
  const painter = TRANSITION_BY_THEME[themeKey] ?? paintDefaultBurstTransition;
  painter(ctx, themeKey);
}

/** Minimal preset crossfade for idleHome — theme-specific 2–3 glyph motif. */
export function paintIdlePresetTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  if (progress <= 0.02) {
    return;
  }

  const themeKey = resolveThemeTemplateKeyFromTheme(theme);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);

  switch (themeKey) {
    case 'seed':
      paint(cx, cy, pickThemeChar(theme, 0), 3);
      if (progress > 0.3) {
        paint(cx, cy - 1, pickThemeAccent(theme, 0), 2);
      }
      break;
    case 'coral':
      paint(cx, cy, 'Y', 3);
      if (progress > 0.35) {
        paint(cx - 1, cy - 1, '/', 2);
        paint(cx + 1, cy - 1, '\\', 2);
      }
      break;
    case 'crystal':
    case 'winter':
      paint(cx, cy, '◆', 3);
      if (progress > 0.4) {
        paint(cx - 1, cy, '+', 2);
        paint(cx + 1, cy, '+', 2);
      }
      break;
    case 'juno':
    case 'bloom':
    case 'night-bloom':
      paint(cx, cy, pickThemeAccent(theme, 0), 3);
      if (progress > 0.25) {
        paint(cx - 2, cy, pickThemeChar(theme, 1), 2);
        paint(cx + 2, cy, pickThemeChar(theme, 2), 2);
      }
      break;
    case 'mutation':
      if (progress > 0.2) {
        paint(cx, cy, '#', 3);
      }
      break;
    default:
      paint(cx, cy, pickThemeAccent(theme, 0), 3);
      if (progress > 0.25) {
        paint(cx - 2, cy, pickThemeChar(theme, 1), 2);
        paint(cx + 2, cy, pickThemeChar(theme, 2), 2);
      }
      if (progress > 0.55) {
        paint(cx, cy - 2, pickThemeChar(theme, 3), 2);
      }
      break;
  }
}

function paintMutationTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, time, progress, paint } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const priority = 9;
  const scanY = Math.floor((1 - progress) * height);
  for (let x = 0; x < width; x += 2) {
    if (Math.sin(x * 0.8 + time * 12) > 0.3 - progress * 0.5) {
      paint(x, scanY, pickThemeAccent(theme, x + Math.floor(time * 6)), priority);
    }
  }
  if (progress > 0.4) {
    paint(cx, cy, '#', priority);
    paint(cx - 1, cy, 'x', priority - 1);
    paint(cx + 1, cy, 'X', priority - 1);
  }
}

function paintPlantasonicTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, time, progress, paint } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const priority = 9;
  const rings = Math.round(1 + progress * 4);
  for (let r = 1; r <= rings; r += 1) {
    paint(cx + r, cy, '∘', priority - 1);
    paint(cx - r, cy, '∘', priority - 1);
    paint(cx, cy + r, '∘', priority - 1);
    paint(cx, cy - r, '∘', priority - 1);
  }
  paint(cx, cy, pickThemeAccent(theme, Math.floor(time)), priority);
}

function paintRootTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  const cx = Math.floor(width / 2);
  const ground = height - 2;
  const depth = Math.round(progress * 5);
  paint(cx, ground, pickThemeChar(theme, 0), 9);
  for (let dy = 1; dy <= depth; dy += 1) {
    paint(cx - 1, ground - dy, '/', 8);
    paint(cx + 1, ground - dy, '\\', 8);
  }
}

function paintBloomTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const petals = Math.round(2 + progress * 4);
  for (let i = 0; i < petals; i += 1) {
    const angle = (i / petals) * Math.PI * 2;
    const x = cx + Math.round(Math.cos(angle) * progress * 4);
    const y = cy + Math.round(Math.sin(angle) * progress * 3);
    paint(x, y, pickThemeAccent(theme, i), 9);
  }
  paint(cx, cy, pickThemeChar(theme, 0), 8);
}

function paintWaveTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, time, progress, paint } = ctx;
  const y = Math.floor(height * (0.55 - progress * 0.15));
  for (let x = 0; x < width; x += 2) {
    const ly = y + Math.round(Math.sin(x * 0.15 + time * 2) * progress * 2);
    paint(x, ly, pickThemeChar(theme, x), 8);
  }
}

function paintVineTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  const x = Math.floor(width / 2);
  const len = Math.round(progress * (height * 0.5));
  for (let dy = 0; dy < len; dy += 1) {
    paint(x, dy + 2, dy % 2 === 0 ? '|' : '~', 8);
  }
  paint(x, len + 2, pickThemeAccent(theme, 0), 9);
}

function paintCrystalTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const spokes = Math.round(2 + progress * 6);
  for (let s = 0; s < spokes; s += 1) {
    const angle = (s / spokes) * Math.PI * 2;
    const dist = Math.round(progress * Math.min(width, height) * 0.3);
    paint(cx + Math.round(Math.cos(angle) * dist), cy + Math.round(Math.sin(angle) * dist * 0.65), '+', 9);
  }
  paint(cx, cy, pickThemeAccent(theme, 0), 9);
}

function paintMyceliumTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  const hubs = 3;
  for (let i = 0; i < hubs; i += 1) {
    const x = Math.floor(width * (0.25 + i * 0.25));
    const y = Math.floor(height * (0.4 + i * 0.08));
    paint(x, y, pickThemeAccent(theme, i), 9);
    if (i < hubs - 1 && progress > 0.3) {
      const nx = Math.floor(width * (0.25 + (i + 1) * 0.25));
      const ny = Math.floor(height * (0.4 + (i + 1) * 0.08));
      const steps = 4;
      for (let s = 1; s < steps; s += 1) {
        const t = s / steps;
        paint(Math.round(x + (nx - x) * t), Math.round(y + (ny - y) * t), '·', 7);
      }
    }
  }
}

function paintSnowTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, time, progress, paint } = ctx;
  const flakes = Math.round(progress * 12);
  for (let i = 0; i < flakes; i += 1) {
    const x = Math.floor((time * 3 + i * 7) % width);
    const y = Math.floor((progress * height + i * 2) % (height - 1));
    paint(x, y, pickThemeChar(theme, i), 8);
  }
}

function paintNightTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, progress, paint } = ctx;
  const count = Math.round(2 + progress * 5);
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(width * (0.2 + i * 0.12));
    const y = Math.floor(height * (0.25 + (i % 2) * 0.1));
    paint(x, y, pickThemeAccent(theme, i), 9);
    paint(x, y + 1, '·', 6);
  }
}

function paintDefaultBurstTransition(ctx: PresetTransitionContext): void {
  const { width, height, theme, time, progress, paint } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const priority = 9;
  const burst = Math.round(progress * 8);
  for (let i = 0; i < burst; i += 1) {
    const angle = (i / burst) * Math.PI * 2 + time * 0.5;
    const dist = Math.round(progress * Math.min(width, height) * 0.35);
    const x = cx + Math.round(Math.cos(angle) * dist);
    const y = cy + Math.round(Math.sin(angle) * dist * 0.65);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      paint(x, y, pickThemeChar(theme, i + Math.floor(time * 3)), priority);
    }
  }
}

const TRANSITION_BY_THEME: Record<string, TransitionPainter> = {
  mutation: paintMutationTransition,
  plantasonic: paintPlantasonicTransition,
  root: paintRootTransition,
  roots: paintRootTransition,
  bloom: paintBloomTransition,
  juno: paintBloomTransition,
  'night-bloom': paintNightTransition,
  coral: paintWaveTransition,
  desert: paintWaveTransition,
  vine: paintVineTransition,
  rainforest: paintVineTransition,
  canopy: paintVineTransition,
  fern: paintVineTransition,
  crystal: paintCrystalTransition,
  winter: paintSnowTransition,
  mycelium: paintMyceliumTransition,
  seed: paintRootTransition,
  moss: paintBloomTransition,
};

/** Full-screen ASCII shockwave + edge flicker on high interaction pulse. */
export function paintInteractionOverlays(ctx: InteractionOverlayContext): void {
  const { width, height, theme, time, pulse, paint } = ctx;
  const jitter = ctx.jitter ?? 0;
  const spread = ctx.spread ?? 1;
  const energy = ctx.visualEnergy ?? 0.5;
  if (pulse < 4) {
    return;
  }

  const norm = Math.min(1, (pulse / 127) * spread * (0.35 + energy * 0.65));
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const priority = 8 + Math.round(norm * 2);
  const themeKey = resolveThemeTemplateKeyFromTheme(theme);
  const waveChars = waveCharsForTheme(themeKey);

  const waveRadius = Math.round(
    (norm * 0.55 + 0.08 + jitter * 0.15) * Math.min(width, height) * (1 + Math.sin(time * 6) * 0.15),
  );

  for (let r = 1; r <= waveRadius; r += 1) {
    if (r % 2 !== 0 && norm < 0.4) {
      continue;
    }
    for (let angle = 0; angle < 360; angle += Math.max(12, 48 - norm * 30)) {
      const rad = (angle * Math.PI) / 180;
      const x = cx + Math.round(Math.cos(rad) * r);
      const y = cy + Math.round(Math.sin(rad) * r * 0.65);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const waveChar = waveChars[(r + angle + Math.floor(time * 8)) % waveChars.length] ?? '·';
        paint(x, y, waveChar, priority);
      }
    }
  }

  const edgeCount = Math.round((4 + norm * 24) * (FEEDBACK_GAIN / 16));
  for (let i = 0; i < edgeCount; i += 1) {
    const edge = i % 4;
    const t = (i / edgeCount + time * 0.4) % 1;
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = Math.floor(t * width);
      y = 0;
    } else if (edge === 1) {
      x = width - 1;
      y = Math.floor(t * height);
    } else if (edge === 2) {
      x = Math.floor((1 - t) * width);
      y = height - 1;
    } else {
      x = 0;
      y = Math.floor((1 - t) * height);
    }
    paint(x, y, pickThemeChar(theme, i + Math.floor(time * 12)), priority - 1);
  }

  const scanLines = Math.round(norm * 6 * (FEEDBACK_GAIN / 12));
  for (let s = 0; s < scanLines; s += 1) {
    const y = Math.floor(((time * 2.5 + s * 0.17) % 1) * (height - 1));
    for (let x = 0; x < width; x += Math.max(1, 3 - Math.round(norm * 2))) {
      if (Math.sin(x * 0.9 + time * 4 + s) > 0.2 - norm * 0.3) {
        paint(x, y, norm > 0.5 ? '═' : '─', 7);
      }
    }
  }

  const streaks = Math.round((2 + norm * 10) * (FEEDBACK_GAIN / 14));
  for (let i = 0; i < streaks; i += 1) {
    const sx = Math.floor(pseudo(i, time) * width);
    const sy = Math.floor(pseudo(i + 3, time * 1.1) * height);
    const len = Math.round(2 + norm * 8);
    const dx = pseudo(i + 5, time) > 0.5 ? 1 : -1;
    const dy = pseudo(i + 7, time) > 0.5 ? 1 : 0;
    for (let step = 0; step < len; step += 1) {
      const x = sx + dx * step;
      const y = sy + dy * step;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        paint(x, y, pickThemeAccent(theme, i + step + Math.floor(time * 6)), priority);
      }
    }
  }

  if (norm > 0.35) {
    const corners = [
      { x: 1, y: 1 },
      { x: width - 2, y: 1 },
      { x: 1, y: height - 2 },
      { x: width - 2, y: height - 2 },
    ];
    for (const corner of corners) {
      const r = Math.round(1 + norm * 5);
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          if (Math.abs(dx) + Math.abs(dy) <= r) {
            paint(
              corner.x + dx,
              corner.y + dy,
              pickThemeAccent(theme, dx + dy + Math.floor(time * 8)),
              priority,
            );
          }
        }
      }
    }
  }
}

function waveCharsForTheme(themeKey: string): string[] {
  switch (themeKey) {
    case 'crystal':
    case 'winter':
      return ['◆', '+', '·', '°', '∘'];
    case 'coral':
    case 'desert':
      return ['~', '○', '◌', '·', '°'];
    case 'mutation':
      return ['#', 'x', 'X', '·', '-'];
    case 'mycelium':
    case 'rainforest':
      return ['·', '○', '◌', '∘', '°'];
    default:
      return ['○', '◌', '·', '°', '∘', '◎'];
  }
}

function pseudo(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
