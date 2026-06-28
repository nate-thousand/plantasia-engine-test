import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import { FEEDBACK_GAIN } from './VisualFeedback';
import type { PresetTheme } from './types';

export type InteractionOverlayContext = {
  width: number;
  height: number;
  theme: PresetTheme;
  time: number;
  pulse: number;
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

/** Preset change transition — bloom, spore burst, signal pulse, or glitch tear per theme. */
export function paintPresetTransitionOverlay(ctx: PresetTransitionContext): void {
  const { width, height, theme, time, progress, paint } = ctx;
  if (progress <= 0.03) {
    return;
  }

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const priority = 9;
  const themeKey = theme.visualMetadata?.asciiTheme ?? theme.asciiState;

  if (themeKey === 'mutation' || theme.hardResetOnChange) {
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
    return;
  }

  if (themeKey === 'plantasonic') {
    const rings = Math.round(1 + progress * 4);
    for (let r = 1; r <= rings; r += 1) {
      paint(cx + r, cy, '∘', priority - 1);
      paint(cx - r, cy, '∘', priority - 1);
      paint(cx, cy + r, '∘', priority - 1);
      paint(cx, cy - r, '∘', priority - 1);
    }
    return;
  }

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

  const fadeRows = Math.round(progress * 3);
  for (let row = 0; row < fadeRows; row += 1) {
    const y = Math.floor((row / Math.max(1, fadeRows)) * (height - 1));
    for (let x = 0; x < width; x += 4) {
      paint(x, y, '·', 6);
    }
  }
}

/** Full-screen ASCII shockwave + edge flicker on high interaction pulse. */
export function paintInteractionOverlays(ctx: InteractionOverlayContext): void {
  const { width, height, theme, time, pulse, paint } = ctx;
  const jitter = ctx.jitter ?? 0;
  const spread = ctx.spread ?? 1;
  if (pulse < 4) {
    return;
  }

  const norm = Math.min(1, (pulse / 127) * spread);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const priority = 8 + Math.round(norm * 2);

  const waveRadius = Math.round(
    (norm * 0.55 + 0.08 + jitter * 0.15) * Math.min(width, height) * (1 + Math.sin(time * 6) * 0.15),
  );
  const waveChars = ['○', '◌', '·', '°', '∘', '◎'];

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

function pseudo(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
