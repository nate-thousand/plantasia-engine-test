# Roadmap

**Current release: v1.2** (`VERSION` · `package.json` 1.2.0)

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
- [x] Sound controls — mold, tone, texture, bloom sliders
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

Placeholder mappings (mold, tone, texture, growth, drift, hold, MIDI) are wired through the engine adapter.

---

## Milestone 7 — Sound Engine Control Integration

**Status:** Complete

### Goals

Wire transport and preset controls to the engine. Mold drives the degradation macro. Other sliders update synthesis and organism visuals.

### Tasks

- [x] Start Audio initializes engine and unlocks audio context
- [x] Play Note triggers `triggerChord()` through engine wrapper
- [x] Stop Note releases voices via engine wrapper
- [x] Preset selector loads bundled engine presets (`playPreset`)
- [x] Mold slider maps to engine macro via `applyBotanicalControls` (`controls.mold`)
- [x] Tone, Texture, Bloom, Growth, Drift, Mutation, Energy update synthesis and organism visuals

### Architecture

| Control | Audio | Visual |
|---------|-------|--------|
| Start Audio | `startAudioEngine()` | dormant → active |
| Play Note | `playEngineNote()` | playing |
| Stop Note | `stopEngineNote()` | resting |
| Preset | `loadPresetAtIndex()` | preset name overlay |
| Mold | `applyBotanicalControls({ mold })` | decay / corruption overlay |
| Tone | `applyBotanicalControls` | harmonic halo |
| Texture | `applyBotanicalControls` | density band |
| Bloom | `applyBotanicalControls` | flower cross |
| Growth | `applyBotanicalControls` | upward reach |
| Drift | `applyBotanicalControls` | asymmetric particles |
| Mutation | `applyBotanicalControls` | ╳ disruption |
| Energy | `applyBotanicalControls` | particle row |

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
- [x] Slider → visual mapping (mold, tone, texture, bloom, growth, drift, mutation, energy)
- [x] Preset visual identity fallbacks from preset id / category
- [x] Pipeline: Input → EngineStore → OrganismState → Visual Mapper → Renderer
- [x] Minimal overlay feedback — note label, active note count, visual state name

### Architecture

| Module | Role |
|--------|------|
| `OrganismState.ts` | Composed visual state + harmony / life-state classification |
| `NoteVisualMapper.ts` | Note → pitch form, octave offset, velocity density |
| `ToneVisualMapper.ts` | Mold, tone, texture, bloom → glyphs |
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

## Milestone 16 — Mold Macro & Engine Preset Registry

**Status:** Complete

### Completed

- [x] Added flagship **Plantasonic** preset (Signature category)
- [x] Dynamic preset registry from `plantasia-sound-engine`
- [x] Preset metadata architecture (category, species, asciiState, visual metadata)
- [x] Public preset API via engine registry
- [x] Plantasonic available through engine registry
- [x] **Volume replaced by Mold macro** in creative UI
- [x] Mold added as a first-class engine parameter (MIDI CC 7, Learn, automation, preset defaults)

### Planned — future sound-world presets

Bloom, Roots, Canopy, Fern, Moss, Rainforest, Desert, Winter, Night Bloom, Aurora, Mycelium

### Planned — future engine work

Expanded procedural sound worlds, visual metadata, ASCII theme metadata, motion metadata, unified audio/visual preset system, procedural preset variation, additional creative macro controls

### Milestone: Signature Sound Worlds — completed

- [x] Engine `visual`, `midi`, `tags`, `controls` schema on `PlantasiaPreset`
- [x] All 11 presets populated with Sound World metadata
- [x] Metadata-first theme resolution (`visual.asciiTheme`)
- [x] Distinct ASCII templates: moss, canopy, rainforest, desert, winter, night-bloom
- [x] Per-world macro defaults via `getPresetControls()`
- [x] Per-preset MIDI defaults on load
- [x] Theme-specific audio-reactive behavior
- [x] `PRESETS.md` documentation

### Milestone 12B — Unified Visual Energy System — complete

Single normalized `visualEnergy` (0–1) drives all ASCII reactivity from every input source, with or without audio.

#### Architecture

```
Input hooks → visualEnergyStore (per-source impulses)
     ↓
useAsciiVisualization tick → tickVisualEnergy() → behaviorFromVisualEnergy()
     ↓
VizInputSnapshot.energy + energyBehavior → AsciiEngine → IdleScenePainters / overlays / particles
```

#### Source channels (each 0–1, smoothed independently)

