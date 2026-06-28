# Preset Visual Themes

Each audio preset in Plantasia maps to a unique ASCII visual ecosystem. Preset changes crossfade smoothly over ~1.4 seconds unless the preset requires a hard reset (e.g. Mutation).

## Architecture

```
PresetVisualThemes.ts   — theme definitions (character sets, behaviors, palettes)
BotanicalScenes.ts      — full-frame representational ASCII scene per preset
ThemeTransition.ts      — smooth crossfade for dynamic layers
ThemeBehaviors.ts       — per-theme interpretation of sound parameters
ThemeCharacters.ts      — character selection from theme characterSet
PlantGenerator.ts       — theme-specific growth, sway, bloom, decay
ParticleSystem.ts       — theme-specific particles, trails, drift
AsciiRenderer.ts        — theme-specific background, ground, spectrum
AsciiEngine.ts          — wires theme transition + rendering pipeline
```

## Theme Schema

Each preset defines a `PresetVisualThemeDefinition`:

```typescript
{
  id: string;
  name: string;
  characterSet: string[];      // Unique ASCII palette per preset
  density: number;             // 0–1 background + spawn density
  motionStyle: MotionStyle;    // breathing | heavy-pulse | burst-rhythm | ...
  growthBehavior: GrowthBehavior;
  particleBehavior: string;    // Human-readable description
  bloomBehavior: string;
  decayBehavior: DecayBehavior;
  colorPalette: string[];      // CSS hex hints for UI accents
  spatialLayout: SpatialLayout;
  rhythm: number;              // Particle / burst rate multiplier
  contrast: number;            // Visual contrast 0–1
  hardResetOnChange: boolean;  // Clear plants on preset switch
}
```

## Preset → Visual Identity

| Preset ID | Visual Archetype | Motion | Growth | Characters |
|-----------|------------------|--------|--------|------------|
| `seed` | Pluck / Seed | seed-pop | seed-arc | `. ' ` * + ° ◌ ·` |
| `root` | Bass / Root | heavy-pulse | downward-root | `█ ▓ ▒ ░ \| / \ # % @` |
| `bloom` | Lead / Bloom | burst-rhythm | fast-bloom | `* + ✦ ✧ ^ / \ \| < >` |
| `mycelium` | Granular / Spore | swarm-drift | particle-cloud | `. , ' ` : ; ° · ◌` |
| `mutation` | Noise / Glitch | glitch-symmetry | crystal-facet | `# @ % x X * + ░ ▒ ▓` |
| `fern` | Soft Botanical Pad | breathing | slow-vine | `. , ' ` : ; ~ ° ◌ ○ ░ ▒` |
| `coral` | Ambient / Field | horizon-wave | field-wave | `~ . , : ; ◌ ○ ░ ▒ °` |
| `vine` | Soft Botanical Drape | breathing | slow-vine | `. , ' ` : ; ~ ° ◌ ○ ░ ▒` |
| `crystal` | FM / Crystal | glitch-symmetry | crystal-facet | `+ x X / \ < > { } [ ] ◆ ◇` |
| `juno-flowers` | Lead / Bloom | burst-rhythm | fast-bloom | `* + ✦ ✧ ^ / \ \| < > ○ ●` |

## Sound Parameter Mapping

Each theme interprets instrument parameters differently via `ThemeBehaviors.ts`:

| Parameter | Visual Effect |
|-----------|---------------|
| Note on | New plant growth + theme-specific particles |
| Velocity | Size, brightness, particle count |
| Pitch | Vertical placement |
| Pan | Horizontal placement |
| Filter cutoff | Openness / density (moss vs crystal differ) |
| Resonance | Branching / sparkle (crystal > root) |
| Attack | Growth speed (seed fast, root slow) |
| Release | Fade speed per decayBehavior |
| Delay | Echo seed trails (longer for ambient/spore) |
| Reverb | Atmospheric spores (wider for coral/fern) |
| Distortion | Decay artifacts (mutation, moss) |

## Adding a New Preset Theme

1. Add the preset to the sound engine (outside this repo's scope).

2. Add an entry to `PRESET_VISUAL_THEMES` in `src/visualization/PresetVisualThemes.ts`:

```typescript
'my-new-preset': {
  id: 'my-new-preset',
  name: 'My New Preset',
  characterSet: ['~', '.', '◌'],
  density: 0.5,
  motionStyle: 'breathing',
  growthBehavior: 'slow-vine',
  particleBehavior: 'Describe particle style',
  bloomBehavior: 'Describe bloom style',
  decayBehavior: 'gentle-unfurl',
  colorPalette: ['#aabbcc'],
  species: 'vine',
  palette: ['vine', 'leaf', 'moss'],
  growthStyle: 'upward',
  particleBias: 'spore',
  animationSpeed: 0.5,
  windStrength: 0.3,
  spatialLayout: 'wide-organic',
  rhythm: 0.4,
  contrast: 0.5,
  hardResetOnChange: false,
  accentChars: ['~', '◌'],
},
```

3. If the new preset needs unique behavior, extend switches in:
   - `ThemeBehaviors.ts` — growth, release, particles
   - `PlantGenerator.ts` — initial segments, draw logic
   - `ParticleSystem.ts` — velocity, life, drift
   - `AsciiRenderer.ts` — background noise, ground pattern

4. Run `npm run typecheck && npm run build` to verify.

5. Test: switch presets while playing notes via keyboard and MIDI; confirm pattern language changes visibly.

## Transition Behavior

- `ThemeTransition` lerps density, speed, wind, rhythm, and contrast over 1.4s.
- Character sets and growth behaviors swap at the midpoint of the transition.
- `hardResetOnChange: true` clears existing plants early in the transition (Mutation only).
- All other presets preserve existing plants and morph parameters around them.

## MIDI / MPK Mini Integration

All MIDI interactions route through `ThemeMidiEffects.ts` so bursts, knob twists, and pitch bend produce **preset-specific** particle patterns:

| MIDI Input | Audio Effect | Visual Effect (varies by preset) |
|------------|--------------|----------------------------------|
| Knobs CC 1–8 | Slider values | Theme-char particles at active plants |
| Bank A pads | Transport / preset / energy | Burst-rhythm or seed-pop patterns |
| Bank B pads | Temporary slider boosts | Bloom, reverb, drift themed to preset |
| Pitch bend | Pan offset | Horizon-wave or wind drift burst |
| Program change | Preset load | Preset-change spore cloud |
| Channel pressure | — | Accent char + intensity boost |

See `src/input/MpkMiniProfile.ts` for the full Akai MPK Mini map and `TESTING.md` for verification steps.
