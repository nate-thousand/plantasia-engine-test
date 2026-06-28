/**
 * Milestone 13F — one shape concept per preset, per-glyph animation, strict density.
 */
import type { ExperientialMode } from './VisualMode';
import { resolveExperientialMode } from './VisualMode';
import type { SceneContext } from './BotanicalScenes';
import { resolveIdleThemeKey } from './IdleScenePainters';
import {
  clampShapeVisualEnergy,
  clusterCountForMode,
  DENSITY_BY_MODE,
  generateShapePoints,
  maxGlyphsForMode,
  resolveShapeKind,
  symbolPaletteForTheme,
} from './ShapeComposition';
import { buildAnimatedGlyphs, glyphAnimFromBehavior } from './GlyphAnimation';

function paintHomeTitle(ctx: SceneContext): void {
  const title = 'PLANTASONIC';
  const { width, height, time, paint, animSpeed } = ctx;
  const startX = Math.max(1, Math.floor((width - title.length) / 2));
  const y = Math.max(2, Math.floor(height * 0.14 + Math.sin(time * 0.12 * animSpeed) * 0.3));
  for (let i = 0; i < title.length; i += 1) {
    paint(startX + i, y, title[i] ?? '·', 3);
  }
}

function paintPointerHalo(ctx: SceneContext): void {
  const { pointer, paint } = ctx;
  if (!pointer.active && pointer.activity < 0.1) return;
  const { gridX: cx, gridY: cy } = pointer;
  paint(cx, cy, '+', 2);
}

/** Primary 13F scene — shape composition with per-glyph animation. */
export function paintShapeScene(ctx: SceneContext): void {
  const themeKey = resolveIdleThemeKey(ctx);
  const mode: ExperientialMode = resolveExperientialMode(
    ctx.ambientActive ?? false,
    ctx.playModeEnergy ?? (ctx.renderMode === 'idleHome' ? 0 : ctx.visualEnergy),
  );
  const energy = clampShapeVisualEnergy(ctx.visualEnergy, mode);
  const seed = themeKey.length * 17 + ctx.width;

  if (mode === 'home') {
    paintHomeTitle(ctx);
  }

  const shapeKind = resolveShapeKind(themeKey);
  const palette = symbolPaletteForTheme(ctx.theme);
  let clusterTarget = clusterCountForMode(mode, themeKey, seed);

  if (mode === 'performance') {
    const boost = Math.min(1, (ctx.playModeEnergy ?? energy) - 0.58);
    clusterTarget = Math.min(
      DENSITY_BY_MODE.performance.maxClusters,
      clusterTarget + Math.floor(boost * 8),
    );
  } else if (mode === 'ambient' && ctx.pointer.activity > 0.08) {
    clusterTarget = Math.min(
      DENSITY_BY_MODE.ambient.maxClusters,
      clusterTarget + 1,
    );
  }

  const maxGlyphs = maxGlyphsForMode(mode, ctx.width, ctx.height);
  const points = generateShapePoints(shapeKind, ctx.width, ctx.height, clusterTarget, seed);

  const perfCluster = ctx.performance?.clusters[0];
  const animCtx = {
    time: ctx.time,
    visualEnergy: energy,
    amplitude: ctx.amplitude,
    pointerActivity: ctx.pointer.activity,
    clusterOffset: perfCluster
      ? {
          translateX: perfCluster.translateX,
          translateY: perfCluster.translateY,
          breathe: perfCluster.breathe,
          scale: perfCluster.scale,
        }
      : undefined,
    ...glyphAnimFromBehavior(ctx.energyBehavior, energy),
  };

  const glyphs = buildAnimatedGlyphs(points, palette, animCtx, maxGlyphs, ctx.width, ctx.height);

  for (const g of glyphs) {
    ctx.paint(g.x, g.y, g.char, g.priority);
  }

  if (mode !== 'home' && energy > 0.2) {
    paintAccentMotif(ctx, shapeKind, palette, energy, mode);
  }

  paintPointerHalo(ctx);
}

/** Secondary accent — one small motif, never wallpaper. */
function paintAccentMotif(
  ctx: SceneContext,
  kind: import('./ShapeComposition').ShapeKind,
  palette: readonly string[],
  energy: number,
  mode: ExperientialMode,
): void {
  if (mode === 'home' || energy < 0.18) return;
  const { width, height, time, paint } = ctx;
  const accentChar = palette[palette.length - 1] ?? '.';
  const count = mode === 'performance' ? 3 : 1;

  for (let i = 0; i < count; i += 1) {
    const phase = time * 0.35 + i;
    let x = 0;
    let y = 0;
    switch (kind) {
      case 'waveLine':
        x = Math.floor(width * (0.2 + i * 0.25) + Math.sin(phase) * 2);
        y = Math.floor(height * 0.28 + Math.cos(phase * 0.7));
        break;
      case 'constellation':
      case 'orbitRing':
        x = Math.floor(width * (0.15 + i * 0.2));
        y = Math.floor(height * 0.22);
        break;
      default:
        x = Math.floor(width * (0.78 - i * 0.08));
        y = Math.floor(height * (0.25 + Math.sin(phase) * 0.04 * height));
        break;
    }
    if (x > 1 && x < width - 2 && y > 1 && y < height - 2) {
      paint(x, y, accentChar, 1);
    }
  }
}