| Source | Trigger | Sustain |
|--------|---------|---------|
| `audioEnergy` | Audio tap amplitude/peak | While music plays |
| `midiEnergy` | MIDI note on + velocity | While MIDI notes held |
| `keyboardEnergy` | Keyboard note on + velocity | While keyboard notes held |
| `pointerEnergy` | Mouse move speed | Decays when still |
| `touchEnergy` | Touch drag (mobile) | Decays on lift |
| `controlEnergy` | Slider/knob change | Slider position + delta |
| `presetEnergy` | Preset change | ~1.4s transition decay |
| `uiEnergy` | Play/stop/button presses | Fast decay |

**Combined:** weighted sum → `visualEnergy` (cap 1.0). Weights: audio 28%, midi/keyboard 16% each, pointer/touch 10% each, control 8%, preset 7%, ui 5%.

**Smoothing:** per-source fast rise / slow fall; impulse bursts decay exponentially. Respects `reduceMotion`.

#### Behavior mapping (`behaviorFromVisualEnergy`)

| Knob | Low energy | High energy |
|------|------------|-------------|
| density | 0.32 sparse | 1.35 bloom |
| speed | slow breathe | 1.85× motion |
| spread | tight | wide trails |
| brightness | dim | bright |
| jitter | calm | corruption |
| distortion | clean | mold-heavy |
| growthRate | minimal | note bloom |
| rareEventRate | rare | pulses/flares |

#### Preset transitions

`paintPresetTransitionOverlay()` — theme-specific: spore burst (default), orbit rings (plantasonic), glitch tear (mutation).

#### Adding a new energy source

1. Add key to `EnergySourceKey` in `VisualEnergy.ts`
2. Add weight in `COMBINE_WEIGHTS` and decay/rise rates
3. Add sustain logic in `sustainTargets()`
4. Call `pulseVisualEnergy('yourSource', amount)` from the input hook
5. Extend validation in `scripts/validate-visual-energy.mjs`

#### Files

- `src/visualization/VisualEnergy.ts` — model + behavior mappers
- `src/stores/visualEnergyStore.ts` — central state + `pulseVisualEnergy()` / `tickVisualEnergy()`
- `src/stores/pointerStore.ts` — pointer vs touch split
- `src/stores/engineStore.ts` — note source tracking (`keyboard` | `midi`)
- `scripts/validate-visual-energy.mjs` — 10 pure-function checks

### Milestone: Sparse Idle ASCII + Visual Energy — completed

- [x] `VisualEnergy.ts` — normalized 0–1 reactive intensity from audio, MIDI, keyboard, pointer, sliders
- [x] `IdleScenePainters.ts` — sparse thematic idle scenes per `asciiTheme` (negative space, slow motion)
- [x] `pointerStore.ts` + canvas pointer/touch wiring — grid coords + decaying activity
- [x] Dense legacy scenes gated behind `FULL_SCENE_ENERGY_THRESHOLD` (0.22); idle layer always on
- [x] `softReset()` on audio stop — idle timing continues; sparse ambient particles without audio
- [x] Slider overlays + particle density driven by `densityFromVisualEnergy()`
- [x] `scripts/validate-visual-energy.mjs` — pure-function validation

#### Follow-up (optional)

- [ ] Per-preset idle painter QA pass on mobile viewports
- [ ] Wire `visualEnergy` to accessibility density slider as a multiplier
- [ ] FigJam-style preset mood boards synced to idle theme keys

### Milestone 12D — Musical Color Theory (Scriabin) Integration — complete

Single authoritative Scriabin Prometheus color system drives all note, key, and Camelot color behavior. Presets keep their identity; musical color tints highlights, glow, particles, and transitions.

#### Scriabin note → HEX palette

| Note | Scriabin | HEX |
|------|----------|-----|
| C | Deep Red | `#B84A48` |
| G | Orange Red | `#C87848` |
| D | Golden Yellow | `#C4A05A` |
| A | Green | `#68A870` |
| E | Sky Blue | `#58A4C4` |
| B | Deep Blue | `#506898` |
| F# | Bright Blue | `#688EC8` |
| C# | Violet | `#8068A8` |
| G# | Purple | `#9868A8` |
| D# | Steel Gray | `#8A9098` |
| A# | Rose | `#B87A8A` |
| F | Crimson Red | `#B04858` |

Minor keys use the same hue as their major tonic with reduced saturation (72%) and lightness (88%).

#### Camelot mapping (examples)

