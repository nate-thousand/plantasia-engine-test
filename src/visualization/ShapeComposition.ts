/**
 * Milestone 13F — shape-based composition, density limits, symbol palettes.
 */
import type { ExperientialMode } from './VisualMode';
import { getChoreographyForTheme } from './PresetChoreography';
import type { PresetTheme } from './types';

export type ShapeKind =
  | 'verticalSprout'
  | 'branch'
  | 'rootWeb'
  | 'corruptionPatch'
  | 'orbitRing'
  | 'constellation'
  | 'frameEdge'
  | 'waveLine'
  | 'pulseLine';

export type ShapeGlyphPoint = {
  x: number;
  y: number;
  clusterIndex: number;
  glyphIndex: number;
  role: 'core' | 'accent' | 'drift';
};

export type DensityLimits = {
  minClusters: number;
  maxClusters: number;
  maxGlyphs: number;
  maxCoverage: number;
};

export const DENSITY_BY_MODE: Record<ExperientialMode, DensityLimits> = {
  home: { minClusters: 3, maxClusters: 7, maxCoverage: 0.05, maxGlyphs: 48 },
  ambient: { minClusters: 5, maxClusters: 12, maxCoverage: 0.12, maxGlyphs: 120 },
  performance: { minClusters: 12, maxClusters: 24, maxCoverage: 0.25, maxGlyphs: 280 },
};

export const SYMBOL_PALETTES: Record<string, readonly string[]> = {
  plant: ['.', "'", '|', '/', '\\', 'Y', ','],
  mold: ['#', '%', '?', '_', '.', 'x'],
  space: ['.', '°', '*', 'o', '+', '∘'],
  tape: ['_', '-', '=', '~', ':', '|'],
  water: ['~', '.', '°', '-', 'o', "'"],
  signal: ['|', '·', '▪', ':', '-', '.'],
};

const SHAPE_BY_THEME: Record<string, ShapeKind> = {
  seed: 'verticalSprout',
  moss: 'verticalSprout',
  bloom: 'branch',
  fern: 'branch',
  canopy: 'branch',
  vine: 'branch',
  rainforest: 'branch',
  desert: 'verticalSprout',
  juno: 'branch',
  'night-bloom': 'branch',
  roots: 'rootWeb',
  root: 'rootWeb',
  mycelium: 'corruptionPatch',
  mutation: 'corruptionPatch',
  crystal: 'constellation',
  winter: 'constellation',
  plantasonic: 'frameEdge',
  coral: 'waveLine',
};

export function resolveShapeKind(themeKey: string): ShapeKind {
  return SHAPE_BY_THEME[themeKey] ?? 'verticalSprout';
}

export function symbolPaletteForTheme(theme: PresetTheme): readonly string[] {
  const family = getChoreographyForTheme(theme).family;
  return SYMBOL_PALETTES[family] ?? SYMBOL_PALETTES.plant;
}

export function clusterCountForMode(mode: ExperientialMode, themeKey: string, seed: number): number {
  const limits = DENSITY_BY_MODE[mode];
  const span = limits.maxClusters - limits.minClusters + 1;
  const bias = Math.abs(hashString(themeKey + String(seed))) % span;
  return limits.minClusters + bias;
}

export function maxGlyphsForMode(mode: ExperientialMode, width: number, height: number): number {
  const limits = DENSITY_BY_MODE[mode];
  const areaCap = Math.floor(width * height * limits.maxCoverage);
  return Math.min(limits.maxGlyphs, areaCap);
}

/** Clamp combined visual energy so high input stays readable. */
export function clampShapeVisualEnergy(energy: number, mode: ExperientialMode): number {
  const caps: Record<ExperientialMode, number> = {
    home: 0.12,
    ambient: 0.55,
    performance: 0.88,
  };
  return Math.min(energy, caps[mode]);
}

export function generateShapePoints(
  kind: ShapeKind,
  width: number,
  height: number,
  clusterCount: number,
  seed: number,
): ShapeGlyphPoint[] {
  const cx = Math.floor(width * 0.5);
  const cy = Math.floor(height * 0.42);
  const ground = height - 3;

  switch (kind) {
    case 'verticalSprout':
      return sproutShape(cx, ground, clusterCount, seed);
    case 'branch':
      return branchShape(cx, ground, clusterCount, seed);
    case 'rootWeb':
      return rootWebShape(cx, ground, clusterCount, seed);
    case 'corruptionPatch':
      return patchShape(cx, cy, clusterCount, seed);
    case 'orbitRing':
    case 'constellation':
      return constellationShape(cx, cy, Math.min(width, height), clusterCount, seed);
    case 'frameEdge':
      return frameEdgeShape(width, height, clusterCount, seed);
    case 'waveLine':
      return waveLineShape(width, ground, clusterCount, seed);
    case 'pulseLine':
      return pulseLineShape(cx, cy, clusterCount, seed);
    default:
      return sproutShape(cx, ground, clusterCount, seed);
  }
}

