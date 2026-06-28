# Roadmap

Implementation plan for `plantasia-engine-test`. Each milestone builds on the foundation established in v0.1.0.

## Milestone 1 — App Shell and Visual Foundation

**Status:** Complete (superseded layout — see Milestone 5)

> **Note:** The original dashboard-style shell (status cards, section labels, diagnostics layout) was a temporary development scaffold only. It is **not** the product direction for Plantasia.

### Goals

Establish the first visible application shell before connecting the sound engine.

### Tasks

- [x] Dark minimalist Bootstrap layout
- [x] Project title and subtitle
- [x] Sound Engine Status section
- [x] ASCII Grammar Preview section
- [x] Next Controls section
- [x] Placeholder engine status cards
- [x] Disabled audio control buttons
- [x] ASCII preview using `docs/brand/ASCII_GRAMMAR.md`
- [x] Confirm app runs through Vite dev server

### Definition of Done

- [x] App loads at the Vite local URL.
- [x] First UI shell is visible.
- [x] No audio logic is implemented yet.
- [x] No sound engine internals are modified.
- [x] No canvas renderer is created.
- [x] No MIDI implementation is created.

---

## Milestone 2 — Foundation

**Status:** Complete

- [x] Vite + React + TypeScript project scaffold
- [x] Bootstrap 5.0.2 + SCSS theme variable structure
- [x] Folder architecture and documentation
- [x] Local `plantasia-sound-engine` dependency wiring
- [x] Audio layer placeholder contracts
- [x] ASCII brand grammar documentation

---

## Milestone 3 — Engine Integration

**Status:** Complete

### Goals

Connect `plantasia-sound-engine` without modifying its source code. The engine remains an independent package.

### Tasks

- [x] Install local sound engine as a dependency (`file:../plantasia-sound-engine`)
- [x] Application wrapper at `src/audio/engine.ts`
- [x] Initialize engine on Start Audio user gesture
- [x] Update status cards — Engine dependency → connected, Audio context → running
- [x] Enable Start Audio button (disable after successful init)
- [x] Keep Load Preset, Play Note, and Stop Note disabled
- [x] Log engine initialization to the browser console
- [x] Display initialization errors in the UI

### Definition of Done

- [x] App loads via Vite dev server
- [x] Start Audio initializes the engine and unlocks the audio context
- [x] Status cards update on success
- [x] Console reports successful initialization
- [x] No TypeScript errors
- [x] No changes to `plantasia-sound-engine`

### Deferred

- [ ] Preset loading and switching UI (`src/audio/presets/`)
- [ ] Application store for engine state (`src/stores/`)
- [ ] MIDI, sequencing, and visualization hooks

---

## Milestone 4 — Living Organism Visualization

**Status:** Complete

### Vision

Plantasia is not a synthesizer with a visualizer. Sound, interaction, and visualization are one living system. Every visible element represents sound, growth, modulation, harmony, energy, mutation, or biological state. The ASCII grammar is the foundation of the visual language.

### Goals

Replace the placeholder ASCII preview with the first procedural organism. Establish rendering architecture only — static output, intentionally minimal.

### Tasks

- [x] Organism renderer module at `src/visuals/organism/` (`Grammar`, `Node`, `Edge`, `Organism`, `Renderer`)
- [x] Parse and encode ASCII grammar rules from `docs/brand/ASCII_GRAMMAR.md`
- [x] Render first procedural organism (nodes + connections, grammar symbols only)
- [x] Node data model with placeholders for oscillator, voice, preset, modulation, effect, harmonic, and state roles
- [x] Edge data model with placeholders for signal flow, modulation, energy, harmony, and synchronization
- [x] Dark palette, single accent, no gradients or decorative graphics
- [x] Organism as primary visual focus in the app shell
- [x] Architecture prepared for future animation and engine event binding (no runtime coupling yet)

### Rendering Architecture Summary

| Module | Role |
|--------|------|
| `Grammar.ts` | Approved symbols, biological states, connection glyph selection |
| `Node.ts` | Graph vertices with semantic roles and engine binding placeholders |
| `Edge.ts` | Directed connections with connection-kind semantics |
| `Organism.ts` | Procedural graph assembly (`createInitial()` growth pattern) |
| `Renderer.ts` | Grid-based ASCII rasterization; `RenderOptions` reserved for animation |

Data flows: **Grammar → Organism graph → Renderer → ASCII output → UI `<pre>`**

### Definition of Done

- [x] Procedural organism replaces placeholder ASCII block
- [x] Renderer is modular, extensible, and grammar-driven
- [x] No animation, engine coupling, MIDI, presets UI, canvas, or WebGL
- [x] No changes to `plantasia-sound-engine`

