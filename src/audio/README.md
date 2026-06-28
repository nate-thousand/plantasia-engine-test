# Audio Layer

Application-side audio orchestration for Plantasia. This layer sits above `plantasia-sound-engine` and coordinates engine lifecycle, presets, MIDI, ambient generative playback, and visualization hooks.

## Scope

This folder owns **application integration** — not synthesis implementation. Core synth logic and preset schema live in `plantasia-sound-engine`. The **Adaptive Ambient Focus Engine** (M15) is implemented here for generative Play mode.

## Subsystems

| Subsystem | Path | Responsibility |
|-----------|------|----------------|
| Engine | `engine.ts`, `EngineAdapter.ts` | Initialize sound engine; bridge user gestures to audio unlock |
| Presets | `presets.ts` | Load, cache, and switch presets |
| Ambient | `ambient/` | Generative pentatonic focus engine (M15) |
| Live input | `liveVoice.ts` | Keyboard/MIDI performance layering |
| MIDI | `midi/` (via `src/input/`) | Route external MIDI into the engine |
| Visualization | `visualization/AudioTap.ts` | Real-time audio analysis for ASCII renderer |

## Architecture

```
User / Transport Play
       │
       ▼
EngineAdapter
       ├── ambient/          ← generative focus engine (Play)
       ├── liveVoice.ts      ← keyboard/MIDI performance
       └── plantasia-sound-engine
              │
              ▼
         Web Audio / Tone.js
```

## Play mode (M15)

Transport **Play** starts `AmbientFocusEngine` — an orchestration layer only. The active preset owns synthesis via `PresetTimbreSession`:

- **Plantasonic / Juno** — engine live voice graphs (`plantasonic-sound-engine`)
- **Standard** — profile-driven graph mirroring engine routing
- **Generative** — phrase memory, gesture vocabulary, preset-specific macro mappings
- **Visuals** — `ambientStateStore.soundWorld` drives preset-aligned ASCII energy

Performance (keyboard, MIDI, controls) layers on top via `LiveVoiceRouter`.

See [ambient/README.md](./ambient/README.md).

## Design principles

1. **Single engine instance** — one authoritative `PlantasiaEngine` per session.
2. **Lazy initialization** — audio starts on user gesture (Play, pointerdown, controls).
3. **Read-only engine boundary** — never fork engine internals from this repo.
4. **Observable state** — ambient generative state feeds visuals via `ambientStateStore`.
5. **No therapeutic claims** — calm focus-oriented design, not medical/wellness product language.

## Related documentation

- [ambient/README.md](./ambient/README.md) — voice architecture, scales, probability engine
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — project-wide architecture
- [plantasia-sound-engine](https://github.com/nate-thousand/plantasia-sound-engine) — engine API
