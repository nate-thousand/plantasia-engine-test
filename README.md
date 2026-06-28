# Plantasia Engine Test

**Version: v1.2** · see [`VERSION`](./VERSION)

Playground application for experimenting with [plantasia-sound-engine](https://github.com/nate-thousand/plantasia-sound-engine). Fullscreen visual instrument with keyboard and MIDI input.

This repository is **not** the sound engine. Synthesis, presets, and Tone.js graph logic live in the separate `plantasia-sound-engine` package and are consumed here as a dependency.

## Goals

- Fullscreen Plantasia instrument with ASCII organism visualization
- Playable input from computer keyboard and Web MIDI devices
- Engine integration through `EngineAdapter` (React never calls the engine directly)
- Document architecture, brand grammar, and development workflow

**Current phase:** production-quality instrument — preset sync, Mold macro, Plantasonic/Juno live voice, MIDI Learn, and ASCII visualization.

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
│   ├── transport/          Unified playback controller (13B)
│   ├── types/              Instrument types
│   └── visuals/organism/   Procedural ASCII organism
├── ROADMAP.md
├── PRESETS.md              Sound World system documentation
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

The application consumes `plantasia-sound-engine` as an npm dependency:

| Environment | `package.json` value |
|-------------|----------------------|
| Local co-dev | `"file:../plantasia-sound-engine"` (current) |
| CI / Vercel | `"github:nate-thousand/plantasia-sound-engine#v0.2.0"` after engine release |

After changing the engine, run `npm run build` in the engine repo, then `npm install` here. See [TESTING.md](./TESTING.md).

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

1. Press **▶ Play** on the transport bar (or **Space**) — unlocks Web Audio, loads the default preset, and plays
2. Press **■ Stop** (or **Space** again) to release notes and return to ambient idle
3. **Computer keyboard:** A–K row maps to C4–C5; Z/X shift octave (see [TESTING.md](./TESTING.md))
4. **MIDI:** Open **menu** → Connect MIDI, select your device (e.g. Akai MPK Mini)
   - Keys trigger notes with velocity → sound + ASCII visuals
   - Knobs send CC messages → sliders update (mold, tone, texture, bloom, growth, drift, mutation, energy)
   - Pads trigger the same transport actions as the UI (play, stop, hold, preset prev/next)
   - **Learn** mode: click Learn → select a control → move a knob to assign
5. Change presets from the transport bar selector; open **menu** for sound, MIDI, keyboard, and viz settings

### Transport shortcuts

| Input | Action |
|-------|--------|
| **Space** | Toggle play / stop (starts audio from idle) |
| **MIDI play pad** | Same as ▶ Play |
| **MIDI stop pad / CC 123** | Same as ■ Stop |

### Default MIDI CC Map

| CC | Control |
|----|---------|
| 7 | Mold |
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
