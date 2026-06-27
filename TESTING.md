# Testing Guide

Verification procedures for `plantasia-engine-test` during foundation and feature development.

## Requirements

- Node.js 18+
- npm
- Modern browser (Chrome, Edge, Firefox, Safari)
- Built `plantasia-sound-engine` at `../plantasia-sound-engine`

## Installation

```bash
# Ensure sound engine is built
cd ../plantasia-sound-engine
npm install
npm run build

# Install playground
cd ../plantasia-engine-test
npm install
```

Expected: install completes without errors; `node_modules/plantasia-sound-engine` links to the local package.

## Type Check

```bash
npm run typecheck
```

Expected: no TypeScript errors.

## Development Server

```bash
npm run dev
```

Expected:

- Vite starts on **`http://localhost:5270/`** (fixed port; fails if already in use)
- Browser opens automatically
- Page shows: `Plantasia Engine Test — foundation loaded`
- No console errors

## Production Build

```bash
npm run build
npm run preview
```

Expected:

- `tsc -b` passes
- Vite emits `dist/` with hashed assets
- Preview server serves the production bundle

## Sound Engine Dependency

Verify the linked engine package resolves:

```bash
node -e "import('plantasia-sound-engine').then(m => console.log(Object.keys(m)))"
```

Expected: exports include `PlantasiaEngine` and related public API symbols (exact keys depend on engine version).

If import fails:

1. Rebuild the sound engine: `cd ../plantasia-sound-engine && npm run build`
2. Reinstall: `cd ../plantasia-engine-test && npm install`

## SCSS / Bootstrap

After `npm run dev`, inspect computed styles on `body`:

- `background-color` should reflect `--plantasia-color-background`
- `font-family` should reflect Bootstrap sans-serif mapping

## Foundation Checklist

| Check | Command / Action | Expected |
|-------|------------------|----------|
| Install | `npm install` | Success |
| Typecheck | `npm run typecheck` | No errors |
| Dev server | `npm run dev` | Loads without console errors |
| Build | `npm run build` | `dist/` created |
| Engine link | `node -e "import('plantasia-sound-engine')..."` | Public exports available |
| Folder structure | Manual review | All `src/` subdirectories present |
| Docs | Manual review | README, ARCHITECTURE, ROADMAP, ASCII_GRAMMAR present |

## Future Feature Testing

When audio, MIDI, sequencing, and visualization modules are implemented, extend this guide with:

- Engine initialization smoke test
- Preset load/switch verification
- MIDI device attach/detach
- ASCII state sync with audio events
- Canvas frame rate baseline

Track new procedures in `docs/engineering/` as subsystems land.
