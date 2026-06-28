import type { EnergySourceKey } from '../visualization/VisualEnergy';

export type VizDebugSnapshot = {
  visualEnergy: number;
  interactionIntensity: number;
  interactionBoost: number;
  activeSource: EnergySourceKey | 'idle';
  isInteracting: boolean;
  glyphCount: number;
  particleCount: number;
  fps: number;
  profile: string;
};

const initial: VizDebugSnapshot = {
  visualEnergy: 0,
  interactionIntensity: 2,
  interactionBoost: 0,
  activeSource: 'idle',
  isInteracting: false,
  glyphCount: 0,
  particleCount: 0,
  fps: 0,
  profile: 'extreme',
};

let state: VizDebugSnapshot = { ...initial };
const listeners = new Set<() => void>();

export function getVizDebugSnapshot(): VizDebugSnapshot {
  return state;
}

export function subscribeVizDebugSnapshot(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchVizDebugSnapshot(partial: Partial<VizDebugSnapshot>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

export function resetVizDebugSnapshot(): void {
  state = { ...initial };
  listeners.forEach((listener) => listener());
}
