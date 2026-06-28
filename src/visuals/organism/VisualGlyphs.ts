import { connectionGlyph, GRAMMAR_SYMBOLS, type GrammarSymbol } from './GrammarSymbols';
import { GRID_CENTER_X, GRID_CENTER_Y, GRID_HEIGHT, GRID_WIDTH } from './gridConstants';

export type GlyphPoint = { x: number; y: number; symbol: GrammarSymbol };

export function clampX(x: number): number {
  return Math.max(0, Math.min(GRID_WIDTH - 1, x));
}

export function clampY(y: number): number {
  return Math.max(0, Math.min(GRID_HEIGHT - 1, y));
}

export function clampPoint(point: GlyphPoint): GlyphPoint {
  return { x: clampX(point.x), y: clampY(point.y), symbol: point.symbol };
}

export function clampGlyphs(points: GlyphPoint[]): GlyphPoint[] {
  return points.map(clampPoint);
}

/** Ring of grammar symbols around a focal point. */
export function ringGlyphs(cx: number, cy: number, radius: number, symbol: GrammarSymbol): GlyphPoint[] {
  const glyphs: GlyphPoint[] = [];
  const steps = Math.max(8, radius * 4);

  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    glyphs.push(
      clampPoint({
        x: Math.round(cx + Math.cos(angle) * radius),
        y: Math.round(cy + Math.sin(angle) * radius),
        symbol,
      }),
    );
  }

  return glyphs;
}

/** Stepped signal path from organism center to a note focal point. */
export function signalPathFromCenter(tx: number, ty: number, steps = 12): GlyphPoint[] {
  const glyphs: GlyphPoint[] = [];

  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    const x = Math.round(GRID_CENTER_X + (tx - GRID_CENTER_X) * t);
    const y = Math.round(GRID_CENTER_Y + (ty - GRID_CENTER_Y) * t);
    const symbol = connectionGlyph(tx - x, ty - y);
    glyphs.push(clampPoint({ x, y, symbol }));
  }

  return glyphs;
}

/** Velocity-scaled aura around a note node. */
export function noteAuraGlyphs(cx: number, cy: number, velocity: number): GlyphPoint[] {
  const intensity = velocity / 127;
  const inner =
    intensity >= 0.75
      ? GRAMMAR_SYMBOLS.active
      : intensity >= 0.4
        ? GRAMMAR_SYMBOLS.seed
        : GRAMMAR_SYMBOLS.softParticle;
  const outer =
    intensity >= 0.75
      ? GRAMMAR_SYMBOLS.densityHigh
      : intensity >= 0.4
        ? GRAMMAR_SYMBOLS.densityMedium
        : GRAMMAR_SYMBOLS.densityLow;

  const radius = 1 + Math.round(intensity * 3);

  return [
    ...ringGlyphs(cx, cy, radius, inner),
    ...ringGlyphs(cx, cy, radius + 2, outer),
  ];
}

/** Ripple band beneath a note keyed to velocity. */
export function velocityRippleGlyphs(cx: number, cy: number, velocity: number): GlyphPoint[] {
  const span = 1 + Math.round((velocity / 127) * 4);
  const y = cy + 1;
  const symbol =
    velocity >= 85
      ? GRAMMAR_SYMBOLS.densityHigh
      : velocity >= 43
        ? GRAMMAR_SYMBOLS.densityMedium
        : GRAMMAR_SYMBOLS.densityLow;
  const glyphs: GlyphPoint[] = [];

  for (let dx = -span; dx <= span; dx += 1) {
    glyphs.push(clampPoint({ x: cx + dx, y, symbol }));
    if (velocity >= 60) {
      glyphs.push(clampPoint({ x: cx + dx, y: y + 1, symbol: GRAMMAR_SYMBOLS.softParticle }));
    }
  }

  return glyphs;
}

/** Horizontal density band across the canvas. */
export function horizontalBandGlyphs(
  y: number,
  span: number,
  symbol: GrammarSymbol,
  fill = false,
): GlyphPoint[] {
  const glyphs: GlyphPoint[] = [];

  for (let dx = -span; dx <= span; dx += 1) {
    glyphs.push(clampPoint({ x: GRID_CENTER_X + dx, y, symbol }));
    if (fill && dx % 2 === 0) {
      glyphs.push(clampPoint({ x: GRID_CENTER_X + dx, y: y + 1, symbol: GRAMMAR_SYMBOLS.softParticle }));
    }
  }

  return glyphs;
}

/** Vertical growth column. */
export function verticalColumnGlyphs(x: number, y0: number, y1: number, symbol: GrammarSymbol): GlyphPoint[] {
  const glyphs: GlyphPoint[] = [];
  const start = Math.min(y0, y1);
  const end = Math.max(y0, y1);

  for (let y = start; y <= end; y += 1) {
    glyphs.push(clampPoint({ x, y, symbol }));
  }

  return glyphs;
}

