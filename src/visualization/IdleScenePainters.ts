/**
 * Sparse idle ASCII scenes — negative space, slow motion, no full-screen fill.
 *
 * idleHome (page load): paintIdleHomeScene — 3–7 micro-clusters, ≤5% coverage.
 * activePlay base layer: paintIdleSceneByKey — richer sparse layer before full scene blend.
 */
import { IDLE_HOME } from './VisualMode';
import { resolveThemeTemplateKeyFromTheme } from './PresetVisualThemes';
import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import type { SceneContext } from './BotanicalScenes';

const CLUSTER_ANCHORS = [0.14, 0.28, 0.42, 0.58, 0.72, 0.86, 0.35] as const;

function pseudo(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function clusterCountForTheme(themeKey: string): number {
  const span = IDLE_HOME.maxClusters - IDLE_HOME.minClusters + 1;
  return IDLE_HOME.minClusters + Math.floor(pseudo(hashSeed(themeKey), 2) * span);
}

/** Pointer/touch halo — only when user is actively touching the canvas. */
function paintPointerHalo(ctx: SceneContext): void {
  const { pointer, theme, paint } = ctx;
  if (!pointer.active && pointer.activity < 0.12) {
    return;
  }
  const radius = Math.round(1 + pointer.activity * 2);
  const { gridX: cx, gridY: cy } = pointer;
  paint(cx, cy, pickThemeAccent(theme, Math.floor(ctx.time * 2)), 2);
  if (radius > 0) {
    paint(cx - 1, cy, pickThemeChar(theme, cx), 1);
    paint(cx + 1, cy, pickThemeChar(theme, cy), 1);
  }
}

type ClusterPainter = (
  theme: SceneContext['theme'],
  x: number,
  y: number,
  index: number,
  breathe: number,
  paint: SceneContext['paint'],
) => void;

function paintSeedCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  const h = breathe > 0.55 ? 2 : 1;
  paint(x, y, pickThemeChar(theme, index), 2);
  if (h > 1) {
    paint(x, y - 1, pickThemeAccent(theme, index), 2);
  }
}

function paintMossCluster(theme: SceneContext['theme'], x: number, y: number, index: number, _breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeChar(theme, index), 2);
  paint(x, y - 1, "'", 1);
}

function paintRootCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeChar(theme, index), 2);
  if (breathe > 0.5) {
    paint(x - 1, y + 1, '.', 1);
    paint(x + 1, y + 1, '.', 1);
  }
}

function paintBloomCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  if (breathe > 0.45) {
    paint(x, y, pickThemeAccent(theme, index), 2);
    paint(x - 1, y, pickThemeChar(theme, index + 1), 1);
    paint(x + 1, y, pickThemeChar(theme, index + 2), 1);
  } else {
    paint(x, y, '|', 1);
  }
}

function paintOrbitCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeAccent(theme, index), 2);
  if (breathe > 0.4) {
    paint(x + 1, y, '∘', 1);
    paint(x - 1, y, '∘', 1);
  }
}

function paintWebCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeAccent(theme, index), 2);
  if (breathe > 0.5) {
    paint(x + 1, y, '·', 1);
  }
}

function paintGlitchCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  if (breathe > 0.65) {
    paint(x, y, pickThemeAccent(theme, index + Math.floor(breathe * 3)), 2);
  }
}

function paintCoralCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, 'Y', 2);
  if (breathe > 0.38) {
    paint(x - 1, y - 1, '/', 1);
    paint(x + 1, y - 1, '\\', 1);
    paint(x, y - 2, pickThemeAccent(theme, index), 2);
  }
}

function paintCrystalCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, '◆', 2);
  if (breathe > 0.42) {
    paint(x - 1, y, '+', 1);
    paint(x + 1, y, '+', 1);
    paint(x, y - 1, pickThemeAccent(theme, index), 2);
  }
}

function paintJunoCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  if (breathe > 0.32) {
    paint(x, y, pickThemeAccent(theme, index), 2);
    paint(x - 1, y, pickThemeChar(theme, index), 1);
    paint(x + 1, y, pickThemeChar(theme, index + 1), 1);
    paint(x, y - 1, pickThemeChar(theme, index + 2), 1);
  }
}

function paintCanopyCluster(theme: SceneContext['theme'], x: number, y: number, index: number, _breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeChar(theme, index), 2);
  paint(x - 1, y, '/', 1);
  paint(x + 1, y, '\\', 1);
}

function paintRainforestCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeChar(theme, index), 2);
  if (breathe > 0.42) {
    paint(x, y + 1, ',', 1);
  }
}

function paintDesertCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, '|', 1);
  if (breathe > 0.48) {
    paint(x, y - 1, pickThemeAccent(theme, index), 2);
  }
}

function paintWinterCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeChar(theme, index), 2);
  if (breathe > 0.52) {
    paint(x, y + 1, '·', 1);
  }
}

function paintFernCluster(theme: SceneContext['theme'], x: number, y: number, index: number, _breathe: number, paint: SceneContext['paint']) {
  paint(x, y, '|', 1);
  paint(x - 1, y - 1, '/', 1);
  paint(x + 1, y - 1, pickThemeChar(theme, index), 1);
}

function paintVineCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  paint(x, y, pickThemeChar(theme, index), 2);
  if (breathe > 0.45) {
    paint(x, y - 1, '~', 1);
  }
}

function paintNightCluster(theme: SceneContext['theme'], x: number, y: number, index: number, breathe: number, paint: SceneContext['paint']) {
  if (breathe > 0.38) {
    paint(x, y, pickThemeAccent(theme, index), 2);
    paint(x, y - 1, '·', 1);
  }
}

const CLUSTER_BY_THEME: Record<string, ClusterPainter> = {
  seed: paintSeedCluster,
  moss: paintMossCluster,
  roots: paintRootCluster,
  root: paintRootCluster,
  bloom: paintBloomCluster,
  canopy: paintCanopyCluster,
  fern: paintFernCluster,
  rainforest: paintRainforestCluster,
  vine: paintVineCluster,
  desert: paintDesertCluster,
  coral: paintCoralCluster,
  winter: paintWinterCluster,
  crystal: paintCrystalCluster,
  'night-bloom': paintNightCluster,
  juno: paintJunoCluster,
  mycelium: paintWebCluster,
  mutation: paintGlitchCluster,
  plantasonic: paintOrbitCluster,
};

/** Home idle — sparse PLANTASONIC title + 3–7 living micro-clusters. */
export function paintIdleHomeScene(themeKey: string, ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const breathe = Math.sin(time * 0.22 * animSpeed) * 0.5 + 0.5;
  const count = clusterCountForTheme(themeKey);
  const painter = CLUSTER_BY_THEME[themeKey] ?? paintSeedCluster;

  paintHomeTitle(ctx);

  for (let i = 0; i < count; i += 1) {
    const anchor = CLUSTER_ANCHORS[i % CLUSTER_ANCHORS.length];
    const driftX = Math.sin(time * 0.11 * animSpeed + i * 1.9) * 0.6;
    const driftY = Math.cos(time * 0.09 * animSpeed + i * 1.3) * 0.5;
    const clusterMotion = ctx.performance?.clusters[i % (ctx.performance.clusters.length || 1)];
    const perfX = clusterMotion ? clusterMotion.translateX : 0;
    const perfY = clusterMotion ? clusterMotion.translateY : 0;
    const x = Math.max(
      1,
      Math.min(width - 2, Math.floor(width * anchor + driftX + perfX)),
    );
    const y = Math.max(
      1,
      Math.min(
        height - 3,
        Math.floor(height * (0.22 + pseudo(i, themeKey.length) * 0.52) + driftY + perfY),
      ),
    );
    painter(theme, x, y, i, breathe, paint);
  }

  paintPointerHalo(ctx);
}

function paintHomeTitle(ctx: SceneContext): void {
  const title = 'PLANTASONIC';
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const startX = Math.max(1, Math.floor((width - title.length) / 2));
  const y = Math.max(2, Math.floor(height * 0.36 + Math.sin(time * 0.18 * animSpeed) * 0.4));
  for (let i = 0; i < title.length; i += 1) {
    paint(startX + i, y, title[i] ?? '·', 3);
  }
  paint(startX - 1, y, pickThemeChar(theme, 0), 1);
  paint(startX + title.length, y, pickThemeChar(theme, 1), 1);
}

function groundLine(ctx: SceneContext, char = '·'): void {
  const { width, height, theme, paint } = ctx;
  const ground = height - 2;
  for (let x = 0; x < width; x += 3) {
    paint(x, ground, char, 1);
  }
  paint(Math.floor(width / 2), ground - 1, pickThemeChar(theme, 0), 1);
}

