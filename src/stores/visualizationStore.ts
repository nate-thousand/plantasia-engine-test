import type { VizAccessibility } from '../visualization/types';

const STORAGE_KEY = 'plantasia-viz-accessibility';

const DEFAULT_ACCESSIBILITY: VizAccessibility = {
  density: 65,
  animationSpeed: 75,
  characterScale: 1,
  contrast: 70,
  reduceMotion: false,
};

let state: VizAccessibility = loadAccessibility();
const listeners = new Set<() => void>();

function loadAccessibility(): VizAccessibility {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_ACCESSIBILITY };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_ACCESSIBILITY };
    }
    return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY };
  }
}

function saveAccessibility(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getVizAccessibility(): VizAccessibility {
  return state;
}

export function subscribeVizAccessibility(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchVizAccessibility(partial: Partial<VizAccessibility>): void {
  state = { ...state, ...partial };
  saveAccessibility();
  listeners.forEach((listener) => listener());
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initVizAccessibility(): void {
  if (prefersReducedMotion() && !localStorage.getItem(STORAGE_KEY)) {
    patchVizAccessibility({ reduceMotion: true, animationSpeed: 40 });
  }
}
