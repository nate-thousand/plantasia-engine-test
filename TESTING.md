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
2. Press **A** — C4 sounds, center/root activation (`+` / `•`) at organism core
3. Press **W** — C#4 mutation marks (`╳`) appear
4. Press **H** — A4 bloom structure appears above center
5. Release keys — note visuals release; overlay shows active note count
6. Hold multiple keys — chord harmony or tension structure depending on intervals
7. Open preset dropdown, type — keys do not trigger notes while focus is in `<select>`

Top overlay shows visual state label (e.g. `note · 1n`, `harmony · 3n`) and last note name.

Control dock shows **Keyboard: Enabled** when audio is running.

---

## Note-Driven Visual Language (Milestone 9)

After Start Audio, each key maps to a grammar-defined organism form:

| Key | Note | Expected visual role |
|-----|------|----------------------|
| A | C4 | Center / root activation |
| W | C#4 | Mutation (`╳`) |
| S | D4 | Upward growth (`│`) |
| E | D#4 | Curved branch (`╮`) |
| D | E4 | Branch expansion (`╱`) |
| F | F4 | Root spread (`╲`) |
| T | F#4 | Tension cross (`╳`) |
| G | G4 | Harmony connection (`┼`) |
| Y | G#4 | Particle shimmer (`·`) |
| H | A4 | Bloom |
| U | A#4 | Asymmetric variation |
| J | B4 | Resolution toward center |
| K | C5 | Upper bloom seed |

**Slider visual checks (audio unchanged):**

| Slider | Move | Expected visual |
|--------|------|-----------------|
| Volume | Up | Denser particle row |
| Tone | Up | Brighter halo symbols |
| Texture | Up | Wider `░▒▓` band |
| Bloom | Up | Larger bloom cross |
| Growth | Up | Taller upward reach |
| Drift | Up | Asymmetric offset particles |
| Mutation | Up | Visible `╳` at hub |
| Energy | Up | More particles in energy row |

**Chord checks:**

- Play C + G (fifth) — harmony diamond structure
- Play C + C# (minor second) — tension / `╳` structure
- Play dense cluster (e.g. C, C#, D) — increased texture density

---

## Full MIDI Control Mapping (Milestone 10)

### MIDI Notes

1. Start Audio → Connect → select device
2. Press and hold a key — sound plays, organism note structure appears
3. Release key — sound stops, visual releases (unless Hold is on)
4. Note on with velocity 0 treated as note off
5. Multiple held notes — polyphony, chord harmony/tension structures
6. Harder strikes — higher velocity → denser ASCII (`●`/`▓`)

### MIDI Continuous Controls (CC)

| CC | Control | Verify |
|----|---------|--------|
| 7 | Volume | Slider moves, output gain changes |
| 74 | Tone | Slider moves, organism halo updates |
| 71 | Texture | Slider moves, texture band updates |
| 73 | Bloom | Slider moves, bloom cross updates |
| 72 | Growth | Slider moves, upward reach updates |
| 1 | Drift | Slider moves, asymmetric particles |
| 2 | Mutation | Slider moves, `╳` disruption |
| 11 | Energy | Slider moves, particle density |

**MPK Mini:** When device name contains "MPK", CC 1–8 also map to knobs 1–8 (Volume → Energy) if not overridden by learned mappings.

Unmapped CCs appear in the MIDI control group as "Detected: CCn" and in the top overlay.

### MIDI Learn

1. Click **Learn** in the MIDI group
2. Click a slider label, transport button, or preset button (or pick from action buttons in MIDI group)
3. Move a knob/slider on the controller
4. Mapping saves to `localStorage` key `plantasia-midi-mappings`
5. Reload page — learned mapping persists and overrides defaults

### MIDI Pads (Default — MPK Mini Bank A)

| Pad Note | Action |
|----------|--------|
| 48 (C3) | Play |
| 49 (C#3) | Stop |
| 50 (D3) | Previous Preset |
| 51 (D#3) | Next Preset |
| 52 (E3) | Random Preset |
| 53 (F3) | Hold toggle |
| 54 (F#3) | Energy burst |
| 55 (G3) | Mutation burst |

Pads in CC mode use CC 20–27 for the same actions (value > 64 triggers).

Unknown pad messages log to console: `[Plantasia MIDI] Unknown pad message:`

### Program Change

Sending a program change message loads the preset at that index (wrapped to catalog size).

### Troubleshooting

| Issue | Check |
|-------|-------|
| No MIDI devices | USB connection, browser (Chrome/Edge), HTTPS for production |
| CC moves but slider doesn't | CC may be unmapped — use Learn or check Detected CC list |
| Pad does nothing | Pad may send non-default note — check console log, use Learn |
| Learn doesn't save | localStorage enabled, not in private browsing |
| Knob maps to wrong control | MPK profile vs standard CC — use Learn to override |

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
| Keyboard A | After Start Audio | C4 center/root visual + sound |
| Keyboard W / H | After Start Audio | Mutation / bloom visuals |
| MIDI CC Volume | Move CC 7 | Volume slider + sound update |
| MIDI Learn | Learn → assign → reload | Mapping persists |
| Chord cluster | Multiple keys | Harmony or tension structure |
| Sliders | After Start Audio | Visual density changes, no console errors |
| MIDI Connect | Connect + device select | Status Connected, notes play |
| Production | https://plantasia-engine-test.vercel.app | Fullscreen UI |
