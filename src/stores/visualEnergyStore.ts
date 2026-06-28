import {
  createUnifiedVisualEnergyState,
  pulseSourceImpulse,
  tickUnifiedVisualEnergy,
  type EnergySourceKey,
  type UnifiedVisualEnergyState,
  type VisualEnergyFrameInput,
} from '../visualization/VisualEnergy';
import type { VizAccessibility } from '../visualization/types';

export type VisualEnergyStoreState = UnifiedVisualEnergyState;

let state: VisualEnergyStoreState = createUnifiedVisualEnergyState();
const listeners = new Set<() => void>();

export function getVisualEnergyStore(): VisualEnergyStoreState {
  return state;
}

export function subscribeVisualEnergyStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Discrete event — note hit, button press, preset change, slider twist. Amount 0–127 or 0–1. */
export function pulseVisualEnergy(source: EnergySourceKey, amount: number): void {
  state = {
    ...state,
    sources: pulseSourceImpulse(state.sources, source, amount),
  };
  emit();
}

/** Per-frame advance — call once from the visualization loop. */
export function tickVisualEnergy(
  input: VisualEnergyFrameInput,
  deltaMs: number,
  accessibility: Pick<VizAccessibility, 'reduceMotion'>,
): VisualEnergyStoreState {
  state = tickUnifiedVisualEnergy(state, input, deltaMs, accessibility);
  emit();
  return state;
}

export function resetVisualEnergyStore(): void {
  state = createUnifiedVisualEnergyState();
  emit();
}
