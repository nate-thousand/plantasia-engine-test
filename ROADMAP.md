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

## Milestone 8 — MIDI and Sequencing

**Status:** Planned

- [ ] Web MIDI input routing (`src/audio/midi/`)
- [ ] Transport and pattern playback (`src/audio/sequencing/`)
- [ ] Hook engine sequencer exports when available

## Milestone 9 — Visualization Hooks

**Status:** Planned

- [ ] Audio/state tap layer (`src/audio/visualization/`)
- [ ] Engine-driven organism updates (`Node.applyEngineUpdate`)
- [ ] Canvas render loop scaffold (`src/canvas/`)

## Milestone 10 — Application Shell Expansion

**Status:** Planned

- [ ] Layout system (`src/layouts/`)
- [ ] Core React components (`src/components/`)
- [ ] Bootstrap component integration with design tokens

## Milestone 11 — Full Plantasia Foundation

**Status:** Planned

- [ ] End-to-end playable instrument surface
- [ ] Preset identity tied to ASCII grammar
- [ ] Migration path from playground to production app structure

## Out of Scope for This Repository

- Sound engine implementation (belongs in `plantasia-sound-engine`)
- Figma or design tooling
- Production deployment configuration
