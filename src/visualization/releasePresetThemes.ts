/**
 * Release 1 preset ids → visual theme keys (Seed / Flowers / Mold).
 * Ensures animation, shape, and choreography match each Sound World.
 */
export const RELEASE_PRESET_THEME_KEYS: Record<string, string> = {
  plantasonic: 'plantasonic',
  'juno-flowers': 'night-bloom',
  mutation: 'mutation',
};

export function resolveReleasePresetThemeKey(
  presetId: string,
  fallbackKey: string,
): string {
  return RELEASE_PRESET_THEME_KEYS[presetId] ?? fallbackKey;
}
