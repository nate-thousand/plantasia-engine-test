import type { GlyphLayoutMetrics, GlyphRenderBackend, RenderFrameInput } from './types';
import { DomPreBackend } from './DomPreBackend';
import { PixiGlyphStage } from './PixiGlyphStage';

/** Hybrid: shape glyphs on Pixi canvas; plants/particles/overlays on DOM `<pre>`. */
export class PixiGlyphBackend implements GlyphRenderBackend {
  readonly id = 'pixi' as const;

  private dom = new DomPreBackend();
  private stage: PixiGlyphStage | null = null;
  private fallback = false;

  async mount(host: HTMLElement, pre: HTMLPreElement, canvas?: HTMLCanvasElement | null): Promise<void> {
    await this.dom.mount(host, pre);

    if (!canvas) {
      this.fallback = true;
      console.warn('[Plantasia] Pixi renderer: no canvas element — falling back to DOM.');
      return;
    }

    try {
      const stage = new PixiGlyphStage();
      await stage.mount(canvas);
      this.stage = stage;
      host.dataset.renderer = 'pixi';
    } catch (error) {
      this.fallback = true;
      console.warn('[Plantasia] Pixi renderer init failed — falling back to DOM.', error);
    }
  }

  resize(metrics: GlyphLayoutMetrics): void {
    this.dom.resize(metrics);
    this.stage?.resize(metrics);
  }

  render(input: RenderFrameInput): void {
    this.dom.render(input);
    if (!this.fallback && this.stage) {
      this.stage.renderGlyphs(input.shapeGlyphs, input.musicalColor, input.ambientColorHint);
    }
  }

  dispose(): void {
    this.stage?.dispose();
    this.stage = null;
    this.dom.dispose();
  }

  getPixiGlyphContainer(): import('pixi.js').Container | null {
    return this.stage?.getContainer() ?? null;
  }
}
