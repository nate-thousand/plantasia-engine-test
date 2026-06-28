import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import type { MidiControlTarget, SliderControlTarget } from '../input/MidiDefaults';
import { isSliderTarget } from '../input/MidiDefaults';
import { pulseScreenFeedback } from './midiStore';
import { pulseVisualEnergy } from './visualEnergyStore';
import { scaleEventAmount } from '../visualization/InteractionResponse';
import { clampMold } from '../audio/moldSync';

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
  mold: 12,
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
  const nextValue = key === 'mold' ? clampMold(value) : value;
  const sound = { ...state.sound, [key]: nextValue };
  state = {
    ...state,
    sound,
    highlight: { target: key, tick: ++highlightTick },
    lastMidiTarget: source === 'midi' ? key : state.lastMidiTarget,
  };
  pulseScreenFeedback(source === 'ui' ? 95 : 80, 'knobTwist', key);
  pulseVisualEnergy('control', scaleEventAmount(source === 'ui' ? 127 : 110));
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
    highlight: { target: key, tick: ++highlightTick },
    lastMidiTarget: source === 'midi' ? key : state.lastMidiTarget,
  };
  pulseScreenFeedback(source === 'ui' ? 95 : 80, 'knobTwist', key);
  pulseVisualEnergy('control', scaleEventAmount(source === 'ui' ? 127 : 110));
  notifyChange(source);
}

export function applyMidiSliderTarget(target: SliderControlTarget, value: number): void {
  if (target === 'mold' || target === 'tone' || target === 'texture' || target === 'bloom') {
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
  key: SliderControlTarget | keyof SoundControlValues | keyof ModulationControlValues,
  amount: number,
  durationMs = 450,
): () => void {
  const soundKeys: (keyof SoundControlValues)[] = ['mold', 'tone', 'texture', 'bloom'];
  const isSound = soundKeys.includes(key as keyof SoundControlValues);

  let current: number;
  if (isSound) {
    current = state.sound[key as keyof SoundControlValues];
    updateSoundControl(key as keyof SoundControlValues, Math.min(100, current + amount), 'midi');
  } else {
    current = state.modulation[key as keyof ModulationControlValues];
    updateModulationControl(
      key as keyof ModulationControlValues,
      Math.min(100, current + amount),
      'midi',
    );
  }

  const timeoutId = window.setTimeout(() => {
    if (isSound) {
      updateSoundControl(key as keyof SoundControlValues, current, 'midi');
    } else {
      updateModulationControl(key as keyof ModulationControlValues, current, 'midi');
    }
  }, durationMs);

  return () => window.clearTimeout(timeoutId);
}
