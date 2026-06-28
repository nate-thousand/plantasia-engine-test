import type { MidiControlTarget } from '../input/MidiDefaults';
import { getMappingCount } from '../input/MidiControlMap';
import type { MidiVisualEffect } from '../visualization/ThemeMidiEffects';
import { INTERACTION_DECAY_STEP, interactionPulseAmount } from '../visualization/VisualFeedback';
import { pulseVisualEnergy } from './visualEnergyStore';

export type MidiStoreState = {
  learnEnabled: boolean;
  learnTarget: MidiControlTarget | null;
  lastMessage: string | null;
  lastCcNumber: number | null;
  lastCcValue: number | null;
  detectedCcs: Record<number, number>;
  mappingCount: number;
  lastLearnedCc: number | null;
  lastLearnedTarget: MidiControlTarget | null;
  interactionBurst: number;
  unknownPadLog: string | null;
  pitchBend: number;
  modWheel: number;
  channelPressure: number;
  pitchBendRange: number;
  velocityCurve: 'soft' | 'normal' | 'bright';
  midiVisualEffect: MidiVisualEffect | null;
  isMpkMini: boolean;
};

const initialState: MidiStoreState = {
  learnEnabled: false,
  learnTarget: null,
  lastMessage: null,
  lastCcNumber: null,
  lastCcValue: null,
  detectedCcs: {},
  mappingCount: getMappingCount(),
  lastLearnedCc: null,
  lastLearnedTarget: null,
  interactionBurst: 0,
  unknownPadLog: null,
  pitchBend: 0,
  modWheel: 64,
  channelPressure: 0,
  pitchBendRange: 2,
  velocityCurve: 'normal',
  midiVisualEffect: null,
  isMpkMini: false,
};

let state: MidiStoreState = { ...initialState };
const listeners = new Set<() => void>();
let effectTick = 0;

export function getMidiStore(): MidiStoreState {
  return state;
}

export function subscribeMidiStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchMidiStore(partial: Partial<MidiStoreState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

export function recordMidiMessage(message: string): void {
  patchMidiStore({ lastMessage: message });
}

export function recordCcDetection(controller: number, value: number): void {
  patchMidiStore({
    lastCcNumber: controller,
    lastCcValue: value,
    detectedCcs: { ...state.detectedCcs, [controller]: value },
    modWheel: controller === 1 ? value : state.modWheel,
  });
}

export function setPitchBend(normalized: number): void {
  patchMidiStore({ pitchBend: Math.max(-1, Math.min(1, normalized)) });
}

export function setChannelPressure(pressure: number): void {
  patchMidiStore({ channelPressure: pressure });
}

export function setMpkMiniActive(active: boolean): void {
  patchMidiStore({ isMpkMini: active });
}

export function pulseInteractionBurst(amount: number): void {
  patchMidiStore({
    interactionBurst: Math.max(state.interactionBurst, interactionPulseAmount(amount)),
  });
}

export function decayInteractionBurst(step = INTERACTION_DECAY_STEP): void {
  if (state.interactionBurst > 0) {
    patchMidiStore({ interactionBurst: Math.max(0, state.interactionBurst - step) });
  }
}

/** Combined burst + MIDI visual effect — call on any user interaction. */
export function pulseScreenFeedback(
  intensity: number,
  kind: MidiVisualEffect['kind'] = 'padHit',
  controlTarget?: string,
): void {
  const scaled = Math.min(127, Math.max(intensity, 85));
  pulseInteractionBurst(scaled);
  triggerMidiVisualEffect(kind, scaled, controlTarget);

  switch (kind) {
    case 'presetChange':
      pulseVisualEnergy('preset', scaled);
      break;
    case 'knobTwist':
      pulseVisualEnergy('control', scaled);
      break;
    case 'play':
    case 'stop':
      pulseVisualEnergy('ui', scaled);
      break;
    default:
      pulseVisualEnergy('ui', scaled * 0.65);
      break;
  }
}

export function triggerMidiVisualEffect(
  kind: MidiVisualEffect['kind'],
  intensity: number,
  controlTarget?: string,
): void {
  effectTick += 1;
  patchMidiStore({
    midiVisualEffect: {
      kind,
      intensity: Math.max(0, Math.min(127, intensity)),
      tick: effectTick,
      controlTarget,
    },
    interactionBurst: Math.max(
      state.interactionBurst,
      interactionPulseAmount(Math.round((intensity / 127) * 40 + 60)),
    ),
  });
}

export function logUnknownPad(message: string): void {
  console.info('[Plantasia MIDI] Unknown pad message:', message);
  patchMidiStore({ unknownPadLog: message });
}

export function refreshMappingCount(): void {
  patchMidiStore({ mappingCount: getMappingCount() });
}
