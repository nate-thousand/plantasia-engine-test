# Adaptive Ambient Focus Engine (Milestone 15)

Generative ambient playback for transport **Play** mode. Play mode is **orchestration only** — it owns timing and interaction, never synthesis. Each preset owns its sound world through a routed `PresetTimbreSession`.

## Architecture

```
transportPlay()
       │
       ▼
AmbientSoundscape (facade)
       │
       ▼
AmbientFocusEngine (orchestration — timing, phrase memory, gestures)
       ├── harmonicProfile       ← when/what notes (preset-specific weights)
       ├── probabilityEngine     ← weighted selection
       ├── phraseMemory          ← avoids obvious repetition
       ├── gestureVocabulary     ← preset-specific timing/rests/surprises
       ├── presetMacroMappings   ← bloom/mold/texture/drift per routing
       └── PresetTimbreSession   ← preset-owned sound world
             ├── plantasonicSession  → engine Plantasonic graph
             ├── junoSession         → engine Juno Flowers graph
             └── standardSession     → profile-driven graph (engine mirror)
```

## Preset owns sound; Play owns timing

Play mode requests layers from the active preset — it never instantiates Tone.js synths directly.

| Layer | Role | Voice slot |
|-------|------|------------|
| Drone | Harmonic anchor | `drone` |
| Pulse | Sub/bass movement | `sub` |
| Texture | Sustained pads | `pad` |
| Melody | Sparse accents | `bell` |
| Gesture | Pluck droplets | `pluck` |
| Noise | Air bed | `air` |

Each session implements:

- `createDroneLayer()` · `createPulseLayer()` · `createMelodyLayer()`
- `createTextureLayer()` · `createGestureLayer()` · `createNoiseLayer()`
- `createFXChain()` via session graph + `applyControls()`

## Timbre profile (per preset)

Each preset resolves a `TimbreProfile` via `resolveTimbreProfile()`:

```typescript
timbreProfile: {
  oscillators, noiseType, filterShape, envelopes,
  modulation, effectsChain, motionBehavior,
  densityRange, textureLayer, performanceMacros,
  routing, voiceKinds, soundWorld
}
```

**Plantasonic** — organic filtered noise, FM blooms, tape delay, wow/flutter, granular shimmer, living voice tick.

**Juno Flowers** — detuned saws, chorus, warm pads, floral droplets, BBD delay, tape saturation.

**Standard** — derived from `preset.synth` + category/asciiState heuristics.

## Macro controls (preset-specific)

`presetMacroMappings.ts` interprets UI sliders differently per routing:

| Macro | Plantasonic | Juno Flowers |
|-------|-------------|--------------|
| **Bloom** | Organic filter movement, shimmer, longer blooms | Chorus depth, stereo width, pad swell |
| **Mold** | Granular spores, tape degradation, unstable resonance | Analog instability, chorus wobble, delay flutter |
| **Texture** | Organic bed + filtered noise | Morning mist / air layer |
| **Drift** | VLF plant-like modulation | Slow analog wind |

MIDI CC, Learn, QWERTY, and touchscreen all route through the same macro layer.

## Generative engine

- Probability-based phrase generation with preset-specific weights
- Phrase memory — penalizes recent motifs, occasional recall for continuity
- Evolving density bias over long sessions
- Rests, silence, register shifts
- Long modulation cycles via `gestureVocabulary.longCycleMinutes`
- Micro-timing jitter and surprise accents
- No fixed arpeggios or synchronized loops

## Visual sync

`ambientStateStore` exposes generative state including `soundWorld`:

- `voiceDensity`, `padEnergy`, `textureAmount`, `stereoSpread`
- `evolutionPhase`, `recentActivity`, `soundWorld`

`VisualEnergy` blends preset-specific energy (Plantasonic → texture, Juno → stereo spread).

## Engine boundary

| Concern | Owner |
|---------|-------|
| Plantasonic/Juno synthesis | `plantasia-sound-engine` |
| Generative scheduling | This app (`AmbientFocusEngine`) |
| Timbre profile resolution | This app (future: engine preset schema) |
| Standard ambient graph | This app (mirrors engine until engine exposes layer API) |
| Live keyboard/MIDI | `LiveVoiceRouter` → engine or standard mirror |

## Adding a new preset

1. Define preset JSON in `plantasia-sound-engine` with `synth`, optional `plantasonic`/`botanical`, `controls`, `visual`.
2. Set routing via `getPresetLiveRouting()` (explicit or inferred).
3. Timbre and gesture vocabulary resolve automatically from preset blocks.
4. No changes to `AmbientFocusEngine` required unless adding a new routing type.

## Related files

| File | Role |
|------|------|
| `AmbientFocusEngine.ts` | Orchestration scheduler |
| `presetSoundWorld.ts` | Layer interface contract |
| `timbreProfile.ts` | Preset → timbre definition |
| `presetMacroMappings.ts` | Preset-specific macro behavior |
| `gestureVocabulary.ts` | Timing, rests, surprise events |
| `phraseMemory.ts` | Motif memory |
| `timbreSession/` | Preset-routed audio backends |
| `harmonicProfile.ts` | Harmonic rules + preset weights |
| `ambientStateStore.ts` | Visual sync |
