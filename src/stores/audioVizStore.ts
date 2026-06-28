import type { AudioVizFeedback } from '../audio/visualization/AudioTap';

export type AudioVizStoreState = AudioVizFeedback;

const initialState: AudioVizStoreState = {
  amplitude: 0,
  peak: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  brightness: 0,
  isActive: false,
  spectrum: [],
  waveform: [],
};

let state: AudioVizStoreState = { ...initialState };
const listeners = new Set<() => void>();

export function getAudioVizStore(): AudioVizStoreState {
  return state;
}

export function subscribeAudioVizStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchAudioVizStore(feedback: AudioVizFeedback): void {
  state = feedback;
  listeners.forEach((listener) => listener());
}

export function resetAudioVizStore(): void {
  state = { ...initialState, spectrum: [], waveform: [] };
  listeners.forEach((listener) => listener());
}
