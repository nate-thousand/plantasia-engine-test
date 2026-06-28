/** Generative ambient state exposed to visuals (M15). */
export type AmbientGenerativeState = {
  active: boolean;
  voiceDensity: number;
  textureAmount: number;
  evolutionPhase: number;
  harmonicCenter: number;
  recentActivity: number;
  stereoSpread: number;
  padEnergy: number;
  bellActivity: number;
  soundWorld: string;
};

const initialState: AmbientGenerativeState = {
  active: false,
  voiceDensity: 0.35,
  textureAmount: 0.2,
  evolutionPhase: 0,
  harmonicCenter: 48,
  recentActivity: 0,
  stereoSpread: 0.4,
  padEnergy: 0.3,
  bellActivity: 0,
  soundWorld: 'standard',
};

let state: AmbientGenerativeState = { ...initialState };
const listeners = new Set<() => void>();

export function getAmbientGenerativeState(): AmbientGenerativeState {
  return state;
}

export function subscribeAmbientGenerativeState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchAmbientGenerativeState(partial: Partial<AmbientGenerativeState>): void {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export function resetAmbientGenerativeState(): void {
  state = { ...initialState };
  listeners.forEach((l) => l());
}

/** Decay recentActivity each frame — call from engine tick. */
export function decayAmbientActivity(deltaMs: number): void {
  if (state.recentActivity <= 0) {
    return;
  }
  state = {
    ...state,
    recentActivity: Math.max(0, state.recentActivity - deltaMs / 2800),
  };
}

export function pulseAmbientActivity(amount = 0.35): void {
  state = {
    ...state,
    recentActivity: Math.min(1, state.recentActivity + amount),
  };
  listeners.forEach((l) => l());
}
