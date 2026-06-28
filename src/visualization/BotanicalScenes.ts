import { paintPlantasiaTitle } from './PlantasiaTitle';
import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import { paintSliderReactiveOverlays, type SliderVizState } from './SliderVisualEffects';
import type { PresetTheme } from './types';

export type ScenePaintFn = (x: number, y: number, char: string, priority: number) => void;

export type SceneContext = {
  width: number;
  height: number;
  theme: PresetTheme;
  time: number;
  energy: number;
  amplitude: number;
  animSpeed: number;
  sliders: SliderVizState;
  interactionPulse: number;
  paint: ScenePaintFn;
};

/** Paint a full-frame representational botanical scene — unique per preset. */
export function paintBotanicalScene(ctx: SceneContext): void {
  switch (ctx.theme.id) {
    case 'root':
      paintRootForest(ctx);
      break;
    case 'bloom':
      paintBloomGarden(ctx);
      break;
    case 'mycelium':
      paintMyceliumWeb(ctx);
      break;
    case 'mutation':
      paintMutationChaos(ctx);
      break;
    case 'fern':
      paintFernGrove(ctx);
      break;
    case 'coral':
      paintCoralReef(ctx);
      break;
    case 'vine':
      paintVineCanopy(ctx);
      break;
    case 'crystal':
      paintCrystalGarden(ctx);
      break;
    case 'juno-flowers':
      paintJunoMeadow(ctx);
      break;
    case 'seed':
    default:
      paintSeedSprouts(ctx);
      break;
  }

  paintPlantasiaTitle(ctx);

  paintSliderReactiveOverlays(
    ctx.width,
    ctx.height,
    ctx.theme,
    ctx.sliders,
    ctx.time,
    ctx.paint,
    ctx.interactionPulse,
  );
}

function paintSeedSprouts(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const breathe = Math.sin(time * 0.6 * animSpeed) * 0.5 + 0.5;
  const sproutDensity = 0.5 + ctx.sliders.growthRate * 0.8 + ctx.sliders.energy * 0.5;

  for (let x = 0; x < width; x += 1) {
    paint(x, ground, pickThemeChar(theme, x), 2);
    paint(x, ground + 1, '.', 1);
    if (x % 2 === 0) {
      paint(x, ground - 1, ',', 1);
    }
  }

  const sproutCount = Math.max(5, Math.floor((width / 8) * sproutDensity));
  for (let i = 0; i < sproutCount; i += 1) {
    const x = Math.floor((i + 0.5) * (width / sproutCount));
    const h = Math.round(3 + breathe * 2 + (i % 3));
    for (let dy = 0; dy <= h; dy += 1) {
      const sway = Math.round(Math.sin(time * 1.2 + i + dy * 0.3) * (dy > 1 ? 1 : 0));
      const char = dy === h ? pickThemeAccent(theme, i) : dy === 0 ? '|' : pickThemeChar(theme, i + dy);
      paint(x + sway, ground - dy, char, 3);
    }
    if (h >= 2) {
      paint(x - 1, ground - h + 1, "'", 2);
      paint(x + 1, ground - h + 1, "'", 2);
    }
  }

  fillAtmosphere(ctx, 0.12, 0.35);
}

function paintRootForest(ctx: SceneContext): void {
  const { width, height, theme, time, amplitude, paint } = ctx;
  const ground = height - 2;
  const pulse = amplitude * 0.4 + Math.sin(time * 0.8) * 0.1;

  for (let y = ground - Math.floor(height * 0.15); y <= ground + 1; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const depth = (y - ground) / (height * 0.15);
      const char = depth > 0.5 ? '█' : depth > 0 ? '▓' : pickThemeChar(theme, x + y);
      paint(x, y, char, 2);
    }
  }

  const trunkSpacing = Math.max(6, Math.floor(width / 6));
  for (let i = 0; i <= Math.ceil(width / trunkSpacing); i += 1) {
    const x = i * trunkSpacing + Math.floor(trunkSpacing / 2);
    if (x >= width) {
      break;
    }
    const trunkH = Math.floor(height * (0.45 + (i % 3) * 0.08));
    for (let dy = 0; dy < trunkH; dy += 1) {
      const char = dy < trunkH * 0.3 ? '█' : dy < trunkH * 0.7 ? '▓' : '#';
      paint(x, ground - dy, char, 4);
    }
    paint(x - 1, ground - trunkH + 2, '/', 3);
    paint(x + 1, ground - trunkH + 2, '\\', 3);
  }

  for (let x = 0; x < width; x += 1) {
    for (let y = Math.floor(height * 0.35); y < ground - 1; y += 1) {
      const rootNoise = Math.sin(x * 0.4 + y * 0.25 + time * 0.2) + Math.cos(y * 0.5 - x * 0.15);
      if (rootNoise > 0.2 + pulse) {
        const char = rootNoise > 0.8 ? '|' : rootNoise > 0.5 ? '/' : '\\';
        paint(x, y, char, 3);
      }
    }
  }

  for (let x = 0; x < width; x += 2) {
    if (Math.sin(x * 0.7 + time) > 0.3) {
      paint(x, ground - 1, '@', 2);
    }
  }
}

