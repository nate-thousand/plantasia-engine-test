import { BitmapFont } from 'pixi.js';
import { SYMBOL_PALETTES } from '../visualization/ShapeComposition';

export const PLANTASIA_BITMAP_FONT = 'PlantasiaMono';

const BASE_CHARS =
  " .'`\"|/\\Y,#%?_°*o+∘~=-:·▪ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function collectGlyphChars(): string[] {
  const set = new Set<string>(BASE_CHARS.split(''));
  for (const palette of Object.values(SYMBOL_PALETTES)) {
    for (const char of palette) {
      set.add(char);
    }
  }
  return Array.from(set);
}

let installPromise: Promise<void> | null = null;
let fontInstalled = false;

/** Install monospace bitmap font for ASCII glyph rendering. */
export function ensurePlantasiaBitmapFont(fontSize = 16): Promise<void> {
  if (fontInstalled) {
    return Promise.resolve();
  }
  if (installPromise) {
    return installPromise;
  }

  installPromise = (async () => {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }
    const chars = collectGlyphChars();
    BitmapFont.install({
      name: PLANTASIA_BITMAP_FONT,
      style: {
        fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        fontSize,
        fill: '#ffffff',
      },
      chars: [chars],
    });
    fontInstalled = true;
  })().catch((error) => {
    installPromise = null;
    throw error;
  });

  return installPromise;
}
