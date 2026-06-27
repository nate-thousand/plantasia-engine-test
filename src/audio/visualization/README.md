# Visualization Hooks

## Purpose

Emit normalized audio and state signals for ASCII and canvas renderers.

## Planned Responsibilities

- Tap engine output levels, note activity, and parameter changes
- Publish events consumable by `src/ascii/`, `src/canvas/`, and `src/visuals/`
- Keep visualization logic decoupled from synthesis

## Boundaries

- No rendering in this folder — hooks and adapters only
- Visual grammar follows `docs/brand/ASCII_GRAMMAR.md`

## Status

Placeholder. Implementation pending.
