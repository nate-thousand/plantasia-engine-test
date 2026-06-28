# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Sound Worlds milestone

- **Sound World schema** in engine: `visual`, `midi`, `tags`, expanded `controls` on every preset JSON.
- **`getPresetControls()`** engine API — intentional macro defaults per world.
- **9 Sound Worlds** with distinct metadata: Moss, Roots, Bloom, Canopy, Rainforest, Desert, Winter, Night Bloom (+ Plantasonic signature, Mycelium, Mutation).
- **Metadata-first ASCII themes** — `visual.asciiTheme` drives template + scene selection.
- **ThemeReactiveBehavior** — per-world audio-reactive plant growth (bloom on treble, roots on bass, etc.).
- **Per-preset MIDI defaults** — mod wheel, expression, program change slot on preset load.
- **PRESETS.md** — Sound World system documentation and extension guide.

### Added — System audit pass — preset switching now synchronizes sound, all UI sliders, engine state, and ASCII themes together.
- **Plantasonic live voice** — keyboard/MIDI notes route through the Plantasonic flagship graph (matching chord preview).
- **Preset-derived controls** — tone, texture, bloom, growth, drift, mutation, energy, and mold load from each preset's synth block on switch.
- **Keyboard octave** — Z/X shift playable range ±2 octaves; Keyboard panel in control dock.
- **MIDI detected CC display** — last six CC messages shown in MIDI panel during performance.
- Engine exports: `presetManifest`, `getPresetById`, `getPresetsByCategory`, Plantasonic live-voice API.

### Fixed

- Preset change stops held notes and clears `engineStore.activeNotes` (no stale state).
- Mold slider syncs to engine immediately on preset load (was UI-only).
- UI sound slider changes use full `applyControlSurface` path (same as MIDI).
- `linearRampTo` crash on LFO min/max during Mold application (engine).
- Plantasonic preview vs live keyboard mismatch.
- Legacy `volume` MIDI learn mappings migrate to `mold` on storage load.
- Duplicate ASCII tick on window resize (performance).
- Removed unused organism render pipeline from hot path (CPU savings).

### Changed

- **Mold** slider replaces Volume on the creative control surface — organic decay macro wired to engine `controls.mold`.
- Vine and Juno Flowers ASCII themes differentiated (drape vs meadow grid).
- Status strip shows preset category and description.
- Engine manifest `defaultPresetId` consumed from bundled `default.json`.
- Removed user-facing volume control; loudness is OS / browser controlled.
- Energy modulation slider drives synthesis expressiveness instead of output gain.

## [0.1.0] — 2026-06-27

### Added

- Initial project foundation with Vite, React, TypeScript, and ES Modules
- Bootstrap 5.0.2 installed and configured via SCSS
- CSS custom property theme structure in `src/tokens/`
- Complete source folder architecture (`app`, `audio`, `ascii`, `visuals`, `canvas`, `components`, `layouts`, `hooks`, `stores`, `systems`, `tokens`, `styles`, `utils`)
- Audio layer placeholder documentation (`engine`, `presets`, `midi`, `sequencing`, `visualization`)
- Local file dependency on `plantasia-sound-engine`
- Project documentation: `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TESTING.md`
- Brand documentation: `docs/brand/ASCII_GRAMMAR.md`
- Docs scaffold: `docs/architecture/`, `docs/design/`, `docs/engineering/`
- `assets/` directory for future static media

### Notes

- No application features, UI components, visuals, or synth logic included
- Sound engine remains a separate repository and is not modified by this project
