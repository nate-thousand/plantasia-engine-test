# Engine Initialization

## Purpose

Manage the lifecycle of `PlantasiaEngine` from the application layer.

## Planned Responsibilities

- Construct and hold a single engine instance
- Unlock the Web Audio context after user gesture
- Expose start, stop, and dispose hooks
- Surface engine readiness and error state to stores and UI

## Boundaries

- Import from `plantasia-sound-engine` only — no local synth code
- Do not duplicate engine configuration or preset parsing

## Status

Placeholder. Implementation pending.
