import { HOST_ASCII_THEMES } from 'plantasia-sound-engine';
import { THEME_TEMPLATE_KEYS } from '../visualization/PresetVisualThemes';

const LOG_PREFIX = '[Plantasia Engine Test]';

/** Compare engine theme registry with host THEME_TEMPLATES at boot. */
export function validateHostThemeRegistry(): void {
  const hostKeys = new Set(THEME_TEMPLATE_KEYS);
  const engineThemes = HOST_ASCII_THEMES as readonly string[];

  const missingInHost = engineThemes.filter((theme) => !hostKeys.has(theme));
  const extraInHost = THEME_TEMPLATE_KEYS.filter((theme) => !engineThemes.includes(theme));

  if (missingInHost.length > 0) {
    console.warn(
      `${LOG_PREFIX} Host is missing ASCII themes required by engine presets:`,
      missingInHost.join(', '),
    );
  }

  if (extraInHost.length > 0) {
    console.info(
      `${LOG_PREFIX} Host has extra theme templates not in engine registry:`,
      extraInHost.join(', '),
    );
  }
}
