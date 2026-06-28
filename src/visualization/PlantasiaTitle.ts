import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import { FEEDBACK_GAIN } from './VisualFeedback';
import type { SceneContext } from './BotanicalScenes';
import type { PresetTheme } from './types';

type FigletBanner = readonly string[];

/** Classic underscore / pipe figlet. */
const PLANTASIA_BANNER_CLASSIC: FigletBanner = [
  '__________.__                 __                             .__        ',
  '\\______   \\  | _____    _____/  |______    __________   ____ |__| ____  ',
  ' |     ___/  | \\__  \\  /    \\   __\\__  \\  /  ___/  _ \\ /    \\|  |/ ___\\ ',
  ' |    |   |  |__/ __ \\|   |  \\  |  / __ \\_\\___ (  <_> )   |  \\  \\  \\___ ',
  ' |____|   |____(____  /___|  /__| (____  /____  >____/|___|  /__|\\___  >',
  '                    \\/     \\/          \\/     \\/           \\/        \\/ ',
];

/** Block-letter figlet (wide). */
const PLANTASIA_BANNER_BLOCK: FigletBanner = [
  'PPPPPPPPPPPPPPPPP   lllllll                                             tttt                                                                                 iiii                       ',
  'P::::::::::::::::P  l:::::l                                          ttt:::t                                                                                i::::i                      ',
  'P::::::PPPPPP:::::P l:::::l                                          t:::::t                                                                                 iiii                       ',
  'PP:::::P     P:::::Pl:::::l                                          t:::::t                                                                                                            ',
  '  P::::P     P:::::P l::::l   aaaaaaaaaaaaa  nnnn  nnnnnnnn    ttttttt:::::ttttttt      aaaaaaaaaaaaa      ssssssssss      ooooooooooo   nnnn  nnnnnnnn    iiiiiii     cccccccccccccccc',
  '  P::::P     P:::::P l::::l   a::::::::::::a n:::nn::::::::nn  t:::::::::::::::::t      a::::::::::::a   ss::::::::::s   oo:::::::::::oo n:::nn::::::::nn  i:::::i   cc:::::::::::::::c',
  '  P::::PPPPPP:::::P  l::::l   aaaaaaaaa:::::an::::::::::::::nn t:::::::::::::::::t      aaaaaaaaa:::::ass:::::::::::::s o:::::::::::::::on::::::::::::::nn  i::::i  c:::::::::::::::::c ',
  '  P:::::::::::::PP   l::::l            a::::ann:::::::::::::::ntttttt:::::::tttttt               a::::as::::::ssss:::::so:::::ooooo:::::onn:::::::::::::::n i::::i c:::::::cccccc:::::c ',
  '  P::::PPPPPPPPP     l::::l     aaaaaaa:::::a  n:::::nnnn:::::n      t:::::t              aaaaaaa:::::a s:::::s  ssssss o::::o     o::::o  n:::::nnnn:::::n i::::i c::::::c     ccccccc',
  '  P::::P             l::::l   aa::::::::::::a  n::::n    n::::n      t:::::t            aa::::::::::::a   s::::::s      o::::o     o::::o  n::::n    n::::n i::::i c:::::c             ',
  '  P::::P             l::::l  a::::aaaa::::::a  n::::n    n::::n      t:::::t           a::::aaaa::::::a      s::::::s   o::::o     o::::o  n::::n    n::::n i::::i c:::::c             ',
  '  P::::P             l::::l a::::a    a:::::a  n::::n    n::::n      t:::::t    tttttta::::a    a:::::assssss   s:::::s o::::o     o::::o  n::::n    n::::n i::::i c::::::c     ccccccc',
  'PP::::::PP          l::::::la::::a    a:::::a  n::::n    n::::n      t::::::tttt:::::ta::::a    a:::::as:::::ssss::::::so:::::ooooo:::::o  n::::n    n::::ni::::::ic:::::::cccccc:::::c',
  'P::::::::P          l::::::la:::::aaaa::::::a  n::::n    n::::n      tt::::::::::::::ta:::::aaaa::::::as::::::::::::::s o:::::::::::::::o  n::::n    n::::ni::::::i c:::::::::::::::::c',
  'P::::::::P          l::::::l a::::::::::aa:::a n::::n    n::::n        tt:::::::::::tt a::::::::::aa:::as:::::::::::ss   oo:::::::::::oo   n::::n    n::::ni::::::i  cc:::::::::::::::c',
  'PPPPPPPPPP          llllllll  aaaaaaaaaa  aaaa nnnnnn    nnnnnn          ttttttttttt    aaaaaaaaaa  aaaa sssssssssss       ooooooooooo     nnnnnn    nnnnnniiiiiiii    cccccccccccccccc',
];

const PLANTASIA_BANNERS: FigletBanner[] = [PLANTASIA_BANNER_CLASSIC, PLANTASIA_BANNER_BLOCK];

type BannerMetrics = { width: number; height: number };

