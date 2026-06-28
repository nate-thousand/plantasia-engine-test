# Plantasia Sound Worlds

Each preset in `plantasia-sound-engine` is a **Sound World** — a complete audiovisual ecosystem defined in JSON and consumed dynamically by the host application. No preset-specific behavior is hardcoded in the test app.

## Architecture

```
presets/**/*.json          Engine JSON (source of truth)
        ↓
PlantasiaPreset type       Typed schema (soundWorld.ts)
        ↓
engine exports             presets, getPresetControls, getPresetMold
        ↓
test app                   presetMetadata → presetStore → UI + ASCII + MIDI
```

## Preset JSON Schema

Every Sound World includes:

| Block | Purpose |
|-------|---------|
| `id`, `name`, `description`, `mood`, `tags` | Identity and discovery |
| `category` | Manifest grouping (`signature`, `soundWorlds`, `ambient`, `textures`) |
| `species`, `asciiState` | Legacy botanical routing (fallback) |
| `synth` | Oscillator, filter, envelope, effects |
| `visual` | ASCII theme, motion, palette, intensity |
| `controls` | Intentional macro defaults (all 8 sliders) |
| `midi` | Program change slot, mod wheel, expression, velocity curve |
| `plantasonic` / `botanical` | Signature synth routing (when applicable) |

### Visual block

```json
"visual": {
  "asciiTheme": "bloom",
  "motionStyle": "burst-rhythm",
  "colorPalette": ["#ffb8d0", "#ff8cb0"],
  "visualIntensity": 0.62,
  "animationStyle": "normal"
}
```

The host resolves `visual.asciiTheme` → theme template → ASCII scene painter. When `asciiTheme` is missing or not registered in the host's `THEME_TEMPLATES`, the app falls back to `asciiState` + `species` and shows a warning in the preset panel.

**Important:** New themes require a host template — engine build validates `asciiTheme` against `HOST_ASCII_THEMES`; the test app validates host templates against that registry at boot.

### Preset id vs display name

Stable JSON `id` values (e.g. `seed`, `fern`, `coral`) differ from display names (Moss, Canopy, Desert). Legacy aliases resolve via `resolvePresetId()` (`moss` → `seed`, etc.).

### Slider reset on preset switch

By default, switching presets resets all eight macro sliders to the preset's `controls` defaults. **Hold Shift** while selecting a preset (dropdown or ◀ ▶ ⎈) to keep current slider values.

### Live voice routing

Engine exposes `getPresetLiveRouting(preset)` → `plantasonic` | `botanical` | `standard`. Explicit `routing` in JSON overrides inferred `plantasonic` / `botanical` blocks.

### Controls block

```json
"controls": {
  "mold": 6,
  "tone": 45,
  "texture": 58,
  "bloom": 68,
  "growthRate": 72,
  "drift": 38,
  "mutation": 12,
  "energy": 58
}
```

Use `getPresetControls(preset)` from the engine. Explicit values override synth-derived fallbacks.

### MIDI block

```json
"midi": {
  "program": 3,
  "modWheel": 55,
  "expression": 70,
  "pitchBendRange": 2,
  "velocityCurve": "bright"
}
```

Program change maps to `midi.program` when set; otherwise catalog index.

On preset load the host applies `modWheel`, `expression`, `pitchBendRange`, and `velocityCurve`. Pitch bend and channel pressure route to audio on standard presets; velocity curve shapes live note dynamics.

## Sound World Catalog

| ID | Name | asciiTheme | Character |
|----|------|------------|-----------|
| `plantasonic` | Plantasonic | plantasonic | Flagship warm analog ecosystem |
| `seed` | Moss | moss | Soft, intimate, damp clusters |
| `root` | Roots | roots | Deep earthy branching |
| `bloom` | Bloom | bloom | Bright harmonic flowering |
| `fern` | Canopy | canopy | Wide airy tree canopy |
| `vine` | Rainforest | rainforest | Dense humid vegetation |
| `coral` | Desert | desert | Dry minimal heat shimmer |
| `crystal` | Winter | winter | Cold glassy snow drift |
| `juno-flowers` | Night Bloom | night-bloom | Dark cinematic fireflies |
| `mycelium` | Mycelium | mycelium | Underground spore network |
| `mutation` | Mutation | mutation | Glitch experimental chaos |

## Adding a New Sound World

1. Create `presets/<category>/<id>.json` with full metadata blocks.
2. Add the preset id to `presets/default.json` categories.
3. Add the id to `BUILTIN_PRESET_DATA` in `src/presets/loader.ts`.
4. Add `asciiTheme` to `HOST_ASCII_THEMES` in `src/presets/themeRegistry.ts` (engine build validates).
5. Add a matching theme template in the host's `THEME_TEMPLATES`.
6. Optionally add a scene painter in `BotanicalScenes.ts` (keyed by `asciiTheme`).
7. Optionally add audio-reactive profile in `ThemeReactiveBehavior.ts`.
8. Run `npm run build` in the engine; reinstall in the test app.

New themes **require** host template work — the app warns when `visual.asciiTheme` is unknown.

## Engine API

```typescript
import {
  presets,
  presetManifest,
  getPresetControls,
  getPresetMold,
  getPresetLiveRouting,
  resolvePresetId,
  HOST_ASCII_THEMES,
  type PlantasiaPreset,
  type PresetVisualConfig,
  type PresetMidiConfig,
  type LiveVoiceRouting,
} from 'plantasia-sound-engine';
```

## Host Consumption

| Concern | Module |
|---------|--------|
| Metadata normalization | `src/presets/presetMetadata.ts` |
| Control defaults | `getPresetControls()` via `presetControlDefaults.ts` |
| Visual themes | `PresetVisualThemes.ts` (metadata-first) |
| Scene painting | `BotanicalScenes.ts` (asciiTheme routing) |
| Audio reactivity | `ThemeReactiveBehavior.ts` |
| MIDI defaults on load | `PresetMidiDefaults.ts` |
