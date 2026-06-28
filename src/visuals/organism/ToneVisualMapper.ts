import type { SoundControlValues } from '../../types/instrument';
import { GRAMMAR_SYMBOLS, type GrammarSymbol } from './GrammarSymbols';
import { GRID_CENTER_X, GRID_CENTER_Y } from './gridConstants';
import type { Organism } from './Organism';
import { Edge } from './Edge';
import {
  diamondBurstGlyphs,
  horizontalBandGlyphs,
  ringGlyphs,
  scatterFieldGlyphs,
  verticalColumnGlyphs,
  type GlyphPoint,
} from './VisualGlyphs';

export type ToneVisualGlyphs = {
  id: string;
  pathGlyphs: GlyphPoint[];
};

/** Volume (0–100) → visual amplitude / density intensity multiplier. */
export function volumeIntensity(volume: number): number {
  return 0.35 + (volume / 100) * 0.65;
}

/** Tone (0–100) → brightness emphasis on active nodes. */
export function toneBrightnessSymbol(tone: number): GrammarSymbol {
  if (tone >= 75) {
    return GRAMMAR_SYMBOLS.active;
  }
  if (tone >= 40) {
    return GRAMMAR_SYMBOLS.seed;
  }
  return GRAMMAR_SYMBOLS.softParticle;
}

/** Volume rings + lower particle cascade. */
export function volumeAmplitudeGlyphs(volume: number): ToneVisualGlyphs {
  const span = Math.round((volume / 100) * 10);
  const rings =
    volume >= 50
      ? ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, 3 + Math.round(volume / 25), GRAMMAR_SYMBOLS.densityMedium)
      : [];

  return {
    id: 'tone-volume-amplitude',
    pathGlyphs: [
      ...rings,
      ...horizontalBandGlyphs(GRID_CENTER_Y + 5, span, GRAMMAR_SYMBOLS.densityLow, true),
      ...horizontalBandGlyphs(GRID_CENTER_Y + 6, Math.max(2, span - 2), GRAMMAR_SYMBOLS.softParticle, true),
      ...scatterFieldGlyphs(GRID_CENTER_X, GRID_CENTER_Y + 4, Math.round(volume / 8), span, 2, GRAMMAR_SYMBOLS.seed),
    ],
  };
}

/** Texture (0–100) → multi-row ░▒▓ field. */
export function textureBandGlyphs(texture: number): ToneVisualGlyphs | null {
  if (texture < 8) {
    return null;
  }

  const symbol =
    texture >= 70
      ? GRAMMAR_SYMBOLS.densityHigh
      : texture >= 40
        ? GRAMMAR_SYMBOLS.densityMedium
        : GRAMMAR_SYMBOLS.densityLow;

  const span = Math.round((texture / 100) * 14);
  const glyphs: GlyphPoint[] = [];

  for (let row = 0; row < 3; row += 1) {
    glyphs.push(...horizontalBandGlyphs(GRID_CENTER_Y + 4 + row, span - row, symbol, row === 1));
  }

  glyphs.push(
    ...verticalColumnGlyphs(GRID_CENTER_X - span, GRID_CENTER_Y + 2, GRID_CENTER_Y + 6, GRAMMAR_SYMBOLS.densityLow),
    ...verticalColumnGlyphs(GRID_CENTER_X + span, GRID_CENTER_Y + 2, GRID_CENTER_Y + 6, GRAMMAR_SYMBOLS.densityLow),
  );

  return { id: 'tone-texture-band', pathGlyphs: glyphs };
}

/** Bloom (0–100) → large bloom cross + fibonacci band. */
export function bloomStructureGlyphs(bloom: number): ToneVisualGlyphs | null {
  if (bloom < 10) {
    return null;
  }

  const span = 2 + Math.round((bloom / 100) * 6);
  const y = GRID_CENTER_Y - 6;

  const glyphs: GlyphPoint[] = [
    ...diamondBurstGlyphs(GRID_CENTER_X, y, span),
    ...diamondBurstGlyphs(GRID_CENTER_X, y - span, Math.max(1, span - 1)),
  ];

  for (let i = 0; i <= span + 2; i += 1) {
    glyphs.push({ x: GRID_CENTER_X - span + i, y: y + span + 1, symbol: GRAMMAR_SYMBOLS.seed });
  }

  return { id: 'tone-bloom-structure', pathGlyphs: glyphs };
}

/** Tone slider halo — multi-ring brightness field. */
export function toneHighlightGlyphs(tone: number): ToneVisualGlyphs | null {
  if (tone < 15) {
    return null;
  }

  const spread = 2 + Math.round((tone / 100) * 6);
  const symbol = toneBrightnessSymbol(tone);
  const glyphs: GlyphPoint[] = [
    ...ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, spread, symbol),
    ...ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, spread + 2, GRAMMAR_SYMBOLS.softParticle),
  ];

  for (let dx = -spread; dx <= spread; dx += 1) {
    for (let dy = -spread; dy <= spread; dy += 1) {
      if (Math.abs(dx) + Math.abs(dy) === spread) {
        glyphs.push({ x: GRID_CENTER_X + dx, y: GRID_CENTER_Y + dy, symbol });
      }
    }
  }

  return { id: 'tone-brightness-halo', pathGlyphs: glyphs };
}

export function applyToneVisuals(
  organism: Organism,
  sound: SoundControlValues,
  anchorNodeId: string,
): void {
  const layers = [
    volumeAmplitudeGlyphs(sound.volume),
    textureBandGlyphs(sound.texture),
    bloomStructureGlyphs(sound.bloom),
    toneHighlightGlyphs(sound.tone),
  ].filter((layer): layer is ToneVisualGlyphs => layer != null);

  for (const layer of layers) {
    organism.addEdge(
      new Edge({
        id: layer.id,
        from: anchorNodeId,
        to: anchorNodeId,
        kind: 'signalFlow',
        pathGlyphs: layer.pathGlyphs,
      }),
    );
  }
}
