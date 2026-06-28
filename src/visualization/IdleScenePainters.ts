/**
 * Sparse, thematic idle ASCII scenes — negative space, slow motion, no full-screen fill.
 * Each preset asciiTheme gets its own visual language at rest (no audio required).
 *
 * Density / motion / interaction (shared model):
 * - At rest: ~2–8 glyphs + ambient drift motes (visualEnergy ≈ 0, density scale 0.32).
 * - Interaction: pointer halo + extra drift; visualEnergy rises → legacy dense scene blends in ≥0.22.
 * - animSpeed from motionFromVisualEnergy(); sliders/MIDI/keyboard feed VisualEnergy in AsciiEngine.
 *
 * Preset visual language:
 * - seed/moss/roots/bloom/canopy/rainforest — sprouting, ground cover, roots, petals, canopy, vines
 * - desert/winter/night-bloom — shimmer, falling crystals, pulsing stars
 * - mycelium/mutation — sparse web nodes, corrupted scan fragments
 * - plantasonic — orbit rings, signal pulses, echo arcs (dub/space)
 */
import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import type { SceneContext } from './BotanicalScenes';

function groundLine(ctx: SceneContext, char = '·'): void {
  const { width, height, theme, paint } = ctx;
  const ground = height - 2;
  for (let x = 0; x < width; x += 3) {
    paint(x, ground, char, 1);
  }
  paint(Math.floor(width / 2), ground - 1, pickThemeChar(theme, 0), 1);
}

/** Slow drifting motes — density scales with visualEnergy + pointer activity. */
function paintAmbientDrift(ctx: SceneContext, count: number, yBias = 0.4): void {
  const { width, height, theme, time, paint, animSpeed, visualEnergy, pointer } = ctx;
  const boosted = count + Math.round(visualEnergy * 5 + pointer.activity * 4);
  for (let i = 0; i < boosted; i += 1) {
    const phase = time * 0.15 * animSpeed + i * 1.7;
    const x = Math.floor(((Math.sin(phase * 0.7 + i) * 0.5 + 0.5) * (width - 2)) + 1);
    const y = Math.floor(((Math.cos(phase * 0.5 + i * 0.3) * 0.5 + 0.5) * (height - 4)) * yBias + 1);
    paint(x, y, pickThemeChar(theme, i + Math.floor(time)), 1);
  }
}

/** Pointer/touch halo — expands with activity, settles when idle. */
function paintPointerHalo(ctx: SceneContext): void {
  const { pointer, visualEnergy, theme, paint } = ctx;
  if (pointer.activity < 0.04 && !pointer.active) {
    return;
  }
  const radius = Math.round(1 + pointer.activity * 3 + visualEnergy * 2);
  const { gridX: cx, gridY: cy } = pointer;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy <= radius * radius) {
        paint(cx + dx, cy + dy, pickThemeChar(theme, dx + dy + Math.floor(ctx.time * 2)), 2);
      }
    }
  }
}

function idleSeed(ctx: SceneContext): void {
  // Seed: sprouting stem, minimal ground dots — density ~3 glyphs; motion = breathe + drift.
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const breathe = Math.sin(time * 0.4 * animSpeed) * 0.5 + 0.5;
  groundLine(ctx, '.');

  const sproutX = Math.floor(width * 0.5 + Math.sin(time * 0.3) * 2);
  const h = Math.round(2 + breathe * 2);
  for (let dy = 0; dy <= h; dy += 1) {
    paint(sproutX, ground - dy, dy === h ? pickThemeAccent(theme, 0) : '|', 2);
  }
  paintAmbientDrift(ctx, 3, 0.35);
}

function idleMoss(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const ground = height - 2;
  for (let i = 0; i < 4; i += 1) {
    const x = Math.floor(width * (0.2 + i * 0.18) + Math.sin(time * 0.25 + i) * 1.5);
    paint(x, ground, pickThemeChar(theme, i), 1);
    paint(x, ground - 1, "'", 1);
  }
  paint(Math.floor(width * 0.5), ground - 2, pickThemeAccent(theme, 1), 1);
  paintAmbientDrift(ctx, 2, 0.5);
}