/** Slow drifting motes — density scales with visualEnergy + pointer activity. */
function paintAmbientDrift(ctx: SceneContext, count: number, yBias = 0.4): void {
  const { width, height, theme, time, paint, animSpeed, visualEnergy, pointer } = ctx;
  const boosted = count + Math.round(visualEnergy * 5 + pointer.activity * 4);
  for (let i = 0; i < boosted; i += 1) {
    const phase = time * 0.15 * animSpeed + i * 1.7;
    const x = Math.floor(((Math.sin(phase * 0.7 + i) * 0.5 + 0.5) * (width - 2)) + 1);
    const y = Math.floor(((Math.cos(phase * 0.5 + i * 0.3) * 0.5 + 0.5) * (height - 4)) * yBias + 1);
    paint(x, y, pickThemeChar(theme, i + Math.floor(time)), 1);
  }
}

/** Pointer/touch halo — expands with activity, settles when idle. */
function paintActivePointerHalo(ctx: SceneContext): void {
  const { pointer, visualEnergy, theme, paint } = ctx;
  if (pointer.activity < 0.04 && !pointer.active) {
    return;
  }
  const radius = Math.round(1 + pointer.activity * 3 + visualEnergy * 2);
  const { gridX: cx, gridY: cy } = pointer;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy <= radius * radius) {
        paint(cx + dx, cy + dy, pickThemeChar(theme, dx + dy + Math.floor(ctx.time * 2)), 2);
      }
    }
  }
}

function idleSeed(ctx: SceneContext): void {
  // Seed: sprouting stem, minimal ground dots — density ~3 glyphs; motion = breathe + drift.
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const breathe = Math.sin(time * 0.4 * animSpeed) * 0.5 + 0.5;
  groundLine(ctx, '.');

  const sproutX = Math.floor(width * 0.5 + Math.sin(time * 0.3) * 2);
  const h = Math.round(2 + breathe * 2);
  for (let dy = 0; dy <= h; dy += 1) {
    paint(sproutX, ground - dy, dy === h ? pickThemeAccent(theme, 0) : '|', 2);
  }
  paintAmbientDrift(ctx, 3, 0.35);
}

function idleMoss(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const ground = height - 2;
  for (let i = 0; i < 4; i += 1) {
    const x = Math.floor(width * (0.2 + i * 0.18) + Math.sin(time * 0.25 + i) * 1.5);
    paint(x, ground, pickThemeChar(theme, i), 1);
    paint(x, ground - 1, "'", 1);
  }
  paint(Math.floor(width * 0.5), ground - 2, pickThemeAccent(theme, 1), 1);
  paintAmbientDrift(ctx, 2, 0.5);
}