function sproutShape(cx: number, ground: number, clusters: number, seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [];
  const stemH = Math.min(6 + (seed % 4), ground - 2);
  for (let i = 0; i < stemH; i += 1) {
    out.push({ x: cx, y: ground - i, clusterIndex: 0, glyphIndex: i, role: i === stemH - 1 ? 'accent' : 'core' });
  }
  if (clusters > 1 && stemH > 2) {
    out.push({ x: cx - 1, y: ground - stemH + 1, clusterIndex: 1, glyphIndex: 0, role: 'drift' });
  }
  if (clusters > 2 && stemH > 3) {
    out.push({ x: cx + 1, y: ground - stemH + 2, clusterIndex: 2, glyphIndex: 0, role: 'drift' });
  }
  return out;
}

function branchShape(cx: number, ground: number, clusters: number, seed: number): ShapeGlyphPoint[] {
  const base = sproutShape(cx, ground, 1, seed);
  const out = [...base];
  const topY = ground - Math.min(5 + (seed % 3), ground - 2);
  const branches = Math.min(3, Math.max(1, clusters - 1));
  for (let b = 0; b < branches; b += 1) {
    const dir = b % 2 === 0 ? -1 : 1;
    out.push({ x: cx + dir, y: topY + b, clusterIndex: b + 1, glyphIndex: b, role: 'accent' });
    if (clusters > b + 2) {
      out.push({ x: cx + dir * 2, y: topY + b - 1, clusterIndex: b + 1, glyphIndex: b + 1, role: 'drift' });
    }
  }
  return out;
}

function rootWebShape(cx: number, ground: number, clusters: number, _seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [{ x: cx, y: ground, clusterIndex: 0, glyphIndex: 0, role: 'core' }];
  const arms = Math.min(4, clusters);
  for (let i = 0; i < arms; i += 1) {
    const dir = i % 2 === 0 ? -1 : 1;
    const len = 1 + (i % 2);
    for (let d = 1; d <= len; d += 1) {
      out.push({
        x: cx + dir * d,
        y: ground + (i % 3 === 0 ? 1 : 0),
        clusterIndex: i + 1,
        glyphIndex: d,
        role: d === len ? 'accent' : 'core',
      });
    }
  }
  return out;
}

function patchShape(cx: number, cy: number, clusters: number, seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [];
  const radius = 1 + (seed % 2);
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > radius + 1) continue;
      const ci = Math.abs(dx + dy + seed) % Math.max(1, clusters);
      out.push({ x: cx + dx, y: cy + dy, clusterIndex: ci, glyphIndex: out.length, role: dx === 0 && dy === 0 ? 'core' : 'drift' });
    }
  }
  return out;
}

function constellationShape(cx: number, cy: number, span: number, clusters: number, seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [{ x: cx, y: cy, clusterIndex: 0, glyphIndex: 0, role: 'accent' }];
  const count = Math.min(clusters, 6);
  const r = Math.max(2, Math.floor(span * 0.12));
  for (let i = 1; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + seed * 0.1;
    out.push({
      x: cx + Math.round(Math.cos(angle) * r),
      y: cy + Math.round(Math.sin(angle) * r * 0.65),
      clusterIndex: i,
      glyphIndex: i,
      role: 'drift',
    });
  }
  return out;
}

function frameEdgeShape(width: number, height: number, clusters: number, seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [];
  const corners = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  for (let i = 0; i < Math.min(4, clusters); i += 1) {
    const [x, y] = corners[i];
    out.push({ x, y, clusterIndex: i, glyphIndex: 0, role: 'core' });
  }
  const topSpan = Math.min(width - 6, 8 + (seed % 4));
  const startX = Math.floor((width - topSpan) / 2);
  for (let x = startX; x < startX + topSpan && out.length < clusters + 4; x += 2) {
    out.push({ x, y: 2, clusterIndex: 4, glyphIndex: x, role: 'drift' });
  }
  return out;
}

function waveLineShape(width: number, ground: number, clusters: number, _seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [];
  const waves = Math.min(3, Math.max(1, Math.floor(clusters / 4)));
  for (let w = 0; w < waves; w += 1) {
    const y = ground - 2 - w * 2;
    for (let x = 3; x < width - 3; x += 3) {
      if (out.length >= clusters + 6) break;
      out.push({ x, y, clusterIndex: w, glyphIndex: x, role: x % 6 === 0 ? 'accent' : 'core' });
    }
  }
  return out;
}

function pulseLineShape(cx: number, cy: number, clusters: number, _seed: number): ShapeGlyphPoint[] {
  const out: ShapeGlyphPoint[] = [];
  const len = Math.min(clusters, 8);
  for (let i = 0; i < len; i += 1) {
    out.push({ x: cx - Math.floor(len / 2) + i, y: cy, clusterIndex: 0, glyphIndex: i, role: i === Math.floor(len / 2) ? 'accent' : 'core' });
  }
  return out;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}
