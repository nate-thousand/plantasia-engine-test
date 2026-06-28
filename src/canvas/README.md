# Canvas / Pixi Glyph Renderer (POC)

Hybrid GPU renderer for Plantasonic shape glyphs. Simulation, energy, presets, and transport are unchanged.

## Enable Pixi renderer

```bash
VITE_RENDERER=pixi npm run dev
```

Or append `?renderer=pixi` to the URL (debug override).

Default production build uses DOM `<pre>` (`VITE_RENDERER=dom` or unset).

## Architecture

- **Simulation** — `AsciiEngine`, `GlyphAnimation`, `VisualEnergy` (unchanged)
- **DOM layer** — plants, particles, slider overlays via `<pre>`
- **Pixi layer** — shape glyphs only (`BitmapText` pool, ≥320 glyphs)
- **GSAP** — ambient Play enter choreography on Pixi container

## Benchmarking

Open with `?debug=1` to see frame metrics overlay (p50/p95, jank %).

Compare:

1. `npm run dev` (DOM baseline)
2. `VITE_RENDERER=pixi npm run dev` (Pixi POC)

Success gates (see plan):

- Mobile p95 frame time ≥25% lower
- Jank frames (>32ms) reduced ≥40%
- No preset shape identity regression

## POC results

See [POC_RESULTS.md](./POC_RESULTS.md) for gate review and merge recommendation.

## Rollback

Set `VITE_RENDERER=dom` or remove the env var and rebuild. Delete branch `feat/pixi-glyph-renderer-poc` to abandon.
