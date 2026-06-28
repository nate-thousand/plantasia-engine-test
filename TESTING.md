# Testing Guide

Verification procedures for `plantasia-engine-test`.

## Requirements

- Node.js 18+
- npm
- Modern browser (Chrome, Edge, Firefox, Safari)
- `plantasia-sound-engine` (installed from GitHub during `npm install`)
- Optional: USB MIDI controller (Akai MPK Mini or any class-compliant keyboard)

## Installation

```bash
cd plantasia-engine-test
npm install
```

For local co-development with an unpublished engine checkout:

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

- Vite starts on port **5270**
- Fullscreen Plantasia instrument UI renders
- ASCII organism centered; control dock at bottom
- No console errors
- No “Wrong server” warning (dev-only boot guard)

## Production Build

```bash
npm run build
npm run preview
```

Expected:

- `tsc -b` passes
- Vite emits `dist/` with bundled JS/CSS
- Preview at http://localhost:5270/ renders the same fullscreen UI

## Production Deployment (Vercel)

**URL:** https://plantasia-engine-test.vercel.app

Expected:

- Fullscreen Plantasia instrument UI renders
- Start Audio requires a user gesture (browser Web Audio policy)
- Web MIDI requires HTTPS and a user gesture (Connect button after Start Audio)

---

## Computer Keyboard Input

After **Start Audio**, the keyboard row is live (focus the page, not a form control):

| Key | Note |
|-----|------|
| A | C4 |
| W | C#4 |
| S | D4 |
| E | D#4 |
| D | E4 |
| F | F4 |
| T | F#4 |
| G | G4 |
| Y | G#4 |
| H | A4 |
| U | A#4 |
| J | B4 |
| K | C5 |

**Verify:**

1. Start Audio
2. Press **A** — C4 sounds, organism enters playing state
3. Release **A** — note stops, organism returns to resting when no keys held
4. Hold a key — no retrigger stutter from key repeat
5. Open preset dropdown, type — keys do not trigger notes while focus is in `<select>`

Control dock shows **Keyboard: Enabled** when audio is running.

---

## Web MIDI — Generic Keyboard

**Browser:** Chrome or Edge recommended (best Web MIDI support). Safari support varies.

1. Connect a class-compliant USB MIDI keyboard
2. Start Audio
3. Click **Connect** in the MIDI control group
4. Grant permission if prompted
5. Select the device in the dropdown
6. Play keys — notes sound, **Note** label updates, top overlay shows last note

**Verify:**

- Note on with velocity > 0 plays sound
- Note off stops the note
- Note on with velocity 0 is treated as note off
- Harder strikes increase organism energy density (visual)

---

## Web MIDI — Akai MPK Mini

The app does not hardcode Akai device IDs. Any Web MIDI input appears in the device list.

1. Connect MPK Mini via USB
2. Start Audio → **Connect** → select **MPK mini** (or similar name)
3. Play keys on the keyboard section — same as generic MIDI test
4. Play pads — pad notes trigger if they send standard note-on/off (typical factory mapping)

If no sound on pads, check the MPK Mini editor for pad note assignments; the app routes all MIDI note messages the same way.

---

## Transport and Presets (Regression)

| Step | Expected |
|------|----------|
| Start Audio | Engine initializes, preset loads, keyboard enabled |
| Play Note / Stop Note | Chord trigger / all voices released |
| Preset prev/next/random | Preset name updates, sound changes |
| Volume slider | Output gain changes |

---

## Sound Engine Dependency

```bash
node -e "import('plantasia-sound-engine').then(m => console.log(Object.keys(m)))"
```

Expected: exports include `PlantasiaEngine` and related public API symbols.

**Constraint:** Do not modify `plantasia-sound-engine` from this repo. Live keyboard/MIDI notes use `EngineAdapter` + Tone.js PolySynth on the shared context until the engine exposes `noteOn`/`noteOff`.

---

## Checklist

| Check | Command / URL | Expected |
|-------|---------------|----------|
| Install | `npm install` | Success |
| Typecheck | `npm run typecheck` | No errors |
| Build | `npm run build` | `dist/` created |
| Local dev | http://localhost:5270/ | Fullscreen UI |
| Keyboard A | After Start Audio | C4 on press, stop on release |
| MIDI Connect | Connect + device select | Status Connected, notes play |
| Production | https://plantasia-engine-test.vercel.app | Fullscreen UI |