---

## Milestone 5 — Fullscreen Visual Instrument Shell

**Status:** Complete

### Direction

Plantasia apps are fullscreen, minimal, immersive, and visualizer-first. The ASCII organism is the main interface; controls are secondary overlays. Dashboard diagnostics are not the product.

### Tasks

- [x] Replace dashboard layout with fullscreen `100vw` / `100vh` instrument shell
- [x] Center ASCII organism as primary visual focus (no cards, no section labels)
- [x] Minimal overlay chrome — title, audio state indicator, bottom controls
- [x] Remove developer language from screen (status cards, MIDI/preset diagnostics)
- [x] Visual states: dormant → active → playing → resting
- [x] Wire Start Audio, Load Preset, Play Note, Stop Note to engine wrapper
- [x] Keep organism renderer modular under `src/visuals/organism/`

### Architecture

| Layer | Path | Role |
|-------|------|------|
| Shell | `src/layouts/InstrumentShell.tsx` | Fullscreen grid, no scroll |
| Chrome | `src/components/overlays/TopOverlay.tsx` | Title + status overlays |
| Visualizer | `src/components/overlays/OrganismView.tsx` | Centered organism output |
| Controls | `src/components/controls/ControlDock.tsx` | Bottom control dock (see M6) |
| State | `src/hooks/useInstrument.ts` | Audio + visual state coordination |
| Organism states | `src/visuals/organism/InstrumentVisualState.ts` | Grammar-driven topology per state |

### Definition of Done

- [x] App renders fullscreen with organism dominant
- [x] No dashboard UI remains visible
- [x] Engine visual feedback through organism states only
- [x] No changes to `plantasia-sound-engine`

---

## Milestone 6 — Instrument Control Surface

**Status:** Complete

### Direction

Fullscreen Plantasia instrument with a modular bottom control dock — not a developer dashboard. Transport, preset, sound, modulation, and MIDI groups as secondary overlays beneath the organism.

### Tasks

- [x] Fullscreen control dock (`src/components/controls/ControlDock.tsx`)
- [x] Transport controls — Start Audio, Play, Stop, Hold (placeholder)
- [x] Preset controls — selector, prev, next, random
- [x] Sound controls — volume, tone, texture, bloom sliders
- [x] Modulation controls — growth, drift, mutation, energy sliders
- [x] MIDI placeholders — status, learn, device selector
- [x] Top overlay — title, audio state, preset name, MIDI state
- [x] Visual state mapping — energy → particles, mutation → ╳, bloom → flower cross
- [x] Remove remaining simple-button developer UI

### Architecture

| Layer | Path |
|-------|------|
| Dock | `src/components/controls/ControlDock.tsx` |
| Overlays | `src/components/overlays/TopOverlay.tsx`, `OrganismView.tsx` |
| State | `src/hooks/useInstrument.ts`, `src/types/instrument.ts` |
| Presets | `src/audio/presets.ts` |
| Organism mapping | `src/visuals/organism/InstrumentVisualState.ts` |

Placeholder mappings (volume, tone, texture, growth, drift, hold, MIDI) are marked in hook comments for future engine wiring.

---

## Milestone 7 — Sound Engine Control Integration

**Status:** Complete

### Goals

Wire transport and preset controls to the engine. Volume drives output gain. Other sliders update the organism visually first; sound mapping follows in a later pass.

### Tasks

- [x] Start Audio initializes engine and unlocks audio context
- [x] Play Note triggers `triggerChord()` through engine wrapper
- [x] Stop Note releases voices via engine wrapper
- [x] Preset selector loads bundled engine presets (`playPreset`)
- [x] Volume slider maps to output gain via `applyBotanicalControls`
- [x] Tone, Texture, Bloom, Growth, Drift, Mutation, Energy update organism visuals
- [ ] Tone / Texture / Bloom / Growth / Drift / Mutation / Energy → engine parameters (deferred)

### Architecture

| Control | Audio | Visual |
|---------|-------|--------|
| Start Audio | `startAudioEngine()` | dormant → active |
| Play Note | `playEngineNote()` | playing |
| Stop Note | `stopEngineNote()` | resting |
| Preset | `loadPresetAtIndex()` | preset name overlay |
| Volume | `setOutputVolume()` | — |
| Tone | deferred | harmonic halo |
| Texture | deferred | density band |
| Bloom | deferred | flower cross |
| Growth | deferred | upward reach |
| Drift | deferred | asymmetric particles |
| Mutation | deferred | ╳ disruption |
| Energy | deferred | particle row |

---

## Milestone 8 — Playable Input: MIDI and Computer Keyboard

