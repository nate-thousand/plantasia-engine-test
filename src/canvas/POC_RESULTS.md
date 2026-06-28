# Pixi Glyph Renderer — POC Gate Review

**Branch:** `feat/pixi-glyph-renderer-poc`  
**Status:** POC implemented — **DOM remains default** until benchmarks pass on target devices.

## Implementation summary

| Item | Status |
|------|--------|
| `GlyphRenderBackend` interface + DOM/Pixi backends | Done |
| Shape glyph draw-list from `ShapeScenePainters` | Done |
| Pixi `BitmapText` pool (320 glyphs) | Done |
| Frame metrics (`frameMetrics.ts`) + debug overlay | Done |
| GSAP ambient enter choreography | Done |
| Feature flag `VITE_RENDERER=dom\|pixi` | Done |

## How to benchmark

1. **DOM baseline:** `npm run dev` → open `/?debug=1` → play ambient, interact 60s
2. **Pixi POC:** `VITE_RENDERER=pixi npm run dev` → same session
3. Record debug overlay: p50, p95, jank %

Test on:

- Desktop Chrome (reference)
- iPhone Safari (primary mobile gate)
- Mid-range Android Chrome

## Success gates

| Gate | Target | Notes |
|------|--------|-------|
| Mobile p95 frame time | ≥25% lower vs DOM | Requires device testing |
| Jank frames (>32ms) | ≥40% reduction | From debug overlay |
| Visual parity | 11 presets readable | Manual preset sweep |
| Bundle size | ≤180 KB gzip increase | **DOM default: +~2 KB gzip** (667→194 KB main). Pixi lazy chunk: ~117 KB gzip additional when enabled |

## Recommendation

**Do not merge Pixi as default until mobile gates pass.**

Build verification (dom default): main JS **194 KB gzip** (baseline ~192 KB) — Pixi/GSAP code-split into lazy chunks loaded only when `VITE_RENDERER=pixi` or `?renderer=pixi`.

The architecture is sound (hybrid B: simulation unchanged, display sink swapped). Expected wins:

- Eliminates shape-layer contribution to `innerHTML` parse cost (~48–280 glyphs)
- Enables sub-pixel opacity/scale on shape glyphs via GPU
- GSAP ambient-enter choreography on Pixi container

Remaining DOM cost: plants, particles, overlays still use `<pre>` until Phase 2.

**Gate review decision:** Keep `dom` as production default. POC branch ready for device A/B testing via `npm run dev:pixi` and `?debug=1`.

## Rollback

- Runtime: `VITE_RENDERER=dom`
- Code: stay on `main`; delete POC branch if abandoning