function bannerMetrics(banner: FigletBanner): BannerMetrics {
  return {
    width: Math.max(...banner.map((line) => line.length)),
    height: banner.length,
  };
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function bannerFits(banner: FigletBanner, width: number, height: number): boolean {
  const { width: bannerWidth, height: bannerHeight } = bannerMetrics(banner);
  return width >= bannerWidth * 0.75 && height >= bannerHeight + 4;
}

/** Pick a random banner variant per preset; prefer the hashed choice, fall back to the other. */
function pickBanner(themeId: string, width: number, height: number): FigletBanner | null {
  const primary = hashSeed(themeId) % PLANTASIA_BANNERS.length;
  const order = [primary, ...PLANTASIA_BANNERS.map((_, i) => i).filter((i) => i !== primary)];

  for (const index of order) {
    const banner = PLANTASIA_BANNERS[index];
    if (banner && bannerFits(banner, width, height)) {
      return banner;
    }
  }

  return null;
}

function themeBannerY(_theme: PresetTheme): number {
  return 0;
}

function themeTitlePriority(theme: PresetTheme, pulse: number): number {
  const base =
    theme.id === 'mycelium' || theme.id === 'root' ? 5 : theme.id === 'mutation' ? 6 : 4;
  return pulse > 0.2 ? Math.min(9, base + Math.round(pulse * 3)) : base;
}

function bannerChar(
  theme: PresetTheme,
  literal: string,
  col: number,
  row: number,
  time: number,
  glow: number,
  pulse: number,
): string {
  const seed = col * 3 + row * 41 + Math.floor(time * (1.5 + pulse * 4));

  if (theme.id === 'mutation' && pulse > 0.12 && Math.sin(time * 14 + seed) > 0.92) {
    return pickThemeAccent(theme, seed);
  }

  if (theme.id === 'crystal' && glow > 0.45 && (literal === '_' || literal === '|' || literal === 'P')) {
    return Math.sin(time * 2 + col * 0.2) > 0.4 ? pickThemeAccent(theme, seed) : literal;
  }

  if (glow > 0.55 && pulse > 0.15 && (literal === '_' || literal === 'P' || literal === 'l')) {
    return pickThemeChar(theme, seed);
  }

  return literal;
}

function paintCompactFallback(ctx: SceneContext): void {
  const { width, theme, time, paint, interactionPulse, amplitude, energy } = ctx;
  const word = 'PLANTASIA';
  if (width < word.length) {
    return;
  }

  const pulse = interactionPulse / 127;
  const glow = Math.min(1.5, energy + amplitude * FEEDBACK_GAIN * 0.15 + pulse * 0.85);
  const startX = Math.floor((width - word.length) / 2);
  const y = themeBannerY(theme);

  for (let i = 0; i < word.length; i += 1) {
    const x = startX + i + Math.round(Math.sin(time * 1.4 + i * 0.55) * 0.35);
    if (x < 0 || x >= width) {
      continue;
    }
    const seed = i + Math.floor(time * 3);
    const char =
      glow > 0.35 || pulse > 0.1 ? pickThemeAccent(theme, seed) : pickThemeChar(theme, seed);
    paint(x, y, char, themeTitlePriority(theme, pulse));
  }
}

function paintFigletBanner(ctx: SceneContext, banner: FigletBanner): void {
  const { width, height, theme, time, paint, animSpeed, amplitude, energy, interactionPulse } =
    ctx;
  const { width: bannerWidth, height: bannerHeight } = bannerMetrics(banner);
  const pulse = interactionPulse / 127;
  const glow = Math.min(1.5, energy + amplitude * FEEDBACK_GAIN * 0.15 + pulse * 0.85);
  const startX = Math.floor((width - bannerWidth) / 2);
  const startY = themeBannerY(theme);
  const priority = themeTitlePriority(theme, pulse);
  const rowWobble =
    theme.id === 'coral' || theme.id === 'vine'
      ? Math.round(Math.sin(time * animSpeed * 0.8) * 0.4)
      : 0;

  for (let row = 0; row < bannerHeight; row += 1) {
    const line = banner[row] ?? '';
    const y = startY + row + (theme.id === 'crystal' ? Math.round(Math.sin(time + row) * 0.2) : 0);

    if (y < 0 || y >= height) {
      continue;
    }

    for (let col = 0; col < line.length; col += 1) {
      const literal = line[col];
      if (!literal || literal === ' ') {
        continue;
      }

      const x = startX + col + rowWobble;
      if (x < 0 || x >= width) {
        continue;
      }

      paint(x, y, bannerChar(theme, literal, col, row, time, glow, pulse), priority);
    }
  }

  if (pulse > 0.08) {
    const shimmerCount = Math.round(pulse * bannerWidth * 0.2 * FEEDBACK_GAIN);
    for (let i = 0; i < shimmerCount; i += 1) {
      const col = Math.floor((i * 5.7 + time * 30) % bannerWidth);
      const row = Math.floor((i * 2.3 + time * 12) % bannerHeight);
      const line = banner[row] ?? '';
      const literal = line[col];
      if (!literal || literal === ' ') {
        continue;
      }
      const x = startX + col;
      const y = startY + row;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        paint(x, y, pickThemeAccent(theme, i + Math.floor(time * 12)), priority + 1);
      }
    }
  }
}

/** Paint a randomized PLANTASIA figlet banner integrated into each botanical scene. */
export function paintPlantasiaTitle(ctx: SceneContext): void {
  const banner = pickBanner(ctx.theme.id, ctx.width, ctx.height);

  if (!banner) {
    paintCompactFallback(ctx);
    return;
  }

  paintFigletBanner(ctx, banner);
}