**Status:** Complete

### Goals

Make Plantasia playable from the computer keyboard and Web MIDI devices (including Akai MPK Mini) without turning the app into a developer dashboard.

### Tasks

- [x] Computer keyboard map (A–K row) with keydown/keyup, repeat suppression, form-field ignore
- [x] Web MIDI access after user gesture, device list, selector, note on/off with velocity
- [x] `EngineAdapter` facade — `startAudio`, `noteOn`, `noteOff`, `stopAllNotes` (no direct engine calls from React)
- [x] `engineStore` for input state, active notes, velocity energy, last note
- [x] Visual feedback — playing/resting from held notes, velocity → energy density, MIDI activity pulse
- [x] Keyboard and MIDI control groups in bottom dock; device + last note in top overlay

### Architecture

| Layer | Path |
|-------|------|
| Note map | `src/input/noteMap.ts` |
| Keyboard | `src/input/KeyboardInput.ts` |
| MIDI | `src/input/MidiInput.ts` |
| Engine facade | `src/audio/EngineAdapter.ts` |
| Input state | `src/stores/engineStore.ts` |
| Hook wiring | `src/hooks/useInstrument.ts` |
| Controls | `src/components/controls/KeyboardControls.tsx`, `MidiControls.tsx` |

Live notes use a Tone.js PolySynth on the shared audio context until `plantasia-sound-engine` exposes `noteOn`/`noteOff`.

---

## Milestone 9 — Note Driven ASCII Visual Language

**Status:** Complete

### Goals

Make the ASCII organism visually respond to actual musical input — notes, velocity, sliders, presets, and harmony — using the formal grammar in `docs/brand/ASCII_GRAMMAR.md`.

### Tasks

