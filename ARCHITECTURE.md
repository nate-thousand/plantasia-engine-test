# Architecture

System architecture for `plantasia-engine-test` — a playground application that orchestrates the Plantasia sound engine, visuals, and future UI.

## Overview

Plantasia separates **synthesis** (library) from **application** (this repo). The application composes audio, procedural ASCII, canvas rendering, and React UI without embedding synth logic.

## Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Future UI — components, layouts, hooks                 │
├─────────────────────────────────────────────────────────┤
│  Visuals — ascii/, visuals/, canvas/                    │
├─────────────────────────────────────────────────────────┤
│  Application — app/, stores/, systems/                  │
├─────────────────────────────────────────────────────────┤
│  Audio orchestration — src/audio/                       │
├─────────────────────────────────────────────────────────┤
│  plantasia-sound-engine (dependency)                    │
├─────────────────────────────────────────────────────────┤
│  Web Audio / Tone.js                                    │
└─────────────────────────────────────────────────────────┘
```

## Source Directories

| Directory | Role |
|-----------|------|
| `src/app/` | Top-level application shell and routing |
| `src/audio/` | Engine lifecycle, presets, MIDI, sequencing, visualization hooks |
| `src/ascii/` | Procedural ASCII organism per `docs/brand/ASCII_GRAMMAR.md` |
| `src/visuals/` | Non-ASCII visual subsystems |
| `src/canvas/` | Canvas rendering and animation loops |
| `src/components/` | Reusable React components |
| `src/layouts/` | Page and panel layouts |
| `src/hooks/` | Shared React hooks |
| `src/stores/` | Application state |
| `src/transport/` | Unified playback controller — single source for play/stop, hold, and transport state |
| `src/systems/` | Cross-cutting coordinators (input, animation) |
| `src/tokens/` | Design tokens — SCSS and CSS variables |
| `src/styles/` | Global styles; instrument SCSS entry |
| `src/utils/` | Pure shared utilities |

## Audio Layer

The audio layer (`src/audio/`) is the only application code that talks directly to `plantasia-sound-engine`.

| Submodule | Responsibility |
|-----------|----------------|
| `engine/` | Construct, start, and dispose `PlantasiaEngine` |
| `presets/` | Load and apply engine presets |
| `midi/` | Route Web MIDI into the engine |
| `sequencing/` | Transport and pattern coordination |
| `visualization/` | Emit signals for ASCII and canvas layers |

See [src/audio/README.md](./src/audio/README.md) for subsystem contracts.

## Styling

- **Instrument UI (M14)** — monochrome design tokens + shared primitives ([`docs/design/UI.md`](./docs/design/UI.md))
- **Theme tokens** defined as CSS custom properties (`src/tokens/_css-variables.scss`)
- **Entry** — `src/styles/main.scss` imports base reset, app shell, and instrument primitives/surface
- **Legacy** — Bootstrap SCSS files retained but not loaded in production bundle

## Dependency Boundary

| Concern | Owner |
|---------|-------|
| Synth graph, presets, botanical controls | `plantasia-sound-engine` |
| Engine initialization and app state | `src/audio/` |
| ASCII grammar and rendering | `src/ascii/` + `docs/brand/` |
| UI and layout | `src/components/`, `src/layouts/` |

**Rule:** Never modify `plantasia-sound-engine` from this repository. Upgrade the dependency version or file path when engine APIs change.

## Module System

- ESM throughout (`"type": "module"`)
- TypeScript with bundler module resolution
- Vite for dev server and production builds
- SCSS processed by `sass`

## Documentation Map

| Path | Contents |
|------|----------|
| `docs/brand/` | ASCII visual grammar, brand voice |
| `docs/architecture/` | Extended architecture notes |
| `docs/design/` | Design token and layout documentation |
| `docs/engineering/` | Workflow and integration guides |

## Preset Synchronization

Changing a preset triggers a single activation chain — every subsystem updates together:

```
PresetControls / MIDI program change
        ↓
loadPresetAtIndex()
  ├→ stopAllNotes() + clearActiveNotes()
  ├→ engine.playPreset() — chord preview (Plantasonic / Juno / standard)
  ├→ LiveVoiceRouter.preparePreset() — live keyboard/MIDI graph
  ├→ getPresetControls() — sliders from preset controls block
  ├→ setControlSurface() + engineAdapter.applyControlSurface()
  └→ presetStore.setActivePresetIndex()
        ↓
