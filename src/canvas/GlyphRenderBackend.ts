import type { GlyphRenderBackend } from './types';
import { DomPreBackend } from './DomPreBackend';

export type RendererMode = 'dom' | 'pixi';

export function resolveRendererMode(): RendererMode {
  const env = import.meta.env.VITE_RENDERER;
  if (env === 'pixi') {
    return 'pixi';
  }
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('renderer') === 'pixi') {
      return 'pixi';
    }
  }
  return 'dom';
}

export function isPixiRenderer(): boolean {
  return resolveRendererMode() === 'pixi';
}

export async function createGlyphRenderBackend(mode = resolveRendererMode()): Promise<GlyphRenderBackend> {
  if (mode === 'pixi') {
    const { PixiGlyphBackend } = await import('./PixiGlyphBackend');
    return new PixiGlyphBackend();
  }
  return new DomPreBackend();
}

export function buildLayoutMetrics(
  display: { fontSizePx: number; scale: number; gridWidth: number; gridHeight: number },
  charAspect: number,
): import('./types').GlyphLayoutMetrics {
  const charWidthPx = display.fontSizePx * charAspect;
  return {
    fontSizePx: display.fontSizePx,
    scale: display.scale,
    gridWidth: display.gridWidth,
    gridHeight: display.gridHeight,
    charWidthPx,
    contentWidth: display.gridWidth * charWidthPx,
    contentHeight: display.gridHeight * display.fontSizePx,
  };
}