function idleRoots(ctx: SceneContext): void {
  const { width, height, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const cx = Math.floor(width * 0.5);
  paint(cx, ground, '█', 2);
  for (let dy = 1; dy <= 4; dy += 1) {
    const spread = Math.round(Math.sin(time * 0.2 * animSpeed + dy) * 0.8);
    paint(cx + spread - 1, ground - dy, '/', 2);
    paint(cx + spread + 1, ground - dy, '\\', 2);
  }
  paintAmbientDrift(ctx, 2, 0.6);
}

function idleBloom(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const cx = Math.floor(width * 0.5 + Math.sin(time * 0.35 * animSpeed) * 1.5);
  const open = Math.sin(time * 0.5 * animSpeed) * 0.5 + 0.5;
  paint(cx, ground, '|', 2);
  if (open > 0.4) {
    paint(cx - 1, ground - 2, pickThemeAccent(theme, 0), 2);
    paint(cx + 1, ground - 2, pickThemeAccent(theme, 1), 2);
    paint(cx, ground - 3, pickThemeAccent(theme, 2), 2);
  }
  paintAmbientDrift(ctx, 4, 0.3);
}

function idleCanopy(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const positions = [0.25, 0.5, 0.75];
  for (let i = 0; i < positions.length; i += 1) {
    const x = Math.floor(width * positions[i] + Math.sin(time * 0.28 + i) * 1.2);
    const y = Math.floor(height * 0.55 - i * 2);
    paint(x, y, pickThemeChar(theme, i), 2);
    paint(x - 1, y + 1, '/', 1);
    paint(x + 1, y + 1, '\\', 1);
  }
  paintAmbientDrift(ctx, 3, 0.45);
}

function idleRainforest(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  for (let i = 0; i < 3; i += 1) {
    const x = Math.floor(width * (0.15 + i * 0.32));
    const y = Math.floor(height * 0.35 + Math.sin(time * 0.4 + i) * 1);
    paint(x, y, pickThemeChar(theme, i), 2);
  }
  paint(Math.floor(width * 0.5), height - 3, '~', 1);
  paintAmbientDrift(ctx, 5, 0.55);
}

function idleDesert(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const shimmer = Math.sin(time * 0.6 * animSpeed) * 0.5 + 0.5;
  if (shimmer > 0.55) {
    paint(Math.floor(width * 0.3), ground, pickThemeAccent(theme, 0), 1);
    paint(Math.floor(width * 0.7), ground, pickThemeAccent(theme, 1), 1);
  }
  paint(Math.floor(width * 0.5), ground - 3, '|', 1);
  paintAmbientDrift(ctx, 2, 0.25);
}

function idleWinter(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  for (let i = 0; i < 5; i += 1) {
    const x = Math.floor((time * 2 * animSpeed + i * 7) % width);
    const y = Math.floor((i * 3 + Math.sin(time + i) * 2) % (height - 2));
    paint(x, y, pickThemeChar(theme, i), 1);
  }
  paint(Math.floor(width * 0.5), height - 3, '◆', 1);
}

function idleNightBloom(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const pulse = Math.sin(time * 0.8 * animSpeed) * 0.5 + 0.5;
  for (let i = 0; i < 4; i += 1) {
    if (pulse > 0.3 + i * 0.1) {
      const x = Math.floor(width * (0.15 + i * 0.22));
      const y = Math.floor(height * 0.3 + Math.cos(time * 0.5 + i) * 2);
      paint(x, y, pickThemeAccent(theme, i), 2);
    }
  }
  paintAmbientDrift(ctx, 3, 0.4);
}

function idleMycelium(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const hubs = [
    { x: Math.floor(width * 0.3), y: Math.floor(height * 0.4) },
    { x: Math.floor(width * 0.7), y: Math.floor(height * 0.55) },
    { x: Math.floor(width * 0.5), y: Math.floor(height * 0.7) },
  ];
  for (let i = 0; i < hubs.length; i += 1) {
    const hub = hubs[i];
    const pulse = Math.sin(time * 0.35 * animSpeed + i) * 0.5 + 0.5;
    paint(hub.x, hub.y, pickThemeAccent(theme, i), 2);
    if (i < hubs.length - 1 && pulse > 0.45) {
      const next = hubs[i + 1];
      const steps = 4;
      for (let s = 1; s < steps; s += 1) {
        const t = s / steps;
        const x = Math.round(hub.x + (next.x - hub.x) * t);
        const y = Math.round(hub.y + (next.y - hub.y) * t);
        paint(x, y, '·', 1);
      }
    }
  }
}

function idleMutation(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  if (Math.sin(time * 3 * animSpeed) > 0.7) {
    paint(cx, cy, pickThemeAccent(theme, Math.floor(time)), 2);
    paint(cx - 1, cy, '#', 1);
    paint(cx + 1, cy, 'x', 1);
  }
  const scanY = Math.floor((time * 0.4) % (height - 1));
  paint(Math.floor(width * 0.2), scanY, '-', 1);
  paint(Math.floor(width * 0.8), scanY, '-', 1);
}

function idlePlantasonic(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const breathe = Math.sin(time * 0.35 * animSpeed) * 0.5 + 0.5;
  for (let r = 1; r <= 2 + Math.round(breathe * 2); r += 1) {
    paint(cx + r, cy, '∘', 1);
    paint(cx - r, cy, '∘', 1);
    paint(cx, cy + r, '∘', 1);
    paint(cx, cy - r, '∘', 1);
  }
  paint(cx, cy, pickThemeAccent(theme, Math.floor(time)), 2);
  paintAmbientDrift(ctx, 4, 0.5);
}

function idleCoral(ctx: SceneContext): void {
  idleDesert(ctx);
}

function idleCrystal(ctx: SceneContext): void {
  idleWinter(ctx);
}

function idleJuno(ctx: SceneContext): void {
  idleNightBloom(ctx);
}

/**
 * Paint sparse idle scene for a preset theme key.
 * Density/motion: controlled by ctx.visualEnergy and ctx.animSpeed in SceneContext.
 */
export function paintIdleSceneByKey(themeKey: string, ctx: SceneContext): void {
  switch (themeKey) {
    case 'plantasonic':
      idlePlantasonic(ctx);
      break;
    case 'moss':
      idleMoss(ctx);
      break;
    case 'roots':
    case 'root':
      idleRoots(ctx);
      break;
    case 'bloom':
      idleBloom(ctx);
      break;
    case 'canopy':
    case 'fern':
      idleCanopy(ctx);
      break;
    case 'rainforest':
    case 'vine':
      idleRainforest(ctx);
      break;
    case 'desert':
    case 'coral':
      idleCoral(ctx);
      break;
    case 'winter':
    case 'crystal':
      idleCrystal(ctx);
      break;
    case 'night-bloom':
    case 'juno':
      idleJuno(ctx);
      break;
    case 'mycelium':
      idleMycelium(ctx);
      break;
    case 'mutation':
      idleMutation(ctx);
      break;
    case 'seed':
    default:
      idleSeed(ctx);
      break;
  }
  paintPointerHalo(ctx);
}

/** Resolve theme key from scene context (matches BotanicalScenes routing). */
export function resolveIdleThemeKey(ctx: SceneContext): string {
  const fromMeta = ctx.theme.visualMetadata?.asciiTheme;
  if (fromMeta) {
    return fromMeta;
  }
  return ctx.theme.asciiState === 'seed' ? 'seed' : 'seed';
}