useAsciiVisualization → AsciiEngine (theme reset + crossfade)
```

| Live voice mode | Trigger | Graph |
|-----------------|---------|-------|
| `plantasonic` | `preset.plantasonic != null` | Plantasonic flagship Web Audio graph |
| `juno` | `preset.botanical != null` | Juno Flowers botanical graph |
| `standard` | all other presets | Tone.js PolySynth mirror |

Control defaults come from each preset's `controls` block via engine `getPresetControls()`.

See [PRESETS.md](./PRESETS.md) for the Sound World metadata schema and extension guide.

## Unified Transport (Milestone 13B)

All playback — UI, keyboard, MIDI, and programmatic — routes through one controller.

```
┌─────────────────────────────────────────────────────────┐
│  UnifiedTransport.tsx  (Play · Stop · Preset · Menu)    │
└───────────────────────────┬─────────────────────────────┘
                            │
         Spacebar ──────────┤
         MIDI pads/CC ──────┼──→ transportActions.ts
         Keyboard notes ───┤         │
                            │         ├→ EngineAdapter (audio)
                            │         ├→ engineStore (activeNotes, audioReady sync)
                            │         └→ transportStore (transportState, hold)
                            │
         useAsciiVisualization ← engineStore.audioReady + visualEnergy
```

### Transport states

| State | Meaning |
|-------|---------|
| `idle` | Audio context not started |
| `loading` | Unlock + preset bootstrap in progress |
| `ready` | Audio running, ambient idle |
| `playing` | Chord burst and/or active notes |

### Playback lifecycle

- **Play** (UI, Space, or MIDI): start audio if needed → trigger chord → set `playing`
- **Stop**: `stopAllNotes()` → clear active notes → `ready` (preset unchanged)
- **Notes** (keyboard/MIDI): `transportNoteOn` / `transportNoteOff` with shared hold flag

Settings drawer (`InstrumentSurface`) holds Sound, Visual, Performance, and Output modules — transport stays in `UnifiedTransport`.

## Sound World Metadata Flow

```
preset JSON (visual, controls, midi, tags)
        ↓
buildPresetMetadata() → presetStore.activeMetadata
        ↓
├→ getPresetControls() → UI sliders + engine
├→ getPresetVisualTheme() → AsciiEngine themes + scenes
├→ applyPresetMidiDefaults() → midiStore
└→ ThemeReactiveBehavior → plant growth multipliers
```

## Visual Pipeline (Milestone 9)

Note-driven ASCII rendering follows a strict data flow — React never hardcodes organism artwork.

```
Keyboard / MIDI / Sliders / Preset
        ↓
  engineStore (activeNotes, inputEnergy)
  controlStore (sound: mold, tone, texture, bloom; modulation)
        ↓
  buildOrganismState() — OrganismState.ts
        ↓
  buildOrganismFromState() — OrganismMappings.ts
        ↓
  Renderer → ASCII string → OrganismView
```

## Procedural ASCII Engine (Milestone 11)

Real-time 60 FPS visualization replaces static organism snapshots.

```
engineStore + controlStore + midiStore
        ↓
useAsciiVisualization (requestAnimationFrame)
        ↓
AsciiEngine.tick()
  ├→ PlantGenerator — note → procedural plant structures
  ├→ ParticleSystem — spores, leaves, wind, reverb particles
  ├→ SoundMapping — sliders → envelope/LFO/effects viz params
  ├→ PresetVisualThemes — per-preset ASCII ecosystem (characters, motion, growth)
  ├→ ThemeTransition — smooth crossfade on preset change
  └→ AsciiRenderer — priority-layer grid compositing
        ↓
AsciiCanvasView (responsive, accessibility-aware)
```

| Module | Role |
|--------|------|
| `AsciiEngine.ts` | Simulation orchestrator, frame tick |
| `AsciiRenderer.ts` | Grid buffer, layer priority, string output |
| `CharacterPalette.ts` | Botanical character categories |
| `PlantGenerator.ts` | Procedural plants from notes/velocity/species |
| `ParticleSystem.ts` | Spores, leaves, wind, echo/reverb particles |
| `NoteEvents.ts` / `MidiEvents.ts` | Input-agnostic note spawn/release |
| `PresetVisualThemes.ts` | Full preset visual theme definitions |
| `ThemeTransition.ts` | Smooth preset crossfade |
| `ThemeBehaviors.ts` | Per-theme sound parameter interpretation |
| `PresetThemes.ts` | Re-exports theme resolution API |
| `SoundMapping.ts` | Slider → synthesis visualization parameters |
| `visualizationStore.ts` | Accessibility settings (localStorage) |

The legacy `src/visuals/organism/` pipeline remains available for reference; the live instrument uses `src/visualization/`.

## Foundation Status

Current build provides a real-time procedural ASCII ecosystem driven by sound, MIDI, and presets. See [ROADMAP.md](./ROADMAP.md).
