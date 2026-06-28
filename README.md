# Plantasia Engine Test

Playground application for experimenting with [plantasia-sound-engine](https://github.com/nate-thousand/plantasia-sound-engine). Fullscreen visual instrument with keyboard and MIDI input.

This repository is **not** the sound engine. Synthesis, presets, and Tone.js graph logic live in the separate `plantasia-sound-engine` package and are consumed here as a dependency.

## Goals

- Fullscreen Plantasia instrument with ASCII organism visualization
- Playable input from computer keyboard and Web MIDI devices
- Engine integration through `EngineAdapter` (React never calls the engine directly)
- Document architecture, brand grammar, and development workflow

**Current phase:** fully MIDI-controllable instrument — transport, presets, sliders, keyboard (A–K), Web MIDI notes/CCs/pads, and MIDI Learn.

## Technology

| Layer | Choice |
|-------|--------|
| Bundler | Vite |
| UI runtime | React |
| Language | TypeScript |
| Styling | Bootstrap 5.0.2 + SCSS |
| Modules | ES Modules (`"type": "module"`) |
| Audio | `plantasia-sound-engine` + Tone.js (live input) |

## Folder Structure

```
plantasia-engine-test/
├── src/
│   ├── app/                Application shell
│   ├── audio/              EngineAdapter, presets, controls
│   ├── components/         Control dock, overlays
│   ├── hooks/              useInstrument
│   ├── input/              KeyboardInput, MidiInput, MidiRouter, noteMap
│   ├── layouts/            InstrumentShell
│   ├── stores/             engineStore, controlStore, midiStore
│   ├── types/              Instrument types
│   └── visuals/organism/   Procedural ASCII organism
├── ROADMAP.md
├── TESTING.md
└── README.md
```

## Relationship to plantasia-sound-engine

```
plantasia-engine-test          plantasia-sound-engine
(application)                  (library)
─────────────────────          ─────────────────────
src/audio/EngineAdapter  ───►  PlantasiaEngine API
src/input/                     Presets, synth graph, Tone.js
UI / ASCII visuals             No React, no UI, no visuals
```

The application imports the engine via GitHub (see `package.json`). For local co-development, use `npm link ../plantasia-sound-engine` — see [TESTING.md](./TESTING.md).

## Development Setup

**Requirements:** Node.js 18+, npm

```bash
cd plantasia-engine-test
npm install
npm run dev
```

Open **`http://localhost:5270/`** — fullscreen instrument with control dock at the bottom.

## Build

```bash
npm run typecheck   # TypeScript validation
npm run build       # Production bundle to dist/
npm run preview     # Serve production build locally
```

## Playing the Instrument

1. Click **Start Audio** (required user gesture for Web Audio and MIDI)
2. **Computer keyboard:** A–K row maps to C4–C5 (see [TESTING.md](./TESTING.md))
3. **MIDI:** Click **Connect**, select your device (e.g. Akai MPK Mini)
   - Keys trigger notes with velocity → sound + ASCII visuals
   - Knobs send CC messages → sliders update (volume, tone, texture, bloom, growth, drift, mutation, energy)
   - Pads trigger transport/preset actions (default map for MPK Mini)
   - **Learn** mode: click Learn → select a control → move a knob to assign
4. Use preset selector and sliders as secondary controls (also MIDI-mappable)

### Default MIDI CC Map

| CC | Control |
|----|---------|
| 7 | Volume |
| 74 | Tone |
| 71 | Texture |
| 73 | Bloom |
| 72 | Growth |
| 1 | Drift |
| 2 | Mutation |
| 11 | Energy |

Akai MPK Mini devices use an additional CC 1–8 knob fallback when the device name contains "MPK". Learned mappings override defaults and persist in `localStorage` under `plantasia-midi-mappings`.

## Documentation

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer model and integration boundaries |
| [ROADMAP.md](./ROADMAP.md) | Implementation phases |
| [TESTING.md](./TESTING.md) | Verification procedures (keyboard, MIDI) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [docs/brand/ASCII_GRAMMAR.md](./docs/brand/ASCII_GRAMMAR.md) | ASCII visual language specification |

## License

Private — foundation phase.
