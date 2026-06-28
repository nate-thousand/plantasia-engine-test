/**
 * Milestone 13F — per-glyph animation inside readable shapes.
 * Three levels: shape (slow) · cluster (medium) · glyph (fast musical).
 */
import type { ShapeGlyphPoint } from './ShapeComposition';
import type { VisualEnergyBehavior } from './types';

export type AnimatedGlyph = ShapeGlyphPoint & {
  char: string;
  priority: number;
};

export type GlyphAnimContext = {
  time: number;
  visualEnergy: number;
  amplitude: number;
  jitter: number;
  spread: number;
  pointerActivity: number;
  clusterOffset?: { translateX: number; translateY: number; breathe: number; scale: number };
};

/** Pick animated char + offset for one glyph in a shape. */
export function animateGlyph(
  point: ShapeGlyphPoint,
  palette: readonly string[],
  ctx: GlyphAnimContext,
): { x: number; y: number; char: string; priority: number } {
  const shapeBreath = Math.sin(ctx.time * 0.22) * 0.5 + 0.5;
  const clusterPhase = ctx.time * (0.45 + point.clusterIndex * 0.11);
  const clusterDriftX = Math.sin(clusterPhase) * (2 + ctx.visualEnergy * 4) * ctx.spread;
  const clusterDriftY = Math.cos(clusterPhase * 0.85) * (1 + ctx.visualEnergy * 3) * ctx.spread;

  const glyphPulse = Math.sin(ctx.time * (1.8 + point.glyphIndex * 0.3) + ctx.amplitude * 4);
  const glyphFlicker = Math.sin(ctx.time * 3.2 + point.x * 0.4 + point.y * 0.3);

  let charIndex = point.glyphIndex % palette.length;
  if (ctx.jitter > 0.15 && glyphFlicker > 0.72 - ctx.jitter * 0.5) {
    charIndex = (charIndex + 1 + Math.floor(ctx.time * 2)) % palette.length;
  }
  if (point.role === 'accent' && glyphPulse > 0.35) {
    charIndex = Math.min(palette.length - 1, charIndex + 1);
  }

  const perf = ctx.clusterOffset;
  const perfX = perf ? perf.translateX * 0.08 : 0;
  const perfY = perf ? perf.translateY * 0.08 : 0;
  const breatheScale = perf ? 0.85 + perf.breathe * 0.3 : 0.85 + shapeBreath * 0.25;

  const x = Math.round(
    point.x + clusterDriftX * breatheScale + perfX + glyphPulse * ctx.pointerActivity * 0.6,
  );
  const y = Math.round(
    point.y + clusterDriftY * breatheScale + perfY + glyphPulse * ctx.visualEnergy * 0.4,
  );

  const priority = point.role === 'accent' ? 3 : point.role === 'core' ? 2 : 1;
  return { x, y, char: palette[charIndex] ?? '.', priority };
}

export function buildAnimatedGlyphs(
  points: ShapeGlyphPoint[],
  palette: readonly string[],
  ctx: GlyphAnimContext,
  maxGlyphs: number,
  width: number,
  height: number,
): AnimatedGlyph[] {
  const out: AnimatedGlyph[] = [];
  const seen = new Set<string>();

  for (const point of points) {
    if (out.length >= maxGlyphs) break;
    const anim = animateGlyph(point, palette, ctx);
    if (anim.x < 1 || anim.y < 1 || anim.x >= width - 1 || anim.y >= height - 1) continue;
    const key = `${anim.x},${anim.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...point, ...anim });
  }
  return out;
}

export function glyphAnimFromBehavior(
  behavior: VisualEnergyBehavior,
  visualEnergy: number,
): Pick<GlyphAnimContext, 'jitter' | 'spread'> {
  return {
    jitter: Math.min(0.65, behavior.jitter * (0.4 + visualEnergy * 0.6)),
    spread: Math.min(0.85, behavior.spread * (0.35 + visualEnergy * 0.5)),
  };
}
