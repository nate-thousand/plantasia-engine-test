import type { MusicalColorFrame, ShapeGlyphDrawCommand } from '../visualization/types';

export type { ShapeGlyphDrawCommand as GlyphDrawCommand };

export type GlyphLayoutMetrics = {
  fontSizePx: number;
  scale: number;
  gridWidth: number;
  gridHeight: number;
  charWidthPx: number;
  contentWidth: number;
  contentHeight: number;
};

export type RenderFrameInput = {
  html: string;
  shapeGlyphs: ShapeGlyphDrawCommand[];
  metrics: GlyphLayoutMetrics;
  musicalColor: MusicalColorFrame;
  ambientColorHint: string;
};

export interface GlyphRenderBackend {
  readonly id: 'dom' | 'pixi';
  mount(host: HTMLElement, pre: HTMLPreElement, canvas?: HTMLCanvasElement | null): Promise<void>;
  resize(metrics: GlyphLayoutMetrics): void;
  render(input: RenderFrameInput): void;
  dispose(): void;
  getPixiGlyphContainer?(): import('pixi.js').Container | null;
}

export const GLYPH_POOL_SIZE = 320;

export const REF_CHAR_HEIGHT = 16;
