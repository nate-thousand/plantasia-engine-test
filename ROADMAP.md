# Roadmap

Implementation plan for `plantasia-engine-test`. Each milestone builds on the foundation established in v0.1.0.

## Milestone 1 — App Shell and Visual Foundation

**Status:** Complete

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

## Milestone 3 — Engine Integration

**Status:** Planned

- [ ] Engine initialization module (`src/audio/engine/`)
- [ ] User-gesture audio context unlock
- [ ] Preset loading and switching (`src/audio/presets/`)
- [ ] Basic application store for engine state

## Milestone 4 — MIDI and Sequencing

**Status:** Planned

- [ ] Web MIDI input routing (`src/audio/midi/`)
- [ ] Transport and pattern playback (`src/audio/sequencing/`)
- [ ] Hook engine sequencer exports when available

## Milestone 5 — Visualization Hooks

**Status:** Planned

- [ ] Audio/state tap layer (`src/audio/visualization/`)
- [ ] ASCII organism prototype (`src/ascii/`)
- [ ] Canvas render loop scaffold (`src/canvas/`)

## Milestone 6 — Application Shell Expansion

**Status:** Planned

- [ ] Layout system (`src/layouts/`)
- [ ] Core React components (`src/components/`)
- [ ] Bootstrap component integration with design tokens

## Milestone 7 — Full Plantasia Foundation

**Status:** Planned

- [ ] End-to-end playable instrument surface
- [ ] Preset identity tied to ASCII grammar
- [ ] Migration path from playground to production app structure

## Out of Scope for This Repository

- Sound engine implementation (belongs in `plantasia-sound-engine`)
- Figma or design tooling
- Production deployment configuration