function idleRoots(ctx: SceneContext): void {
  const { width, height, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const cx = Math.floor(width * 0.5);
  paint(cx, ground, '█', 2);
  for (let dy = 1; dy <= 4; dy += 1) {
    const spread = Math.round(Math.sin(time * 0.2 * animSpeed + dy) * 0.8);
    paint(cx + spread - 1, ground - dy, '/', 2);
    paint(cx + spread + 1, ground - dy, '\\', 2);
  }
  paintAmbientDrift(ctx, 2, 0.6);
}

function idleBloom(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const cx = Math.floor(width * 0.5 + Math.sin(time * 0.35 * animSpeed) * 1.5);
  const open = Math.sin(time * 0.5 * animSpeed) * 0.5 + 0.5;
  paint(cx, ground, '|', 2);
  if (open > 0.4) {
    paint(cx - 1, ground - 2, pickThemeAccent(theme, 0), 2);
    paint(cx + 1, ground - 2, pickThemeAccent(theme, 1), 2);
    paint(cx, ground - 3, pickThemeAccent(theme, 2), 2);
  }
  paintAmbientDrift(ctx, 4, 0.3);
}

function idleCanopy(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const positions = [0.25, 0.5, 0.75];
  for (let i = 0; i < positions.length; i += 1) {
    const x = Math.floor(width * positions[i] + Math.sin(time * 0.28 + i) * 1.2);
    const y = Math.floor(height * 0.55 - i * 2);
    paint(x, y, pickThemeChar(theme, i), 2);
    paint(x - 1, y + 1, '/', 1);
    paint(x + 1, y + 1, '\\', 1);
  }
  paintAmbientDrift(ctx, 3, 0.45);
}

function idleRainforest(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  for (let i = 0; i < 3; i += 1) {
    const x = Math.floor(width * (0.15 + i * 0.32));
    const y = Math.floor(height * 0.35 + Math.sin(time * 0.4 + i) * 1);
    paint(x, y, pickThemeChar(theme, i), 2);
  }
  paint(Math.floor(width * 0.5), height - 3, '~', 1);
  paintAmbientDrift(ctx, 5, 0.55);
}

function idleDesert(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const shimmer = Math.sin(time * 0.6 * animSpeed) * 0.5 + 0.5;
  if (shimmer > 0.55) {
    paint(Math.floor(width * 0.3), ground, pickThemeAccent(theme, 0), 1);
    paint(Math.floor(width * 0.7), ground, pickThemeAccent(theme, 1), 1);
  }
  paint(Math.floor(width * 0.5), ground - 3, '|', 1);
  paintAmbientDrift(ctx, 2, 0.25);
}

function idleWinter(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  for (let i = 0; i < 5; i += 1) {
    const x = Math.floor((time * 2 * animSpeed + i * 7) % width);
    const y = Math.floor((i * 3 + Math.sin(time + i) * 2) % (height - 2));
    paint(x, y, pickThemeChar(theme, i), 1);
  }
  paint(Math.floor(width * 0.5), height - 3, '◆', 1);
}

function idleNightBloom(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const pulse = Math.sin(time * 0.8 * animSpeed) * 0.5 + 0.5;
  for (let i = 0; i < 4; i += 1) {
    if (pulse > 0.3 + i * 0.1) {
      const x = Math.floor(width * (0.15 + i * 0.22));
      const y = Math.floor(height * 0.3 + Math.cos(time * 0.5 + i) * 2);
      paint(x, y, pickThemeAccent(theme, i), 2);
    }
  }
  paintAmbientDrift(ctx, 3, 0.4);
}

function idleMycelium(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const hubs = [
    { x: Math.floor(width * 0.3), y: Math.floor(height * 0.4) },
    { x: Math.floor(width * 0.7), y: Math.floor(height * 0.55) },
    { x: Math.floor(width * 0.5), y: Math.floor(height * 0.7) },
  ];
  for (let i = 0; i < hubs.length; i += 1) {
    const hub = hubs[i];
    const pulse = Math.sin(time * 0.35 * animSpeed + i) * 0.5 + 0.5;
    paint(hub.x, hub.y, pickThemeAccent(theme, i), 2);
    if (i < hubs.length - 1 && pulse > 0.45) {
      const next = hubs[i + 1];
      const steps = 4;
      for (let s = 1; s < steps; s += 1) {
        const t = s / steps;
        const x = Math.round(hub.x + (next.x - hub.x) * t);
        const y = Math.round(hub.y + (next.y - hub.y) * t);
        paint(x, y, '·', 1);
      }
    }
  }
}

function idleMutation(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  if (Math.sin(time * 3 * animSpeed) > 0.7) {
    paint(cx, cy, pickThemeAccent(theme, Math.floor(time)), 2);
    paint(cx - 1, cy, '#', 1);
    paint(cx + 1, cy, 'x', 1);
  }
  const scanY = Math.floor((time * 0.4) % (height - 1));
  paint(Math.floor(width * 0.2), scanY, '-', 1);
  paint(Math.floor(width * 0.8), scanY, '-', 1);
}

function idlePlantasonic(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const breathe = Math.sin(time * 0.35 * animSpeed) * 0.5 + 0.5;
  for (let r = 1; r <= 2 + Math.round(breathe * 2); r += 1) {
    paint(cx + r, cy, '∘', 1);
    paint(cx - r, cy, '∘', 1);
    paint(cx, cy + r, '∘', 1);
    paint(cx, cy - r, '∘', 1);
  }
  paint(cx, cy, pickThemeAccent(theme, Math.floor(time)), 2);
  paintAmbientDrift(ctx, 4, 0.5);
}

function idleVine(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const x = Math.floor(width * 0.5 + Math.sin(time * 0.3) * 2);
  const top = Math.floor(height * 0.15);
  const len = Math.floor(height * 0.55);
  for (let dy = 0; dy < len; dy += 1) {
    const sway = Math.round(Math.sin(time * 0.5 + dy * 0.12) * 1.2);
    paint(x + sway, top + dy, dy % 3 === 0 ? '~' : '|', 2);
  }
  paint(x, top + len, pickThemeAccent(theme, 0), 2);
  paintAmbientDrift(ctx, 3, 0.5);
}

function idleFern(ctx: SceneContext): void {
  const { width, height, theme, time, paint } = ctx;
  const ground = height - 2;
  const cx = Math.floor(width * 0.5 + Math.sin(time * 0.22) * 1);
  paint(cx, ground, '|', 2);
  for (let i = 1; i <= 4; i += 1) {
    paint(cx - i, ground - i, '/', 1);
    paint(cx + i, ground - i, pickThemeChar(theme, i), 1);
  }
  paint(cx, ground - 5, pickThemeAccent(theme, 0), 2);
  paintAmbientDrift(ctx, 2, 0.4);
}

function idleCoral(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const wave = Math.sin(time * 0.35 * animSpeed);
  for (let x = 2; x < width - 2; x += 4) {
    const y = Math.floor(ground - 5 + wave + Math.sin(x * 0.2) * 0.8);
    paint(x, y, '~', 1);
  }
  const cx = Math.floor(width * 0.5);
  paint(cx, ground, 'Y', 2);
  paint(cx - 1, ground - 1, '/', 2);
  paint(cx + 1, ground - 1, '\\', 2);
  if (Math.sin(time * 0.5) > 0) {
    paint(cx, ground - 3, pickThemeAccent(theme, 0), 2);
  }
  paintAmbientDrift(ctx, 3, 0.4);
}

function idleCrystal(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height * 0.45);
  const shimmer = Math.sin(time * 0.8 * animSpeed) * 0.5 + 0.5;
  paint(cx, cy, pickThemeAccent(theme, 0), 2);
  if (shimmer > 0.4) {
    paint(cx - 1, cy, '+', 1);
    paint(cx + 1, cy, '+', 1);
    paint(cx, cy - 1, '+', 1);
    paint(cx, cy + 1, '+', 1);
  }
  paint(Math.floor(width * 0.25), Math.floor(height * 0.6), '◆', 1);
  paint(Math.floor(width * 0.75), Math.floor(height * 0.55), '◆', 1);
  paintAmbientDrift(ctx, 2, 0.35);
}