/** Diamond / flower burst for bloom and harmony. */
export function diamondBurstGlyphs(cx: number, cy: number, span: number): GlyphPoint[] {
  return clampGlyphs([
    { x: cx - span, y: cy, symbol: GRAMMAR_SYMBOLS.diagUpRight },
    { x: cx + span, y: cy, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    { x: cx, y: cy - span, symbol: GRAMMAR_SYMBOLS.vertical },
    { x: cx, y: cy + span, symbol: GRAMMAR_SYMBOLS.vertical },
    { x: cx - span, y: cy - span, symbol: GRAMMAR_SYMBOLS.active },
    { x: cx + span, y: cy - span, symbol: GRAMMAR_SYMBOLS.active },
    { x: cx - span, y: cy + span, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx + span, y: cy + span, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx - span, y: cy, symbol: GRAMMAR_SYMBOLS.horizontal },
    { x: cx + span, y: cy, symbol: GRAMMAR_SYMBOLS.horizontal },
    { x: cx, y: cy, symbol: GRAMMAR_SYMBOLS.intersection },
    ...ringGlyphs(cx, cy, span + 1, GRAMMAR_SYMBOLS.softParticle),
  ]);
}

/** Scattered particle field — density scales with count. */
export function scatterFieldGlyphs(
  cx: number,
  cy: number,
  count: number,
  spreadX: number,
  spreadY: number,
  symbol: GrammarSymbol,
): GlyphPoint[] {
  const glyphs: GlyphPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radiusX = spreadX * (0.35 + (i % 5) * 0.12);
    const radiusY = spreadY * (0.35 + (i % 4) * 0.14);
    glyphs.push(
      clampPoint({
        x: Math.round(cx + Math.cos(angle) * radiusX),
        y: Math.round(cy + Math.sin(angle) * radiusY),
        symbol: i % 3 === 0 ? GRAMMAR_SYMBOLS.softParticle : symbol,
      }),
    );
  }

  return glyphs;
}

/** Connect multiple focal points into a web (pollination / mycelium). */
export function connectionWebGlyphs(points: { x: number; y: number }[]): GlyphPoint[] {
  if (points.length < 2) {
    return [];
  }

  const glyphs: GlyphPoint[] = [];

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      glyphs.push(...signalPathFromCenter(
        Math.round((points[i].x + points[j].x) / 2),
        Math.round((points[i].y + points[j].y) / 2),
        6,
      ));
    }
    glyphs.push(...signalPathFromCenter(points[i].x, points[i].y, 10));
  }

  return glyphs;
}

/** Rich dormant breathing field. */
export function dormantBreathGlyphs(): GlyphPoint[] {
  return clampGlyphs([
    { x: GRID_CENTER_X, y: GRID_CENTER_Y, symbol: GRAMMAR_SYMBOLS.dormant },
    ...ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, 2, GRAMMAR_SYMBOLS.softParticle),
    ...horizontalBandGlyphs(GRID_CENTER_Y + 2, 3, GRAMMAR_SYMBOLS.densityLow, true),
    ...horizontalBandGlyphs(GRID_CENTER_Y - 2, 2, GRAMMAR_SYMBOLS.softParticle),
  ]);
}

/** Audio-on idle sprout / ecosystem seed from grammar. */
export function idleEcosystemGlyphs(): GlyphPoint[] {
  const cx = GRID_CENTER_X;
  const cy = GRID_CENTER_Y;

  return clampGlyphs([
    { x: cx, y: cy + 3, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx, y: cy + 2, symbol: GRAMMAR_SYMBOLS.vertical },
    { x: cx, y: cy + 1, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx, y: cy, symbol: GRAMMAR_SYMBOLS.intersection },
    { x: cx, y: cy - 1, symbol: GRAMMAR_SYMBOLS.vertical },
    { x: cx, y: cy - 2, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx, y: cy - 3, symbol: GRAMMAR_SYMBOLS.active },
    { x: cx - 4, y: cy, symbol: GRAMMAR_SYMBOLS.diagUpRight },
    { x: cx - 6, y: cy, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx + 4, y: cy, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    { x: cx + 6, y: cy, symbol: GRAMMAR_SYMBOLS.seed },
    { x: cx - 3, y: cy - 1, symbol: GRAMMAR_SYMBOLS.horizontal },
    { x: cx + 3, y: cy - 1, symbol: GRAMMAR_SYMBOLS.horizontal },
    ...horizontalBandGlyphs(cy + 4, 8, GRAMMAR_SYMBOLS.densityLow, true),
    ...scatterFieldGlyphs(cx, cy - 5, 12, 10, 4, GRAMMAR_SYMBOLS.softParticle),
  ]);
}

/** Transport / chord burst when Play is active without held keys. */
export function transportChordBurstGlyphs(): GlyphPoint[] {
  return clampGlyphs([
    ...diamondBurstGlyphs(GRID_CENTER_X, GRID_CENTER_Y - 4, 4),
    ...horizontalBandGlyphs(GRID_CENTER_Y + 2, 10, GRAMMAR_SYMBOLS.densityMedium, true),
    ...verticalColumnGlyphs(GRID_CENTER_X - 6, GRID_CENTER_Y - 2, GRID_CENTER_Y + 2, GRAMMAR_SYMBOLS.vertical),
    ...verticalColumnGlyphs(GRID_CENTER_X + 6, GRID_CENTER_Y - 2, GRID_CENTER_Y + 2, GRAMMAR_SYMBOLS.vertical),
    ...scatterFieldGlyphs(GRID_CENTER_X, GRID_CENTER_Y, 24, 14, 8, GRAMMAR_SYMBOLS.seed),
  ]);
}

/** Amplify glyph count from interaction intensity (0–100). */
export function interactionScatterGlyphs(boost: number): GlyphPoint[] {
  if (boost < 8) {
    return [];
  }

  const count = Math.round((boost / 100) * 40);
  return scatterFieldGlyphs(
    GRID_CENTER_X,
    GRID_CENTER_Y,
    count,
    18,
    10,
    boost >= 50 ? GRAMMAR_SYMBOLS.densityMedium : GRAMMAR_SYMBOLS.softParticle,
  );
}
