import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import type { MidiControlTarget, SliderControlTarget } from '../input/MidiDefaults';
import { isSliderTarget } from '../input/MidiDefaults';

export type ControlHighlight = {
  target: SliderControlTarget;
  tick: number;
};

export type ControlStoreState = {
  sound: SoundControlValues;
  modulation: ModulationControlValues;
  highlight: ControlHighlight | null;
  lastMidiTarget: MidiControlTarget | null;
};

const DEFAULT_SOUND: SoundControlValues = {
  volume: 72,
  tone: 50,
  texture: 40,
  bloom: 35,
};

const DEFAULT_MODULATION: ModulationControlValues = {
  growthRate: 45,
  drift: 30,
  mutation: 20,
  energy: 55,
};

const initialState: ControlStoreState = {
  sound: DEFAULT_SOUND,
  modulation: DEFAULT_MODULATION,
  highlight: null,
  lastMidiTarget: null,
};

let state: ControlStoreState = { ...initialState };
const listeners = new Set<() => void>();
let highlightTick = 0;

type ControlChangeListener = (
  sound: SoundControlValues,
  modulation: ModulationControlValues,
  source: 'ui' | 'midi',
) => void;

const changeListeners = new Set<ControlChangeListener>();

export function getControlStore(): ControlStoreState {
  return state;
}

export function subscribeControlStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeControlChanges(listener: ControlChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function notifyChange(source: 'ui' | 'midi'): void {
  changeListeners.forEach((listener) => listener(state.sound, state.modulation, source));
  notify();
}

export function resetControlStore(): void {
  state = { ...initialState, sound: { ...DEFAULT_SOUND }, modulation: { ...DEFAULT_MODULATION } };
  notify();
}

export function setSoundValues(values: SoundControlValues, source: 'ui' | 'midi' = 'ui'): void {
  state = { ...state, sound: values };
  notifyChange(source);
}

export function setModulationValues(values: ModulationControlValues, source: 'ui' | 'midi' = 'ui'): void {
  state = { ...state, modulation: values };
  notifyChange(source);
}

export function setControlSurface(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
  source: 'ui' | 'midi' = 'ui',
): void {
  state = { ...state, sound, modulation };
  notifyChange(source);
}

export function updateSoundControl(
  key: keyof SoundControlValues,
  value: number,
  source: 'ui' | 'midi' = 'ui',
): void {
  const sound = { ...state.sound, [key]: value };
  state = {
    ...state,
    sound,
    highlight: source === 'midi' ? { target: key, tick: ++highlightTick } : state.highlight,
    lastMidiTarget: source === 'midi' ? key : state.lastMidiTarget,
  };
  notifyChange(source);
}

export function updateModulationControl(
  key: keyof ModulationControlValues,
  value: number,
  source: 'ui' | 'midi' = 'ui',
): void {
  const modulation = { ...state.modulation, [key]: value };
  state = {
    ...state,
    modulation,
    highlight: source === 'midi' ? { target: key, tick: ++highlightTick } : state.highlight,
    lastMidiTarget: source === 'midi' ? key : state.lastMidiTarget,
  };
  notifyChange(source);
}

export function applyMidiSliderTarget(target: SliderControlTarget, value: number): void {
  if (target === 'volume' || target === 'tone' || target === 'texture' || target === 'bloom') {
    updateSoundControl(target, value, 'midi');
    return;
  }

  updateModulationControl(target, value, 'midi');
}

export function applyMidiTargetValue(target: MidiControlTarget, value: number): void {
  if (isSliderTarget(target)) {
    applyMidiSliderTarget(target, value);
  }
}

export function applyTemporaryBoost(
  key: 'energy' | 'mutation',
  amount: number,
  durationMs = 400,
): () => void {
  const current = state.modulation[key];
  const boosted = Math.min(100, current + amount);
  updateModulationControl(key, boosted, 'midi');

  const timeoutId = window.setTimeout(() => {
    updateModulationControl(key, current, 'midi');
  }, durationMs);

  return () => window.clearTimeout(timeoutId);
}
