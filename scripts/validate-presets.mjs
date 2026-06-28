/**
 * Validates preset catalog, theme keys, and shape routing for every bundled preset.
 */
import { presets } from 'plantasia-sound-engine';

const THEME_KEYS = new Set([
  'seed', 'moss', 'roots', 'root', 'bloom', 'fern', 'canopy', 'vine', 'rainforest',
  'desert', 'juno', 'night-bloom', 'mycelium', 'mutation', 'crystal', 'winter',
  'plantasonic', 'coral',
]);

const SHAPE_KINDS = new Set([
  'verticalSprout', 'branch', 'rootWeb', 'corruptionPatch', 'orbitRing',
  'constellation', 'frameEdge', 'waveLine', 'pulseLine',
]);

function resolveThemeKey(preset) {
  const visual = preset.visual ?? {};
  if (visual.asciiTheme && THEME_KEYS.has(visual.asciiTheme)) {
    return visual.asciiTheme;
  }
  switch (preset.asciiState) {
    case 'seed': return 'seed';
    case 'growth': return preset.species === 'Fern' ? 'fern' : 'root';
    case 'bloom':
      if (preset.species === 'Crystal') return 'crystal';
      if (preset.species === 'Juno Flowers') return 'juno';
      return 'bloom';
    case 'mutation': return 'mutation';
    case 'mycelium': return preset.species === 'Vine' ? 'vine' : 'mycelium';
    case 'ecosystem': return preset.species === 'Plantasonic' ? 'plantasonic' : 'coral';
    default: return 'seed';
  }
}

function resolveShapeKind(themeKey) {
  const map = {
    seed: 'verticalSprout', moss: 'corruptionPatch', bloom: 'branch', fern: 'branch',
    canopy: 'branch', vine: 'waveLine', rainforest: 'branch', desert: 'verticalSprout',
    juno: 'branch', 'night-bloom': 'constellation', roots: 'rootWeb', root: 'rootWeb',
    mycelium: 'corruptionPatch', mutation: 'corruptionPatch', crystal: 'constellation',
    winter: 'constellation', plantasonic: 'frameEdge', coral: 'waveLine',
  };
  return map[themeKey] ?? 'verticalSprout';
}

let failed = 0;

if (!Array.isArray(presets) || presets.length === 0) {
  console.error('FAIL: no presets loaded from plantasia-sound-engine');
  process.exit(1);
}

console.log(`Checking ${presets.length} presets…`);

const shapeSet = new Set();

for (const preset of presets) {
  if (!preset.id || !preset.name) {
    console.error(`FAIL: preset missing id/name`, preset);
    failed += 1;
    continue;
  }

  if (!preset.synth && !preset.botanical && !preset.plantasonic) {
    console.error(`FAIL: ${preset.id} has no synth routing`);
    failed += 1;
  }

  const themeKey = resolveThemeKey(preset);
  const shapeKind = resolveShapeKind(themeKey);
  shapeSet.add(shapeKind);

  if (!SHAPE_KINDS.has(shapeKind)) {
    console.error(`FAIL: ${preset.id} → unknown shape ${shapeKind}`);
    failed += 1;
  }
}

if (shapeSet.size < 4) {
  console.error(`FAIL: expected at least 4 distinct shape kinds, got ${shapeSet.size}`);
  failed += 1;
}

if (failed > 0) {
  console.error(`${failed} preset validation error(s).`);
  process.exit(1);
}

console.log(`ok: ${presets.length} presets, ${shapeSet.size} distinct shapes (${[...shapeSet].join(', ')})`);
process.exit(0);
