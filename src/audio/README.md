# Audio Layer

Application-side audio orchestration for Plantasia. This layer sits above `plantasia-sound-engine` and coordinates engine lifecycle, presets, MIDI, sequencing, and visualization hooks.

## Scope

This folder owns **application integration** — not synthesis implementation. All synth logic, Tone.js graph construction, and preset schema live in the separate `plantasia-sound-engine` package.

## Planned Subsystems

| Subsystem | Path | Responsibility |
|-----------|------|----------------|
| Engine | `engine/` | Initialize and dispose the sound engine; bridge user gestures to audio context unlock |
| Presets | `presets/` | Load, cache, and switch presets exposed by the engine |
| MIDI | `midi/` | Connect external MIDI devices and route events into the engine |
| Sequencing | `sequencing/` | Pattern playback, transport, and timing coordination |
| Visualization | `visualization/` | Emit normalized audio/state signals for ASCII and canvas renderers |

## Architecture

```
User / UI (future)
       │
       ▼
src/audio/          ← application orchestration
       │
       ▼
plantasia-sound-engine   ← synthesis, presets, botanical controls
       │
       ▼
Web Audio / Tone.js
```

## Design Principles

1. **Single engine instance** — one authoritative `PlantasiaEngine` per application session.
2. **Lazy initialization** — defer audio context start until explicit user interaction.
3. **Read-only engine boundary** — never fork or patch engine internals from this repo.
4. **Observable state** — subsystems expose events or store updates for visuals and UI.
5. **Progressive implementation** — each subdirectory can land independently behind the same folder contract.

## Status

Foundation only. No runtime code yet. Implement subsystems incrementally as features are scoped on the roadmap.

## Related Documentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — project-wide architecture
- [../plantasia-sound-engine README](https://github.com/nate-thousand/plantasia-sound-engine) — engine API and installation
