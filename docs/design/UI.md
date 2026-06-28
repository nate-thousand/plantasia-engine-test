# Plantasia Instrument UI (M14)

Monochrome instrument surface for Plantasonic. Visual and interaction redesign only — all engine, preset, MIDI, and visualization behavior is unchanged.

## Design principles

- **Instrument-first** — hardware synthesizer workstation, not a web dashboard
- **Monochrome chrome** — black, white, gray only in UI chrome (Camelot colors apply to ASCII visualization later)
- **Modular** — five logical modules with shared primitives
- **Responsive foundation** — desktop card grid; collapses to single column on tablet/mobile

## Component hierarchy

```
App
└── InstrumentShell
    ├── AsciiCanvasView          (visual stage — unchanged)
    └── footer
        ├── UnifiedTransport     (Transport module — always visible)
        └── InstrumentSurface    (drawer — Sound, Visual, Performance, Output)
            ├── SoundModule
            ├── VisualModule
            ├── PerformanceModule
            └── OutputModule

Primitives (shared styling)
├── InstrButton
├── InstrSelect
├── InstrSwitch
├── InstrKnob        (rotary, pointer + keyboard)
├── InstrPanel       (+ InstrSubsection)
├── InstrMeter
└── InstrWaveform
```

## Layout system

| Region | Role |
|--------|------|
| **Stage** | Full-viewport ASCII / glyph renderer |
| **Transport bar** | Play, Stop, Rec (placeholder), preset prev/select/next, status, panel toggle |
| **Surface drawer** | 2×2 module grid (desktop), 1 column (≤960px) |

Module mapping:

1. **Transport** — `UnifiedTransport.tsx`
2. **Sound** — Oscillator, Filter, Effects, Modulation knobs
3. **Visual** — Particles, Contrast, Anim, Reduce Motion
4. **Performance** — Visual Energy meter, MIDI, Keyboard, Preset details
5. **Output** — Master placeholder, live status grid

## Spacing scale

Defined in `src/tokens/_css-variables.scss`:

| Token | Value |
|-------|-------|
| `--plantasia-space-2xs` | 0.125rem |
| `--plantasia-space-xs` | 0.25rem |
| `--plantasia-space-sm` | 0.5rem |
| `--plantasia-space-md` | 0.75rem |
| `--plantasia-space-lg` | 1rem |
| `--plantasia-space-xl` | 1.5rem |
| `--plantasia-space-2xl` | 2rem |

Module gap: `--plantasia-module-gap` (0.75rem).  
Touch target minimum: `--plantasia-touch-target` (2.75rem / 44px).

## Typography scale

| Token | Use |
|-------|-----|
| `--plantasia-font-size-display` | Preset name in transport |
| `--plantasia-font-size-title` | Panel section titles |
| `--plantasia-font-size-label` | Parameter labels, buttons |
| `--plantasia-font-size-value` | Knob values |
| `--plantasia-font-size-status` | Hints, units, status |

Fonts: **Inter** (UI), **IBM Plex Mono** (instrument labels and values).

## Motion principles

| Token | Duration | Use |
|-------|----------|-----|
| `--plantasia-duration-fast` | 100ms | Button press, hover |
| `--plantasia-duration-normal` | 200ms | Knob ring, meters, drawer fade |
| `--plantasia-duration-slow` | 360ms | Drawer height expand |

- Buttons: scale 0.96 on active press
- Knobs: smooth stroke-dashoffset on value change
- Drawer: max-height + opacity transition
- `prefers-reduced-motion`: transitions disabled on chrome controls

## Responsive behavior

- **Desktop** — transport bar + 2-column module grid, max-width 72rem
- **Tablet (≤960px)** — single-column modules
- **Mobile (≤640px)** — transport stacks vertically; same components (no duplicate UI)

Panel toggle (`Panel` / `Close`) controls `#instrument-surface-panel` via `instrument-surface-shell--open`.

## Future color integration (Camelot)

UI tokens reserve semantic hooks (`--plantasia-color-primary`, `--plantasia-color-organism`) but M14 chrome uses monochrome values only. When Camelot ships:

- Map organism / preset colors to **visualization layer** (`AsciiCanvasView`, musical-color debug)
- Optionally tint active transport state or preset name — **not** control surfaces
- No structural redesign required; tokens swap in `_css-variables.scss`

## Styles entry

```scss
// src/styles/main.scss
@import 'base';
@import 'app-shell';
@import 'instrument/primitives';
@import 'instrument/surface';
```

Bootstrap bundle removed from production styles — legacy control dock SCSS retained but unused.

## Related files

- `src/tokens/_css-variables.scss` — design tokens
- `src/styles/instrument/_primitives.scss` — control primitives
- `src/styles/instrument/_surface.scss` — layout and panels
- `src/components/instrument/` — surface and modules
