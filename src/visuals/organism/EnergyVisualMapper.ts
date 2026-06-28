import type { ModulationControlValues } from '../../types/instrument';
import { GRAMMAR_SYMBOLS } from './GrammarSymbols';
import { GRID_CENTER_X, GRID_CENTER_Y } from './gridConstants';
import type { Organism } from './Organism';
import { Edge } from './Edge';
import {
  horizontalBandGlyphs,
  ringGlyphs,
  scatterFieldGlyphs,
  verticalColumnGlyphs,
  type GlyphPoint,
} from './VisualGlyphs';

export type EnergyVisualGlyphs = {
  id: string;
  pathGlyphs: GlyphPoint[];
};

/** Energy + mold → triple particle rows + side columns. */
export function energyParticleGlyphs(energy: number, mold: number): EnergyVisualGlyphs {
  const combined = Math.min(100, Math.round(energy * 0.65 + mold * 0.35));
  const span = Math.round((combined / 100) * 16);
  const rows = [GRID_CENTER_Y + 5, GRID_CENTER_Y + 6, GRID_CENTER_Y + 7];
  const glyphs: GlyphPoint[] = [];

  for (const [index, y] of rows.entries()) {
    glyphs.push(...horizontalBandGlyphs(y, span - index, GRAMMAR_SYMBOLS.densityLow, true));
  }

  glyphs.push(
    ...verticalColumnGlyphs(GRID_CENTER_X - span - 1, GRID_CENTER_Y + 3, GRID_CENTER_Y + 7, GRAMMAR_SYMBOLS.softParticle),
    ...verticalColumnGlyphs(GRID_CENTER_X + span + 1, GRID_CENTER_Y + 3, GRID_CENTER_Y + 7, GRAMMAR_SYMBOLS.softParticle),
    ...scatterFieldGlyphs(GRID_CENTER_X, GRID_CENTER_Y + 5, Math.round(combined / 4), span, 3, GRAMMAR_SYMBOLS.seed),
  );

  return { id: 'energy-particle-row', pathGlyphs: glyphs };
}

/** Growth (0–100) → tall upward reach with branching arms. */
export function growthReachGlyphs(growthRate: number): EnergyVisualGlyphs | null {
  if (growthRate < 25) {
    return null;
  }

  const reach = 3 + Math.round((growthRate / 100) * 8);
  const glyphs: GlyphPoint[] = [
    ...verticalColumnGlyphs(GRID_CENTER_X, GRID_CENTER_Y - reach, GRID_CENTER_Y - 1, GRAMMAR_SYMBOLS.vertical),
    { x: GRID_CENTER_X, y: GRID_CENTER_Y - reach - 1, symbol: GRAMMAR_SYMBOLS.active },
  ];

  if (growthRate >= 50) {
    glyphs.push(
      { x: GRID_CENTER_X - 2, y: GRID_CENTER_Y - reach, symbol: GRAMMAR_SYMBOLS.diagUpRight },
      { x: GRID_CENTER_X + 2, y: GRID_CENTER_Y - reach, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    );
  }
  if (growthRate >= 75) {
    glyphs.push(
      { x: GRID_CENTER_X - 4, y: GRID_CENTER_Y - reach + 1, symbol: GRAMMAR_SYMBOLS.seed },
      { x: GRID_CENTER_X + 4, y: GRID_CENTER_Y - reach + 1, symbol: GRAMMAR_SYMBOLS.seed },
      ...horizontalBandGlyphs(GRID_CENTER_Y - reach - 2, 5, GRAMMAR_SYMBOLS.densityMedium),
    );
  }

  return { id: 'energy-growth-reach', pathGlyphs: glyphs };
}

/** Drift (0–100) → wide asymmetric particle curtains. */
export function driftAsymmetryGlyphs(drift: number): EnergyVisualGlyphs[] {
  if (drift < 12) {
    return [];
  }

  const offset = 2 + Math.round((drift / 100) * 8);
  const count = 6 + Math.round((drift / 100) * 14);

  return [
    {
      id: 'energy-drift-left',
      pathGlyphs: [
        ...scatterFieldGlyphs(GRID_CENTER_X - offset - 4, GRID_CENTER_Y - 2, count, 6, 5, GRAMMAR_SYMBOLS.softParticle),
        ...verticalColumnGlyphs(GRID_CENTER_X - offset - 2, GRID_CENTER_Y - 3, GRID_CENTER_Y + 3, GRAMMAR_SYMBOLS.diagUpRight),
      ],
    },
    {
      id: 'energy-drift-right',
      pathGlyphs: [
        ...scatterFieldGlyphs(GRID_CENTER_X + offset + 4, GRID_CENTER_Y + 2, count, 6, 5, GRAMMAR_SYMBOLS.softParticle),
        ...verticalColumnGlyphs(GRID_CENTER_X + offset + 2, GRID_CENTER_Y - 3, GRID_CENTER_Y + 3, GRAMMAR_SYMBOLS.diagDownRight),
      ],
    },
  ];
}

/** Mutation (0–100) → expanded ╳ disruption field. */
export function mutationDisruptionGlyphs(mutation: number): EnergyVisualGlyphs | null {
  if (mutation < 12) {
    return null;
  }

  const span = 1 + Math.round((mutation / 100) * 4);
  const glyphs: GlyphPoint[] = [
    { x: GRID_CENTER_X - span, y: GRID_CENTER_Y - span, symbol: GRAMMAR_SYMBOLS.diagUpRight },
    { x: GRID_CENTER_X + span, y: GRID_CENTER_Y - span, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    { x: GRID_CENTER_X - span, y: GRID_CENTER_Y + span, symbol: GRAMMAR_SYMBOLS.diagDownRight },
    { x: GRID_CENTER_X + span, y: GRID_CENTER_Y + span, symbol: GRAMMAR_SYMBOLS.diagUpRight },
    { x: GRID_CENTER_X, y: GRID_CENTER_Y, symbol: GRAMMAR_SYMBOLS.mutation },
    ...ringGlyphs(GRID_CENTER_X, GRID_CENTER_Y, span + 2, GRAMMAR_SYMBOLS.mutation),
  ];

  if (mutation >= 45) {
    glyphs.push(
      ...horizontalBandGlyphs(GRID_CENTER_Y, span + 3, GRAMMAR_SYMBOLS.densityMedium),
      ...verticalColumnGlyphs(GRID_CENTER_X, GRID_CENTER_Y - span - 2, GRID_CENTER_Y + span + 2, GRAMMAR_SYMBOLS.densityLow),
    );
  }

  return { id: 'energy-mutation-hub', pathGlyphs: glyphs };
}

export function applyEnergyVisuals(
  organism: Organism,
  modulation: ModulationControlValues,
  mold: number,
  anchorNodeId: string,
): void {
  const growth = growthReachGlyphs(modulation.growthRate);
  const mutation = mutationDisruptionGlyphs(modulation.mutation);

  const layers: EnergyVisualGlyphs[] = [
    energyParticleGlyphs(modulation.energy, mold),
    ...(growth ? [growth] : []),
    ...driftAsymmetryGlyphs(modulation.drift),
    ...(mutation ? [mutation] : []),
  ];

  for (const layer of layers) {
    organism.addEdge(
      new Edge({
        id: layer.id,
        from: anchorNodeId,
        to: anchorNodeId,
        kind: layer.id.includes('mutation') ? 'modulation' : 'energyTransfer',
        pathGlyphs: layer.pathGlyphs,
      }),
    );
  }
}