function paintBloomGarden(ctx: SceneContext): void {
  const { width, height, theme, time, amplitude, paint } = ctx;
  const ground = height - 2;

  for (let x = 0; x < width; x += 1) {
    paint(x, ground, '-', 2);
    paint(x, ground + 1, '.', 1);
  }

  const flowers = Math.max(4, Math.floor(width / 10));
  for (let i = 0; i < flowers; i += 1) {
    const cx = Math.floor((i + 0.5) * (width / flowers));
    const stemH = Math.floor(height * (0.25 + (i % 4) * 0.06));
    const bloom = 1 + amplitude * 2 + Math.sin(time * 2 + i) * 0.5;

    for (let dy = 0; dy < stemH; dy += 1) {
      paint(cx, ground - dy, '|', 3);
    }

    const fy = ground - stemH;
    paintFlower(paint, cx, fy, theme, i, bloom, 4);
  }

  for (let x = 0; x < width; x += 3) {
    const leafY = ground - 2 - (x % 5);
    paint(x, leafY, '/', 2);
    paint(x + 1, leafY - 1, pickThemeChar(theme, x), 2);
  }
}

function paintMyceliumWeb(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const hubCount = Math.max(8, Math.floor((width * height) / 80));

  const hubs: { x: number; y: number }[] = [];
  for (let i = 0; i < hubCount; i += 1) {
    hubs.push({
      x: Math.floor(pseudo(i, 1) * width),
      y: Math.floor(pseudo(i, 2) * height),
    });
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const fog = Math.sin(x * 0.2 + y * 0.15 + time * 0.15) * Math.cos(y * 0.1);
      if (fog > 0.55) {
        paint(x, y, pickThemeChar(theme, x + y), 1);
      }
    }
  }

  for (let i = 0; i < hubs.length; i += 1) {
    for (let j = i + 1; j < hubs.length; j += 1) {
      const a = hubs[i];
      const b = hubs[j];
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (dist < width * 0.45 && pseudo(i, j) > 0.35) {
        drawFilament(paint, a.x, a.y, b.x, b.y, pickThemeChar(theme, i + j), 3);
      }
    }
    paint(hubs[i].x, hubs[i].y, pickThemeAccent(theme, i), 4);
  }

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 1) {
      if (Math.sin(x * 0.5 + y * 0.3 + time * 0.4) > 0.65) {
        paint(x, y, '·', 2);
      }
    }
  }
}

function paintMutationChaos(ctx: SceneContext): void {
  const { width, height, theme, time, amplitude, paint } = ctx;
  const glitch = Math.sin(time * 4) * 0.5 + 0.5;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const n = Math.abs(Math.sin(x * 0.8 + time) * Math.cos(y * 0.6 - time * 0.5));
      const mirror = Math.abs(x - width / 2) < 2 ? 1 : 0;
      if (n > 0.35 - amplitude * 0.2 || mirror) {
        const char =
          n > 0.75 ? pickThemeAccent(theme, x + y)
          : n > 0.55 ? '#'
          : n > 0.4 ? 'x'
          : pickThemeChar(theme, x * y);
        paint(x, y, char, 2);
      }
    }
  }

  for (let i = 0; i < width; i += Math.max(4, Math.floor(width / 12))) {
    const h = Math.floor(height * (0.3 + pseudo(i, 9) * 0.4));
    for (let dy = 0; dy < h; dy += 1) {
      const gx = i + Math.round(Math.sin(time * 3 + dy) * glitch * 2);
      paint(gx, height - 2 - dy, dy % 2 === 0 ? 'X' : '@', 3);
    }
  }
}

