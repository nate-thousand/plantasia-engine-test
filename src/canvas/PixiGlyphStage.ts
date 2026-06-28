import { Application, BitmapText, Container } from 'pixi.js';
import { interpolateMusicalColor } from '../visuals/colorMusicTheory';
import type { MusicalColorFrame, ShapeGlyphDrawCommand } from '../visualization/types';
import { CHAR_ASPECT } from '../visualization/viewportLayout';
import { ensurePlantasiaBitmapFont, PLANTASIA_BITMAP_FONT } from './fontAtlas';
import { GLYPH_POOL_SIZE, type GlyphLayoutMetrics } from './types';

function glyphColor(
  priority: number,
  frame: MusicalColorFrame | null,
  ambientHex: string,
): number {
  if (!frame || priority < 3 || frame.weight < 0.04) {
    return hexToNumber(ambientHex);
  }
  const tintWeight = priority >= 8 ? 1 : priority >= 5 ? 0.82 : 0.58;
  const blend = Math.min(1, Math.max(0.55, frame.weight * tintWeight + frame.bloom * 0.22));
  return hexToNumber(interpolateMusicalColor(frame.ambientHex, frame.displayHex, blend).hex);
}

function hexToNumber(hex: string): number {
  const h = hex.replace('#', '');
  return parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
}

/** GPU stage for per-glyph ASCII shape layer. */
export class PixiGlyphStage {
  private app: Application | null = null;
  private glyphLayer: Container | null = null;
  private pool: BitmapText[] = [];
  private mounted = false;
  private metrics: GlyphLayoutMetrics | null = null;

  async mount(canvas: HTMLCanvasElement): Promise<void> {
    if (this.mounted) {
      return;
    }

    await ensurePlantasiaBitmapFont(16);

    const app = new Application();
    await app.init({
      canvas,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });

    const glyphLayer = new Container();
    app.stage.addChild(glyphLayer);

    const pool: BitmapText[] = [];
    for (let i = 0; i < GLYPH_POOL_SIZE; i += 1) {
      const text = new BitmapText({
        text: ' ',
        style: { fontFamily: PLANTASIA_BITMAP_FONT, fontSize: 16 },
      });
      text.visible = false;
      text.anchor.set(0, 0);
      glyphLayer.addChild(text);
      pool.push(text);
    }

    this.app = app;
    this.glyphLayer = glyphLayer;
    this.pool = pool;
    this.mounted = true;
  }

  resize(metrics: GlyphLayoutMetrics): void {
    this.metrics = metrics;
    if (!this.app) {
      return;
    }
    this.app.renderer.resize(metrics.contentWidth, metrics.contentHeight);
    for (const text of this.pool) {
      text.style.fontSize = metrics.fontSizePx;
    }
  }

  renderGlyphs(
    glyphs: ShapeGlyphDrawCommand[],
    musicalColor: MusicalColorFrame,
    ambientColorHint: string,
  ): void {
    if (!this.app || !this.metrics) {
      return;
    }

    const charW = this.metrics.fontSizePx * CHAR_ASPECT;
    const charH = this.metrics.fontSizePx;
    const frame = musicalColor.weight > 0.02 ? musicalColor : null;
    const ambient = ambientColorHint || '#7FD88F';

    for (let i = 0; i < this.pool.length; i += 1) {
      const text = this.pool[i];
      const glyph = glyphs[i];
      if (!glyph) {
        text.visible = false;
        continue;
      }

      text.text = glyph.char;
      text.x = glyph.x * charW;
      text.y = glyph.y * charH;
      text.alpha = glyph.alpha ?? (glyph.priority >= 3 ? 0.95 : 0.82);
      text.scale.set(glyph.scale ?? 1);
      text.rotation = glyph.rotation ?? 0;
      text.tint = glyphColor(glyph.priority, frame, ambient);
      text.visible = true;
    }

    this.app.render();
  }

  getContainer(): Container | null {
    return this.glyphLayer;
  }

  dispose(): void {
    for (const text of this.pool) {
      text.destroy();
    }
    this.pool = [];
    this.glyphLayer = null;
    this.app?.destroy(true, { children: true, texture: true });
    this.app = null;
    this.mounted = false;
  }
}
