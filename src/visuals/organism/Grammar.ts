/**
 * ASCII visual grammar — derived from docs/brand/ASCII_GRAMMAR.md.
 * Approved symbols and semantic rules for procedural organism rendering.
 */

export const GRAMMAR_SYMBOLS = {
  seed: '•',
  dormant: '○',
  active: '●',
  activation: '+',
  softParticle: '·',
  vertical: '│',
  horizontal: '─',
  diagUpRight: '╱',
  diagDownRight: '╲',
  curveNE: '╮',
  curveSW: '╰',
  mutation: '╳',
  intersection: '┼',
  densityLow: '░',
  densityMedium: '▒',
  densityHigh: '▓',
} as const;

export type GrammarSymbol = (typeof GRAMMAR_SYMBOLS)[keyof typeof GRAMMAR_SYMBOLS];

export type BiologicalState = 'dormant' | 'breathing' | 'growing' | 'blooming' | 'active';

export type GrammarStateName =
  | 'seed'
  | 'sprout'
  | 'roots'
  | 'vine'
  | 'branch'
  | 'growth'
  | 'connection'
  | 'harmony';

const APPROVED_SYMBOLS = new Set<string>(Object.values(GRAMMAR_SYMBOLS));

/** Whether a character is an approved grammar symbol. */
export function isApprovedSymbol(value: string): value is GrammarSymbol {
  return APPROVED_SYMBOLS.has(value);
}

/** Map biological state and energy to a node glyph. */
export function symbolForNode(state: BiologicalState, energy: number): GrammarSymbol {
  if (energy <= 0.1 || state === 'dormant') {
    return GRAMMAR_SYMBOLS.seed;
  }

  if (state === 'breathing') {
    return GRAMMAR_SYMBOLS.softParticle;
  }

  if (energy >= 0.75 || state === 'blooming') {
    return GRAMMAR_SYMBOLS.active;
  }

  if (energy < 0.35) {
    return GRAMMAR_SYMBOLS.dormant;
  }

  return GRAMMAR_SYMBOLS.active;
}

/** Select a connection glyph from grid step direction. Y increases downward. */
export function connectionGlyph(stepX: number, stepY: number): GrammarSymbol {
  if (stepX === 0 && stepY !== 0) {
    return GRAMMAR_SYMBOLS.vertical;
  }

  if (stepY === 0 && stepX !== 0) {
    return GRAMMAR_SYMBOLS.horizontal;
  }

  if (stepX < 0 && stepY < 0) {
    return GRAMMAR_SYMBOLS.diagUpRight;
  }

  if (stepX > 0 && stepY < 0) {
    return GRAMMAR_SYMBOLS.diagDownRight;
  }

  if (stepX < 0 && stepY > 0) {
    return GRAMMAR_SYMBOLS.diagDownRight;
  }

  return GRAMMAR_SYMBOLS.diagUpRight;
}

/** Resolve intersection glyph when multiple edges share a cell. */
export function intersectionGlyph(): GrammarSymbol {
  return GRAMMAR_SYMBOLS.intersection;
}
