# Testing Guide

Verification procedures for `plantasia-engine-test`.

## Requirements

- Node.js 18+
- npm
- Modern browser (Chrome, Edge, Firefox, Safari)
- `plantasia-sound-engine` (installed from GitHub during `npm install`)

## Installation

```bash
cd plantasia-engine-test
npm install
```

For local co-development with an unpublished engine checkout, link the sibling package:

```bash
cd ../plantasia-sound-engine && npm run build
cd ../plantasia-engine-test && npm link ../plantasia-sound-engine
```

## Type Check

```bash
npm run typecheck
```

Expected: no TypeScript errors.

## Local Development

```bash
npm run dev
```

**URL:** http://localhost:5270/

Expected:

- Vite starts on port **5270** (fails if already in use)
- Fullscreen Plantasia instrument UI renders
- ASCII organism centered; control dock at bottom
- No console errors
- No “Wrong server” warning (that guard is dev-only and removed from production builds)

## Production Build

```bash
npm run build
npm run preview
```

Expected:

- `tsc -b` passes
- Vite emits `dist/` with bundled JS/CSS (~480 KB JS)
- Preview at http://localhost:5270/ renders the same fullscreen UI

## Production Deployment (Vercel)

**URL:** https://plantasia-engine-test.vercel.app

Expected:

- Vercel serves the production bundle from `dist/`
- Fullscreen Plantasia instrument UI renders
- **No** “Wrong server” message — that warning must not appear on Vercel
- Start Audio requires a user gesture (browser Web Audio policy)

The app uses a standard Vite production entry (`/src/main.tsx` → bundled assets). Dev-only boot guards are gated with `import.meta.env.DEV` and are stripped from production builds.

## Sound Engine Dependency

Verify the engine package resolves:

```bash
node -e "import('plantasia-sound-engine').then(m => console.log(Object.keys(m)))"
```

Expected: exports include `PlantasiaEngine` and related public API symbols.

If import fails after switching branches:

```bash
npm install
```

## Checklist

| Check | Command / URL | Expected |
|-------|---------------|----------|
| Install | `npm install` | Success |
| Typecheck | `npm run typecheck` | No errors |
| Local dev | http://localhost:5270/ | Fullscreen UI |
| Build | `npm run build` | `dist/` created |
| Production | https://plantasia-engine-test.vercel.app | Fullscreen UI, no wrong-server warning |
| Engine import | `node -e "import('plantasia-sound-engine')..."` | Public exports available |

## Future Feature Testing

When MIDI, sequencing, and visualization modules are implemented, extend this guide with subsystem smoke tests. Track new procedures in `docs/engineering/` as features land.
