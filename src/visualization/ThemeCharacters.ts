import type { PresetTheme } from './types';

/** Pick a character from the preset's curated character set. */
export function pickThemeChar(theme: PresetTheme, seed: number): string {
  const set = theme.characterSet;
  if (set.length === 0) {
    return '·';
  }
  const index = Math.abs(Math.floor(seed)) % set.length;
  return set[index] ?? '·';
}

/** Pick accent character for blooms and peaks. */
export function pickThemeAccent(theme: PresetTheme, seed: number): string {
  const set = theme.accentChars.length > 0 ? theme.accentChars : theme.characterSet;
  const index = Math.abs(Math.floor(seed * 1.7)) % set.length;
  return set[index] ?? '*';
}

export function pickFromThemePalette(theme: PresetTheme, seed: number): string {
  if (Math.random() < 0.65) {
    return pickThemeChar(theme, seed);
  }
  return pickThemeAccent(theme, seed);
}
