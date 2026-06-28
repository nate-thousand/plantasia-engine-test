/**
 * Milestone 13F — shape-based composition, per-glyph animation, strict density.
 * Pre-session: canvas stays sparse; React TitleScreen owns the logo ritual.
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
  hashString,
  maxGlyphsForMode,
  resolveShapeKind,
  shapeAnchorOffset,
  symbolPaletteForTheme,
} from './ShapeComposition';
import { buildAnimatedGlyphs, glyphAnimFromBehavior } from './GlyphAnimation';

function paintShapeGlyph(
  ctx: SceneContext,
  x: number,
  y: number,
  char: string,
  priority: number,
  scale?: number,
  rotation?: number,
  alpha?: number,
): void {
  ctx.shapeGlyphs?.push({ x, y, char, priority, scale, rotation, alpha });
  if (!ctx.suppressShapeGridPaint) {
    ctx.paint(x, y, char, priority);
  }
}

function paintPointerHalo(ctx: SceneContext): void {
  const { pointer } = ctx;
  if (!pointer.active && pointer.activity < 0.1) return;
  const { gridX: cx, gridY: cy } = pointer;
  paintShapeGlyph(ctx, cx, cy, '+', 2);
}

/** Primary 13F scene — one concept per preset, no wallpaper (13F). */
export function paintShapeScene(ctx: SceneContext): void {
  const sessionStarted = ctx.sessionStarted ?? false;

  if (!sessionStarted) {
    paintPointerHalo(ctx);
    return;
  }

  const themeKey = resolveIdleThemeKey(ctx);
  const presetId = ctx.theme.id ?? themeKey;
  const mode: ExperientialMode = resolveExperientialMode(
    ctx.ambientActive ?? false,
    ctx.playModeEnergy ?? (ctx.renderMode === 'idleHome' ? 0 : ctx.visualEnergy),
    sessionStarted,
  );
  const energy = clampShapeVisualEnergy(ctx.visualEnergy, mode);
  const seed = Math.abs(hashString(themeKey + presetId + String(ctx.width)));

  const shapeKind = resolveShapeKind(themeKey, presetId);
  const palette = symbolPaletteForTheme(ctx.theme);
  let clusterTarget = clusterCountForMode(mode, themeKey, seed);
  const anchorOffsetX = shapeAnchorOffset(themeKey + presetId, ctx.width);

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
  const points = generateShapePoints(
    shapeKind,
    ctx.width,
    ctx.height,
    clusterTarget,
    seed,
    anchorOffsetX,
  );

  const animSpeed = Math.max(0.35, ctx.theme.animationSpeed ?? 1);
  const perfCluster = ctx.performance?.clusters[0];
  const animCtx = {
    time: ctx.time * animSpeed,
    visualEnergy: energy,
    amplitude: ctx.amplitude,
    pointerActivity: ctx.pointer.activity,
    pointer: ctx.pointer,
    presetTransition: ctx.presetTransition ?? 0,
    interaction: ctx.interaction,
    clusterOffset: perfCluster
      ? {
          translateX: perfCluster.translateX,
          translateY: perfCluster.translateY,
          breathe: perfCluster.breathe,
          scale: perfCluster.scale,
        }
      : undefined,
    ...glyphAnimFromBehavior(ctx.energyBehavior, energy, ctx.interaction),
  };

  const glyphs = buildAnimatedGlyphs(points, palette, animCtx, maxGlyphs, ctx.width, ctx.height);

  for (const g of glyphs) {
    paintShapeGlyph(ctx, g.x, g.y, g.char, g.priority, g.scale, g.rotation, g.alpha);
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
  const { width, height, time } = ctx;
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
      paintShapeGlyph(ctx, x, y, accentChar, 1);
    }
  }
}