| Camelot | Key | Color |
|---------|-----|-------|
| 8B | C Major | Deep Red |
| 5A | C Minor | Deep Red (softened) |
| 9B | G Major | Orange Red |
| 6A | G Minor | Orange Red (softened) |
| 8A | A Minor | Green (softened) |
| 12B | E Major | Sky Blue |

Full 24-key wheel in `CAMELOT_COLOR_MAP` (`src/visuals/colorMusicTheory.ts`).

#### Key detection logic

1. **Single active note** → temporary tonal center on that pitch class (major color).
2. **Recognizable triad** → infer root + major/minor mode (velocity-weighted scoring).
3. **Multiple notes, no triad** → bass note as weak center.
4. **Silence** → retain previous color; `musicalWeight` decays over ~4.2s toward preset ambient (`colorHint`).

Sources: MIDI notes, computer keyboard notes (`engineStore.activeNotes`), chord inference. Preset ambient base from `PresetVisualThemes.colorHint`.

#### Transition behavior

- Display color interpolates over ~2.8s (`interpolateMusicalColor`) — no snapping.
- Modulation bloom (~0.9s decay) on key change.
- CSS `--musical-blend` / `--musical-glow-opacity` crossfade on the canvas container.
- Priority ≥ 3 ASCII glyphs receive per-cell Scriabin tint via `AsciiRenderer.toHtml()`.

#### How presets consume musical colors

Preset `colorPalette` / `colorHint` remain the ambient identity. Musical color **tints** without replacing:

- **ASCII** — accent glyphs (priority ≥ 5), particles (≥ 8), MIDI flares, interaction overlays
- **Ambient glow** — container text-shadow driven by `--musical-color-r/g/b`
- **Particles / growth / pulses / rare events** — high-priority paint layers inherit tint
- **Preset transitions** — bloom during modulation stacks on transition overlay

#### Debug panel

Hidden by default. Enable with `?debug=1` or `localStorage.setItem('plantasia-debug', '1')`.

Shows: current note, chord, key, Camelot, HEX, RGB, HSL, blend weight.

#### Files

- `src/visuals/colorMusicTheory.ts` — `NOTE_COLOR_MAP`, `CAMELOT_COLOR_MAP`, `getColorForNote()`, `getColorForCamelotKey()`, `interpolateMusicalColor()`, tonal detection
- `src/stores/musicalColorStore.ts` — per-frame tick + smooth state
- `src/visualization/AsciiRenderer.ts` — `setMusicalFrame()`, `toHtml()` glyph tinting
- `src/components/debug/MusicalColorDebugPanel.tsx` — debug overlay
- `scripts/validate-musical-color.mjs` — palette + Camelot + detection checks

### Milestone — Sparse Home Idle Screen — complete

Separate render modes so page load is almost empty until the user plays or interacts.

#### Modes

| Mode | When | Density | Motion |
|------|------|---------|--------|
| `idleHome` | Page load, no interaction | 0.032 (~90% ↓ vs sparse idle) | Slow breathe, 3–7 clusters |
| `activePlay` | Audio, MIDI, keyboard, pointer, touch, slider delta | 0.32–1.35 reactive | Full visualizer |

- **idleHome**: ≤5% screen coverage, no PLANTASIA figlet, no slider overlays, no full-scene wallpaper
- **activePlay**: existing sparse + dense scene blend, title, slider overlays, particles
- **Decay**: `playModeEnergy` falls to idle in ~5.5s after interaction stops (within 3–8s requirement)

#### Files

- `src/visualization/VisualMode.ts` — mode constants, `tickPlayModeEnergy()`, `behaviorForRenderMode()`
- `src/visualization/IdleScenePainters.ts` — `paintIdleHomeScene()` (3–7 micro-clusters)
- `src/visualization/BotanicalScenes.ts` — mode-gated title, overlays, full scene

### Milestone — Visual Polish — complete

Unified visual language across presets, idle, transitions, and UI.

#### Preset identity
- `resolveThemeTemplateKeyFromTheme()` — correct archetype routing for idle/overlays (fixes broken fallback)
- Per-theme idle micro-clusters: canopy arc, rainforest drip, desert spike, winter drift, fern frond, vine curl, night bloom
- Blended `colorHint` + palette during preset crossfade (`ThemeTransition` + Scriabin lerp)
- UI accent (`--plantasia-color-primary`) tracks blended preset ambient on `#plantasia-app`