function paintFernGrove(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const ground = height - 2;

  for (let x = 0; x < width; x += 1) {
    paint(x, ground, '~', 2);
    paint(x, ground + 1, '░', 1);
    if (x % 3 === 0) {
      paint(x, ground - 1, ',', 1);
    }
  }

  const frondPositions = [Math.floor(width * 0.12), Math.floor(width * 0.35), Math.floor(width * 0.65), Math.floor(width * 0.88)];
  for (let fi = 0; fi < frondPositions.length; fi += 1) {
    paintFernFrond(paint, frondPositions[fi], ground, height, theme, fi, time);
  }

  fillAtmosphere(ctx, 0.08, 0.25);
}

function paintCoralReef(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const layers = 5;

  for (let layer = 0; layer < layers; layer += 1) {
    const y = Math.floor((height / (layers + 1)) * (layer + 1));
    for (let x = 0; x < width; x += 1) {
      const wave = Math.sin(x * 0.12 + time * 0.3 + layer) * 2;
      const ly = y + Math.round(wave);
      if (ly >= 0 && ly < height) {
        paint(x, ly, layer % 2 === 0 ? '~' : pickThemeChar(theme, x + layer), 2);
      }
    }
  }

  const coralCount = Math.max(6, Math.floor(width / 8));
  for (let i = 0; i < coralCount; i += 1) {
    const cx = Math.floor((i + 0.5) * (width / coralCount));
    const base = height - 2;
    const h = Math.floor(height * (0.15 + (i % 3) * 0.08));
    paint(cx, base, 'Y', 3);
    paint(cx - 1, base - 1, '/', 3);
    paint(cx + 1, base - 1, '\\', 3);
    for (let dy = 2; dy <= h; dy += 1) {
      paint(cx, base - dy, '|', 3);
      if (dy % 2 === 0) {
        paint(cx - 1, base - dy, 'Y', 2);
        paint(cx + 1, base - dy, 'Y', 2);
      }
    }
    paint(cx, base - h, '◌', 4);
  }

  for (let y = 0; y < Math.floor(height * 0.5); y += 2) {
    for (let x = 0; x < width; x += 4) {
      if (Math.sin(x + y + time) > 0.5) {
        paint(x, y, '○', 2);
      }
    }
  }
}

function paintVineCanopy(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;

  const vineCount = Math.max(8, Math.floor(width / 5));
  for (let i = 0; i < vineCount; i += 1) {
    const x = Math.floor((i + 0.5) * (width / vineCount));
    const len = Math.floor(height * (0.55 + (i % 4) * 0.1));
    for (let dy = 0; dy < len; dy += 1) {
      const sway = Math.round(Math.sin(time * 0.8 + i + dy * 0.15) * 1.5);
      const vx = x + sway;
      const char = dy % 4 === 0 ? '~' : dy % 3 === 0 ? '|' : pickThemeChar(theme, i + dy);
      paint(vx, dy + 1, char, 3);
      if (dy % 5 === 2) {
        paint(vx - 1, dy + 2, '(', 2);
        paint(vx + 1, dy + 2, ')', 2);
      }
    }
  }

  for (let x = 0; x < width; x += 1) {
    paint(x, 0, pickThemeChar(theme, x), 2);
    paint(x, height - 1, '.', 1);
    paint(x, height - 2, ',', 1);
  }
}

function paintCrystalGarden(ctx: SceneContext): void {
  const { width, height, theme, time, amplitude, paint } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const shimmer = amplitude + Math.sin(time * 1.5) * 0.3;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      if ((dx + dy) % 3 === 0 && pseudo(x, y) > 0.4) {
        paint(x, y, pickThemeChar(theme, x + y), 1);
      }
    }
  }

  const spokes = 8;
  for (let s = 0; s < spokes; s += 1) {
    const angle = (s / spokes) * Math.PI * 2 + time * 0.1;
    const len = Math.min(width, height) * 0.45;
    drawFilament(paint, cx, cy, cx + Math.round(Math.cos(angle) * len), cy + Math.round(Math.sin(angle) * len * 0.6), '+', 3);
  }

  const clusters = [
    { x: Math.floor(width * 0.2), y: Math.floor(height * 0.6) },
    { x: Math.floor(width * 0.8), y: Math.floor(height * 0.6) },
    { x: Math.floor(width * 0.35), y: Math.floor(height * 0.35) },
    { x: Math.floor(width * 0.65), y: Math.floor(height * 0.35) },
    { x: cx, y: Math.floor(height * 0.75) },
  ];

  for (let i = 0; i < clusters.length; i += 1) {
    const c = clusters[i];
    paintCrystalCluster(paint, c.x, c.y, theme, i, shimmer);
  }

  paint(cx, cy, pickThemeAccent(theme, Math.floor(time)), 5);
}

