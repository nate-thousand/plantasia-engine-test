# Plantasia Engine Test

Playground application for experimenting with [plantasia-sound-engine](../plantasia-sound-engine). This project will eventually become the foundation for the full Plantasia application.

This repository is **not** the sound engine. Synthesis, presets, and Tone.js graph logic live in the separate `plantasia-sound-engine` package and are consumed here as a dependency.

## Goals

- Establish a scalable project foundation for the Plantasia application
- Integrate the local sound engine without modifying it
- Prepare folder contracts for audio, ASCII visuals, canvas, and UI layers
- Document architecture, brand grammar, and development workflow

**Current phase:** foundation only — no application features, UI, visuals, or synth logic yet.

## Technology

| Layer | Choice |
|-------|--------|
| Bundler | Vite |
| UI runtime | React |
| Language | TypeScript |
| Styling | Bootstrap 5.0.2 + SCSS |
| Modules | ES Modules (`"type": "module"`) |
| Audio | `plantasia-sound-engine` (local file dependency) |

## Folder Structure

```
plantasia-engine-test/
├── assets/                 Static media and ASCII reference assets
├── docs/
│   ├── brand/              Visual identity (ASCII grammar)
│   ├── architecture/       System design notes
│   ├── design/             Design token documentation
│   └── engineering/        Dev workflow notes
├── public/                 Vite public assets
├── src/
│   ├── app/                Application shell (future)
│   ├── audio/              Engine orchestration layer
│   │   ├── engine/
│   │   ├── presets/
│   │   ├── midi/
│   │   ├── sequencing/
│   │   └── visualization/
│   ├── ascii/              Procedural ASCII rendering
│   ├── visuals/            Visual subsystems
│   ├── canvas/             Canvas rendering
│   ├── components/         React components (future)
│   ├── layouts/            Layout primitives (future)
│   ├── hooks/              React hooks
│   ├── stores/             Application state
│   ├── systems/            Cross-cutting runtime systems
│   ├── tokens/             SCSS + CSS custom properties
│   ├── styles/             Global styles (Bootstrap entry)
│   └── utils/              Shared utilities
├── ARCHITECTURE.md
├── CHANGELOG.md
├── README.md
├── ROADMAP.md
└── TESTING.md
```

## Relationship to plantasia-sound-engine

```
plantasia-engine-test          plantasia-sound-engine
(application)                  (library)
─────────────────────          ─────────────────────
src/audio/          ────────►  PlantasiaEngine API
UI / ASCII / canvas            Presets, synth graph, Tone.js
Bootstrap theme                No React, no UI, no visuals
```

The application imports the engine via:

```json
"plantasia-sound-engine": "file:../plantasia-sound-engine"
```

Build the sound engine before installing or updating this project:

```bash
cd ../plantasia-sound-engine
npm install
npm run build
```

## Development Setup

**Requirements:** Node.js 18+, npm

```bash
# 1. Build the sound engine (if not already built)
cd ../plantasia-sound-engine && npm install && npm run build

# 2. Install and run this project
cd ../plantasia-engine-test
npm install
npm run dev
```

Open **`http://localhost:5270/`** (fixed port — Vite opens the browser automatically). You should see: `Plantasia Engine Test — foundation loaded`.

## Build

```bash
npm run typecheck   # TypeScript validation
npm run build       # Production bundle to dist/
npm run preview     # Serve production build locally
```

## Documentation

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer model and integration boundaries |
| [ROADMAP.md](./ROADMAP.md) | Planned implementation phases |
| [TESTING.md](./TESTING.md) | Verification procedures |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [docs/brand/ASCII_GRAMMAR.md](./docs/brand/ASCII_GRAMMAR.md) | ASCII visual language specification |

## License

Private — foundation phase.