#### Idle & composition
- `idleHome`: 3–7 curated clusters, no logo, no wallpaper
- Interaction overlays scale with `visualEnergy` — sparse when calm, dense when playing
- Preset transitions: subtle 3-glyph crossfade in idle; themed burst in activePlay

#### Timing & tokens
- Shared motion tokens: `--plantasia-duration-*`, `--plantasia-ease-in-out`
- Scene crossfade: 1.4s (matches preset transition)
- Canvas + shell color transitions use same easing curve
- Control dock hovers use `--plantasia-color-primary-muted` (preset-aware)

---

### Milestone 13B — Unified Playback Controls — complete

Single transport controller for all playback — no duplicate Play buttons or scattered state.

#### Transport architecture

```
UnifiedTransport (UI)
Keyboard (Space) ──┐
MIDI pads / CC ────┼──→ transportActions.ts ──→ EngineAdapter + engineStore + transportStore
Programmatic ──────┘
```

| Module | Role |
|--------|------|
| `src/transport/transportStore.ts` | Single playback state: `idle` · `loading` · `ready` · `playing` |
| `src/transport/transportActions.ts` | `startTransportAudio`, `transportPlay`, `transportStop`, `toggleTransportPlayStop`, notes, presets |
| `src/transport/initTransport.ts` | One-time MIDI handler registration + Spacebar shortcut |
| `src/transport/useTransport.ts` | React hook for UI + viz visual state |
| `src/components/controls/UnifiedTransport.tsx` | Always-visible bar: Play · Stop · Preset · Menu |

#### Playback lifecycle

1. **Idle** — audio context locked; Play starts engine + plays chord burst
2. **Loading** — Web Audio unlock + preset bootstrap
3. **Ready** — audio running, ambient idle visuals
4. **Playing** — chord burst and/or held notes; `visualEnergy` reactive

**Stop** — releases voices, clears transient notes, returns to `ready` (preset preserved).

#### Shared state

- `transportStore.transportState` is authoritative; syncs `engineStore.audioReady` / `isInitializing` for ASCII viz
- `holdEnabled` lives in transport store; keyboard + MIDI note-off respect it
- Removed `manualVisual` React state — derived from transport + `activeNoteCount`

#### Keyboard shortcuts

| Key | Action |
|-----|--------|
| **Space** | Toggle play/stop (starts audio from idle) |
| **A–K** | Live notes (after audio started) |
| **Z / X** | Octave down / up |

#### MIDI transport routing

All MIDI transport targets (`play`, `stop`, `hold`, preset prev/next/random, program change) register once in `initTransport()` and call `transportActions` — same paths as UI buttons.

Musical MIDI notes route through `transportNoteOn` / `transportNoteOff` (hold-aware).

#### UI consolidation

- Removed legacy `TransportControls` (power bar inside drawer)
- Preset `<select>` moved to unified transport; drawer shows preset details + random only
- Hold moved to Keyboard panel in settings drawer
- Mobile: 44px min touch targets on floating transport bar

---

### Milestone 13C — Expressive Performance Animation System — complete

Transform the ASCII visualizer from subtle reactivity into a performance instrument. **Idle unchanged; expression only while interacting.**

#### Core principle

| Mode | Character |
|------|-----------|
| **Ambient** (`idleHome`) | Sparse, slow, organic — meditation |
| **Performance** (`activePlay` + interaction) | Scale, camera, clusters, peaks — explosion |

#### Architecture

```
tickVisualEnergy → performanceEnergy (activePlay only)
        ↓
tickPerformanceAnimation (PerformanceAnimation.ts)
  ├→ ADSR envelope (attack/decay/sustain/release from audio + notes)
  ├→ Camera: zoom, push, orbit, tilt, drift (CSS translate3d / perspective)
  ├→ Layers: background (slow) · middle (musical) · foreground (reactive)
  ├→ Clusters: per-cluster translate / scale / rotate / breathe
  └→ Peak events → AsciiEngine particle bursts
        ↓
amplifyBehaviorForPerformance → energyBehavior (ASCII density, jitter, spread)
        ↓
AsciiCanvasView camera + composition transforms (GPU will-change)
```

| Module | Role |
|--------|------|
| `PerformanceAnimation.ts` | Performance state tick, CSS transform builder, behavior amplification |
| `PresetChoreography.ts` | Preset families: plant, mold, space, tape, water |
| `IdleScenePainters.ts` | Cluster translation offsets during performance |
| `AsciiEngine.ts` | Peak-event particle choreography (bloom, constellation, corruption, ripple, roll) |
| `_app-shell.scss` | Performance glow, shimmer, GPU transform layers |

