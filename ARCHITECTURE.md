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
| `src/systems/` | Cross-cutting coordinators (input, animation) |
| `src/tokens/` | Design tokens — SCSS and CSS variables |
| `src/styles/` | Global styles; Bootstrap SCSS entry |
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

- **Bootstrap 5.0.2** imported via SCSS (`src/styles/main.scss`)
- **Theme tokens** defined as CSS custom properties (`src/tokens/_css-variables.scss`)
- **Bootstrap overrides** reserved in `src/tokens/_bootstrap-variables.scss`
- **Runtime mapping** in `src/styles/_bootstrap-theme.scss`

No component-level Bootstrap customization in the foundation phase.

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

## Foundation Status

Current build provides folder contracts, configuration, and documentation only. Runtime features land per [ROADMAP.md](./ROADMAP.md).
