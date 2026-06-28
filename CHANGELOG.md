# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.2.0] — v1.2 — 2026-06-28

Shape-based ASCII, ambient transport, performance animation, and audio stability.

### Added

- **Milestone 13C** — performance animation (ADSR, camera/layer/cluster motion, preset choreography)
- **Milestone 13D** — ambient soundscape on Play; Home / Ambient / Performance experiential states
- **Milestone 13F** — one shape per preset, per-glyph animation, hard density caps (no wallpaper)
- `ShapeComposition.ts`, `GlyphAnimation.ts`, `ShapeScenePainters.ts`, `VisualMode.ts`
- `AmbientSoundscape.ts` — preset-routed sustained ambient layer
- `patches/plantasia-sound-engine+0.2.0.patch` — Tone.js LFO/mold compatibility fixes
- `vercel.json` — Vite static deploy config

### Changed

- Unified transport drives audio + `ambientActive` + visuals (Play awakens sound immediately)
- Performance boost affects motion/glyphs only — not density fill
- `postinstall` uses `npx patch-package` for reliable patch application
- Legacy full-screen ASCII wallpaper painters removed

### Fixed

- `Cannot read properties of undefined (reading 'frequency')` — stale mold `wowLfo`/`flutterLfo` refs
- Corrupted patch file breaking `npm install`
- Live voice filter control aligned with LFO min/max pattern (no conflicting scalar ramps)

## [1.1.0] — v1.1 — 2026-06-27

Save-point release. Visual instrument polish + unified transport.

### Added

- **Scriabin musical color system** (12D) — note/key/Camelot palette, smooth color transitions, debug panel
- **Sparse idle home** — almost-empty load screen; `idleHome` vs `activePlay` render modes
- **Visual polish** — distinct preset idle/full scenes, per-theme transitions, unified design tokens
- **Unified playback transport** (13B) — `src/transport/` single controller; `UnifiedTransport` UI
- **Spacebar** play/stop shortcut
- Root **`VERSION`** save file

### Changed

- Full color saturation on ASCII canvas and UI accents
- Preset selector moved to transport bar; settings in menu drawer
- Removed legacy `TransportControls` / duplicate play state (`manualVisual`)

### Fixed

- Blank screen (`PITCH_CLASSES` init order in color theory)
- Idle theme routing (`resolveThemeTemplateKeyFromTheme`)
- MIDI note-off respects transport hold flag

## [0.1.0] — 2026-06-27

### Added

- Initial project foundation with Vite, React, TypeScript, and ES Modules
- Bootstrap 5.0.2 installed and configured via SCSS
- CSS custom property theme structure in `src/tokens/`
- Complete source folder architecture
- Local file dependency on `plantasia-sound-engine`
- Project documentation: `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TESTING.md`
- **Sound World schema** — `visual`, `midi`, `tags`, expanded `controls` on every preset JSON
- **9 Sound Worlds** with distinct metadata and metadata-first ASCII themes
- **ThemeReactiveBehavior** — per-world audio-reactive plant growth
- **Plantasonic live voice** — keyboard/MIDI through flagship graph
- **MIDI Learn** — mapping save/restore via `MidiStorage`
- **PRESETS.md** — Sound World system documentation

### Fixed

- Preset change stops held notes and clears stale `engineStore` state
- Mold slider syncs to engine on preset load
- Plantasonic preview vs live keyboard mismatch
- Duplicate ASCII tick on window resize

### Changed

- **Mold** slider replaces Volume on the creative control surface
- Energy modulation drives synthesis expressiveness instead of output gain

### Notes

- Sound engine remains a separate repository and is not modified by this project