- [x] Visual mapping layer under `src/visuals/organism/` (`OrganismState`, `OrganismMappings`, `NoteVisualMapper`, `ToneVisualMapper`, `EnergyVisualMapper`, `GrammarSymbols`)
- [x] Pitch-class → organism form mapping (C = center/root, C# = mutation, D = upward growth, …)
- [x] Octave → vertical placement; velocity → density glyphs (·/•/● and ░/▒/▓)
- [x] Keyboard (A–K) and MIDI notes share the same visual system via `engineStore.activeNotes`
- [x] Chord / interval awareness — consonance → harmony structures, dissonance → tension, clusters → density
- [x] Slider → visual mapping (volume, tone, texture, bloom, growth, drift, mutation, energy)
- [x] Preset visual identity fallbacks from preset id / category
- [x] Pipeline: Input → EngineStore → OrganismState → Visual Mapper → Renderer
- [x] Minimal overlay feedback — note label, active note count, visual state name

### Architecture

| Module | Role |
|--------|------|
| `OrganismState.ts` | Composed visual state + harmony / life-state classification |
| `NoteVisualMapper.ts` | Note → pitch form, octave offset, velocity density |
| `ToneVisualMapper.ts` | Volume, tone, texture, bloom → glyphs |
| `EnergyVisualMapper.ts` | Growth, drift, mutation, energy → glyphs |
| `OrganismMappings.ts` | Chord structures, preset identity, organism graph assembly |
| `InstrumentVisualState.ts` | Hook-facing facade + overlay indicators |

### Definition of Done

- [x] Organism reacts to keyboard and MIDI notes with grammar-correct forms
- [x] Chords produce harmony or tension structures
- [x] Sliders update visual state without changing sound behavior
- [x] No hardcoded artwork in React components
- [x] No changes to `plantasia-sound-engine`

---

## Milestone 10 — Full MIDI Control Mapping

**Status:** Complete

### Goals

Make the instrument fully playable and controllable from MIDI keyboards and controllers (primary target: Akai MPK Mini). Notes, CCs, pads, presets, and learn mappings route through a dedicated input pipeline — not React components.

### Tasks

- [x] `MidiMessageParser` — note on/off, CC, program change parsing
- [x] `MidiControlMap` — standard CC map + MPK Mini knob fallback (device name detection)
- [x] `MidiLearn` — target selection, CC assignment, localStorage persistence (`plantasia-midi-mappings`)
- [x] `MidiStorage` — learned mapping save/restore
- [x] `MidiRouter` — full message routing pipeline
- [x] `controlStore` — unified slider state (UI + MIDI share one code path)
- [x] `midiStore` — last message, detected CCs, learn state, interaction bursts
- [x] Pad / button support — default note + CC pad maps, energy/mutation bursts
- [x] Preset control via MIDI — prev/next/random + program change
- [x] Visual feedback — overlay + slider highlight on MIDI CC changes
- [x] Hold mode — note off suppressed when hold enabled

### Architecture

```
MIDI Device → MidiInput → MidiMessageParser → MidiRouter
                    ↓                              ↓
              midiStore                    MidiControlMap / MidiLearn
                    ↓                              ↓
              engineStore ← notes          controlStore → EngineAdapter
                    ↓                              ↓
              OrganismState ←──────────────────────┘
```

| Module | Role |
|--------|------|
| `MidiDefaults.ts` | Standard CC map, MPK Mini fallback, pad defaults |
| `MidiMessageParser.ts` | Raw bytes → typed messages |
| `MidiControlMap.ts` | CC → control target resolution |
| `MidiLearn.ts` | Learn workflow |
| `MidiStorage.ts` | localStorage persistence |
| `MidiRouter.ts` | Message dispatch + action handlers |
| `controlStore.ts` | Canonical slider values (0–100) |
| `midiStore.ts` | MIDI UI + feedback state |

### Definition of Done

- [x] MIDI notes trigger sound + ASCII visuals with velocity density
- [x] MIDI CCs move matching sliders and update sound/visuals
- [x] MIDI Learn assigns and persists mappings
- [x] Pads trigger transport/preset/burst actions
- [x] No MIDI logic inside React components
- [x] No changes to `plantasia-sound-engine`

---

## Milestone 11 — Procedural ASCII Visualization Engine

**Status:** Complete

### Goals

Replace static organism snapshots with a real-time 60 FPS procedural ASCII ecosystem. Every sound parameter influences generated artwork. The engine is modular and independent from synthesis internals while subscribing to instrument state.

### Tasks

- [x] `src/visualization/` — `AsciiEngine`, `AsciiRenderer`, `CharacterPalette`, `PlantGenerator`, `ParticleSystem`, `NoteEvents`, `MidiEvents`, `PresetThemes`, `SoundMapping`
- [x] Fullscreen responsive ASCII canvas (`AsciiCanvasView`) with ResizeObserver grid scaling
- [x] Botanical character palette (seeds, moss, vines, flowers, spores, etc.)
- [x] Sound mapping — note/velocity/pitch/envelope/LFO/effects → plant growth, particles, wind
- [x] Preset themes — per-preset species, palette, growth style, density, animation speed
- [x] Procedural animation — growing, blooming, swaying, branching, release, falling leaves, spores
- [x] Input-agnostic note events (keyboard, MIDI, sequencer, automation share one path)
- [x] Accessibility — density, animation speed, character size, contrast, reduce motion (`visualizationStore`)
- [x] `requestAnimationFrame` render loop via `useAsciiVisualization`

### Architecture

```
engineStore + controlStore + midiStore
        ↓
useAsciiVisualization (60 FPS)
        ↓
AsciiEngine.tick()
  ├→ PlantGenerator (note → plant structures)
  ├→ ParticleSystem (spores, leaves, wind, reverb)
  ├→ SoundMapping (sliders → synth viz params)
  └→ AsciiRenderer (layer compositing)
        ↓
AsciiCanvasView → fullscreen <pre>
```

### Definition of Done

- [x] Fullscreen responsive ASCII visualization
- [x] Procedural plant generation — no static art assets
- [x] MIDI + keyboard + slider reactive
- [x] Preset-specific visual themes
- [x] Smooth animation with reduce-motion support
- [x] Modular architecture, documented
- [x] No changes to `plantasia-sound-engine`

---

## Milestone 12 — Sequencing

**Status:** Planned

- [ ] Transport and pattern playback (`src/audio/sequencing/`)
- [ ] Hook engine sequencer exports when available

## Milestone 13 — Engine Visualization Hooks

**Status:** Planned

- [ ] Audio/state tap layer (`src/audio/visualization/`)
- [ ] Direct engine parameter streaming to AsciiEngine
- [ ] Canvas render loop scaffold (`src/canvas/`)

## Milestone 14 — Application Shell Expansion

**Status:** Planned

- [ ] Layout system (`src/layouts/`)
- [ ] Core React components (`src/components/`)
- [ ] Bootstrap component integration with design tokens

## Milestone 15 — Full Plantasia Foundation

**Status:** Planned

- [ ] End-to-end playable instrument surface
- [ ] Preset identity tied to ASCII grammar
- [ ] Migration path from playground to production app structure

---

## Control Dock Alignment Pass

**Status:** Complete

- [x] MIDI controls aligned with existing control dock
- [x] MIDI controls use shared group styling
- [x] No sound behavior changed
- [x] No sound engine code modified

## Out of Scope for This Repository

- Sound engine implementation (belongs in `plantasia-sound-engine`)
- Figma or design tooling
- Production deployment configuration