#### Audio → motion mapping

| Band | Visual |
|------|--------|
| **Bass** | Scale pulse, camera push, expansion |
| **Mid** | Rotation, orbit, drift |
| **Treble** | Shimmer, flicker, foreground motion |
| **Velocity** | Motion amplitude multiplier |
| **Sustain** | Envelope hold |
| **Release** | Smooth decay to ambient (~0.55/s) |

#### Preset choreography families

| Family | Presets | Peak style |
|--------|---------|------------|
| **Plant** | seed, moss, roots, bloom, fern, canopy, vine, juno, desert, rainforest, night-bloom | bloom |
| **Water** | coral | ripple |
| **Mold** | mycelium, mutation | corruption |
| **Space** | crystal, winter | constellation |
| **Tape** | plantasonic | roll |

#### Recovery

When interaction stops, `performanceEnergy` decays exponentially; camera recenters, scale returns, clusters relax — back to sparse ambient within ~4–6s. `idleHome` forces zero performance energy (no idle animation increase).

---

### Milestone 13D — Unified Ambient Audio + Visual Transport — complete

Play awakens Plantasonic — sound and visuals evolve immediately without further input. Stop returns to sparse Home.

#### Three experiential states

| State | Trigger | Audio | Visuals |
|-------|---------|-------|---------|
| **Home** | Stop / first load | Silent | `PLANTASONIC` title, one shape concept, ≤5% coverage |
| **Ambient** | Play | Sustained generative soundscape (`AmbientSoundscape.ts`) | Shape composition evolves — slow breathe, per-glyph motion |
| **Performance** | MIDI, keyboard, touch, sliders | Layered on ambient | Intensifies existing shape (13F); dramatic transforms (13C); settles to Ambient in ~7s |

#### Transport flow

```
Play → ambientActive=true → startAmbientPlayback(preset)
     → playModeEnergy floor (0.44) → activePlay visuals
     → performance choreography baseline (0.24)

Stop → ambientActive=false → stopAmbientPlayback(fade 4.5s)
     → playModeEnergy decays to Home (~8s)
     → transportState: ready (audio context retained)
```

| Module | Role |
|--------|------|
| `AmbientSoundscape.ts` | Preset-routed sustained drones (standard / Plantasonic / Juno) + pink noise bed |
| `transportActions.ts` | Play/Stop drives audio + `ambientActive` flag (single source of truth) |
| `VisualMode.ts` | `AMBIENT_PLAY` floor constants, `resolveExperientialMode()` |
| `VisualEnergy.ts` | Ambient audio sustain channel, lower full-scene threshold (0.12) |
| `PerformanceAnimation.ts` | Ambient choreography baseline while Play active |

#### Preset load

`loadPresetAtIndex({ silent: true })` — no preview chord on bootstrap or preset change. Ambient layer restarts when preset changes during an active session.

---

### Milestone 13F — Simplified Per-Glyph ASCII System — complete

Fewer glyphs. Stronger shapes. Better motion. One visual concept per preset — no wallpaper.

#### Core principle

Each preset renders **one recognizable shape** (sprout, orbit, ripple, corruption patch, frame edge, etc.) using **3–8 symbols** from a limited palette. Individual glyphs animate inside the shape; the overall form stays readable.

#### Density limits (hard caps)

| Mode | Clusters | Max screen coverage |
|------|----------|---------------------|
| **Home** | 3–7 | 5% |
| **Ambient** | 5–12 | 12% |
| **Performance** | 12–24 | 25% |

Full-screen wallpaper painters are **disabled** (`shouldRenderFullScene` always false). Legacy dense `BotanicalScenes` painters removed.

#### Shape concepts per preset family

| Family | Shape examples | Symbol palette |
|--------|----------------|----------------|
| **Plant** | vertical sprout, branch | `. ' \| / \ Y ,` |
| **Mold** | corruption patch | `# % ? _ . x` |
| **Space** | constellation | `. ° * o + ∘` |
| **Tape** | frame edge | `_ - = ~ : \|` |
| **Water** | wave line | `~ . ° - o '` |
| **Signal** | pulse line | `\| · ▪ : - .` |

Theme keys map to a single shape kind (e.g. `coral` → wave line, `plantasonic` → frame edge, `crystal` → constellation).

#### Animation hierarchy (three levels only)

1. **Shape** — slow overall breathing (`sin(time * 0.22)`)
2. **Cluster** — medium drift from `visualEnergy` + performance cluster offsets (13C)
3. **Glyph** — fast musical feedback: pulse, jitter mutate, pointer nudge