function idleJuno(ctx: SceneContext): void {
  const { width, height, theme, time, paint, animSpeed } = ctx;
  const ground = height - 2;
  const cols = 3;
  for (let i = 0; i < cols; i += 1) {
    const x = Math.floor((i + 0.5) * (width / cols));
    const bloom = Math.sin(time * 0.6 * animSpeed + i) * 0.5 + 0.5;
    paint(x, ground, '|', 1);
    if (bloom > 0.45) {
      paint(x - 1, ground - 2, pickThemeAccent(theme, i), 2);
      paint(x + 1, ground - 2, pickThemeAccent(theme, i + 1), 2);
      paint(x, ground - 3, pickThemeChar(theme, i), 2);
    }
  }
  paintAmbientDrift(ctx, 2, 0.35);
}

/**
 * Paint sparse idle scene for a preset theme key.
 * Density/motion: controlled by ctx.visualEnergy and ctx.animSpeed in SceneContext.
 */
export function paintIdleSceneByKey(themeKey: string, ctx: SceneContext): void {
  switch (themeKey) {
    case 'plantasonic':
      idlePlantasonic(ctx);
      break;
    case 'moss':
      idleMoss(ctx);
      break;
    case 'roots':
    case 'root':
      idleRoots(ctx);
      break;
    case 'bloom':
      idleBloom(ctx);
      break;
    case 'canopy':
      idleCanopy(ctx);
      break;
    case 'fern':
      idleFern(ctx);
      break;
    case 'rainforest':
      idleRainforest(ctx);
      break;
    case 'vine':
      idleVine(ctx);
      break;
    case 'desert':
      idleDesert(ctx);
      break;
    case 'coral':
      idleCoral(ctx);
      break;
    case 'winter':
      idleWinter(ctx);
      break;
    case 'crystal':
      idleCrystal(ctx);
      break;
    case 'night-bloom':
      idleNightBloom(ctx);
      break;
    case 'juno':
      idleJuno(ctx);
      break;
    case 'mycelium':
      idleMycelium(ctx);
      break;
    case 'mutation':
      idleMutation(ctx);
      break;
    case 'seed':
    default:
      idleSeed(ctx);
      break;
  }
  paintActivePointerHalo(ctx);
}

/** Resolve theme key from scene context (matches PresetVisualThemes routing). */
export function resolveIdleThemeKey(ctx: SceneContext): string {
  return resolveThemeTemplateKeyFromTheme(ctx.theme);
}