function paintJunoMeadow(ctx: SceneContext): void {
  const { width, height, theme, time, amplitude, paint } = ctx;
  const ground = height - 2;

  for (let x = 0; x < width; x += 1) {
    paint(x, ground, '-', 2);
    for (let y = ground - 1; y >= ground - 3; y -= 1) {
      if (x % 2 === y % 2) {
        paint(x, y, ',', 1);
      }
    }
  }

  const cols = Math.max(3, Math.floor(width / 14));
  const rows = Math.max(2, Math.floor((height - 4) / 10));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = Math.floor((col + 0.5) * (width / cols));
      const stemH = Math.floor(height * (0.12 + (row % 2) * 0.06));
      const fy = ground - stemH;
      for (let dy = 0; dy < stemH; dy += 1) {
        paint(cx, ground - dy, '|', 3);
      }
      const bloom = 1.2 + amplitude + Math.sin(time * 1.8 + col + row) * 0.4;
      paintFlower(paint, cx, fy, theme, col + row * 10, bloom, 4);
    }
  }
}

function paintFlower(
  paint: ScenePaintFn,
  cx: number,
  cy: number,
  theme: PresetTheme,
  seed: number,
  scale: number,
  priority: number,
): void {
  const r = Math.max(1, Math.round(scale));
  const petal = pickThemeAccent(theme, seed);
  const core = pickThemeChar(theme, seed + 1);
  paint(cx, cy, core, priority);
  paint(cx - r, cy, petal, priority);
  paint(cx + r, cy, petal, priority);
  paint(cx, cy - r, petal, priority);
  paint(cx, cy + r, petal, priority);
  if (r > 1) {
    paint(cx - 1, cy - 1, pickThemeChar(theme, seed + 2), priority - 1);
    paint(cx + 1, cy - 1, pickThemeChar(theme, seed + 3), priority - 1);
    paint(cx - 1, cy + 1, pickThemeChar(theme, seed + 4), priority - 1);
    paint(cx + 1, cy + 1, pickThemeChar(theme, seed + 5), priority - 1);
  }
}

function paintFernFrond(
  paint: ScenePaintFn,
  baseX: number,
  baseY: number,
  height: number,
  theme: PresetTheme,
  index: number,
  time: number,
): void {
  const frondH = Math.floor(height * 0.7);
  const dir = index % 2 === 0 ? -1 : 1;
  for (let dy = 0; dy < frondH; dy += 1) {
    const sway = Math.round(Math.sin(time * 0.5 + dy * 0.08) * 1.2);
    const cx = baseX + sway;
    const cy = baseY - dy;
    paint(cx, cy, '|', 3);
    const leafSpan = Math.floor((dy / frondH) * 6) + 1;
    for (let lx = 1; lx <= leafSpan; lx += 1) {
      paint(cx + lx * dir, cy, '/', 2);
      paint(cx + lx * dir, cy - 1, pickThemeChar(theme, dy + lx), 2);
      if (dy % 3 === 0) {
        paint(cx - lx * dir, cy, '\\', 2);
      }
    }
    if (dy === frondH - 1) {
      paint(cx, cy, '~', 4);
    }
  }
}

function paintCrystalCluster(
  paint: ScenePaintFn,
  cx: number,
  cy: number,
  theme: PresetTheme,
  seed: number,
  shimmer: number,
): void {
  const h = Math.round(3 + shimmer * 4);
  for (let dy = 0; dy < h; dy += 1) {
    paint(cx, cy - dy, dy === 0 ? '◆' : '|', 4);
    paint(cx - 1, cy - dy, '/', 3);
    paint(cx + 1, cy - dy, '\\', 3);
  }
  paint(cx, cy - h, pickThemeAccent(theme, seed), 5);
  paint(cx - 2, cy - 1, 'x', 3);
  paint(cx + 2, cy - 1, 'x', 3);
}

function fillAtmosphere(ctx: SceneContext, minY: number, density: number): void {
  const { width, height, theme, time, paint } = ctx;
  const top = Math.floor(height * minY);
  for (let y = 0; y < top; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (Math.sin(x * 0.25 + y * 0.2 + time * 0.2) > 1 - density * 2) {
        paint(x, y, pickThemeChar(theme, x + y + Math.floor(time)), 1);
      }
    }
  }
}

function drawFilament(
  paint: ScenePaintFn,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  char: string,
  priority: number,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    paint(x, y, i % 2 === 0 ? char : '·', priority);
  }
}

function pseudo(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