Performance amplification (13C) boosts **motion and glyph expressiveness**, not density fill.

#### Interaction behavior

Input intensifies the existing shape — never replaces it with chaos:

- Plant: sprout grows branches, glyphs bloom outward
- Mold: patch expands, letters mutate via jitter
- Space: constellation drifts, accent stars pulse
- Tape: frame edge warps via cluster offset
- Water: ripple wave extends, glyphs widen

`clampShapeVisualEnergy()` caps energy per mode (home 0.12 · ambient 0.55 · performance 0.88).

#### Modules

| Module | Role |
|--------|------|
| `ShapeComposition.ts` | Shape generators, density limits, symbol palettes, theme→shape routing |
| `GlyphAnimation.ts` | Per-glyph pulse/drift/mutate inside shape bounds |
| `ShapeScenePainters.ts` | Primary scene painter — replaces idle + full-scene wallpaper |
| `BotanicalScenes.ts` | Thin wrapper → shape scene + slider overlays |
| `VisualEnergy.ts` | Lower density curve (0.08–0.38), wallpaper disabled |
| `PerformanceAnimation.ts` | No density boost on performance — motion-only amplification |

---

## Milestone 15 — Adaptive Ambient Focus Engine — complete

Redesign Play mode into an evolving ambient generative instrument with **preset-owned sonic identity**. Play mode orchestrates timing only; synthesis, routing, effects, and macro behavior come from the active preset.

### Preset identity refactor

- Play mode never instantiates generic Tone.js synths — requests layers from `PresetTimbreSession`
- Each preset resolves a full `TimbreProfile` (oscillators, filters, envelopes, modulation, effects, motion, density, texture)
- Plantasonic and Juno route through `plantasia-sound-engine` live voice graphs
- Standard presets use profile-driven graph mirroring engine routing
- Preset-specific macro mappings for bloom, mold, texture, drift (`presetMacroMappings.ts`)
- Gesture vocabulary + phrase memory for hours-long non-repetitive playback

### Architecture

```
Play Mode (AmbientFocusEngine)
    ↓
Current Preset → PresetTimbreSession
    ├── createDroneLayer()
    ├── createPulseLayer()
    ├── createMelodyLayer()
    ├── createTextureLayer()
    ├── createGestureLayer()
    └── applyControls() + FX chain
```

### Musical system

| Scale | Semitones |
|-------|-----------|
| Major pentatonic | 0, 2, 4, 7, 9 |
| Minor pentatonic | 0, 3, 5, 7, 10 |
| Japanese pentatonic | 0, 1, 5, 7, 10 |
| Suspended pentatonic | 0, 2, 5, 7, 10 |
| Preset-specific | From `preset.scale[]` when present |

### Voice architecture

Drone · Pad · Bell · Pluck · Sub · Air — each with independent slow clocks and probability timing.

### Modules

| Module | Role |
|--------|------|
| `AmbientFocusEngine.ts` | Orchestration scheduler — timing, phrase memory, gestures |
| `presetSoundWorld.ts` | Layer interface — preset owns sound |
| `timbreProfile.ts` | Timbre definition per preset |
| `presetMacroMappings.ts` | Bloom/mold/texture/drift per routing |
| `gestureVocabulary.ts` | Preset-specific timing and surprise events |
| `phraseMemory.ts` | Motif memory — avoids repetition |
| `timbreSession/` | Plantasonic / Juno / standard backends |
| `harmonicProfile.ts` | Root, scale, chord palettes, preset weights |
| `probabilityEngine.ts` | Stepwise/leap/pause picking |
| `ambientStateStore.ts` | Generative state → visuals (incl. `soundWorld`) |
| `AmbientSoundscape.ts` | Transport facade |

### Definition of done

- [x] Plantasonic and Juno sound unmistakably different (engine-routed graphs)
- [x] Preset identity from synthesis/routing/modulation — not scale alone
- [x] Play mode never creates synths directly
- [x] Preset-specific macro behaviors (bloom, mold)
- [x] Phrase memory + gesture vocabulary for long sessions
- [x] ASCII visuals blend preset `soundWorld` from generative state
- [x] New presets addable via preset definition without modifying Play mode
- [x] Documentation in ROADMAP, README, `src/audio/ambient/README.md`, ARCHITECTURE

---

## Out of Scope for This Repository

- Sound engine implementation (belongs in `plantasia-sound-engine`)
- Figma or design tooling
- Production deployment configuration
