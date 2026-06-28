import type { CharacterCategory } from './types';

/** Curated botanical ASCII palette — grouped by ecological role. */
export const CHARACTER_PALETTE: Record<CharacterCategory, readonly string[]> = {
  seed: ['.', '·', '°', '*', '+', '•', '○', '◌'],
  moss: ['.', ',', "'", '`', ':', ';', '░', '▒'],
  grass: ['|', '/', '\\', '(', ')', '[', ']', '{', '}'],
  vine: ['|', '/', '\\', '~', '^', '╱', '╲', '╮', '╰'],
  leaf: ['(', ')', '<', '>', '[', ']', '{', '}', '*', '✦'],
  flower: ['*', '+', '✦', '✧', '◆', '◇', '@', '%', '○', '●'],
  bark: ['#', '@', '%', '|', '█', '▓', '▒', '─'],
  root: ['_', '.', ',', '╲', '╱', '┼', '─', '│'],
  water: ['~', '.', ',', ':', ';', '°', '·', '~'],
  wind: ['~', '^', '*', '.', ',', "'", '`', ':'],
  spore: ['·', '°', '*', '✧', '○', '◌', '.', ','],
  stone: ['#', '@', '%', '█', '▓', '░', '▒', ':'],
};

export const ALL_PALETTE_CHARS = new Set(
  Object.values(CHARACTER_PALETTE).flatMap((chars) => [...chars]),
);

export function pickChar(category: CharacterCategory, seed: number): string {
  const pool = CHARACTER_PALETTE[category];
  const index = Math.abs(Math.floor(seed)) % pool.length;
  return pool[index] ?? '.';
}

export function pickFromCategories(
  categories: CharacterCategory[],
  seed: number,
): string {
  const category = categories[Math.abs(Math.floor(seed)) % categories.length] ?? 'seed';
  return pickChar(category, seed * 1.618);
}

export function densityChar(density: number, seed: number): string {
  if (density >= 0.75) {
    return pickChar('stone', seed);
  }
  if (density >= 0.5) {
    return pickChar('moss', seed);
  }
  if (density >= 0.25) {
    return pickChar('grass', seed);
  }
  return pickChar('seed', seed);
}
