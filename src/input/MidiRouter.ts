import { engineAdapter } from '../audio/EngineAdapter';
import {
  applyTemporaryBoost,
  applyMidiTargetValue,
} from '../stores/controlStore';
import { pulseMidiActivity } from '../stores/engineStore';
import {
  logUnknownPad,
  patchMidiStore,
  pulseInteractionBurst,
  recordCcDetection,
  recordMidiMessage,
  setChannelPressure,
  setMpkMiniActive,
  setPitchBend,
  triggerMidiVisualEffect,
} from '../stores/midiStore';
import { transportNoteOff, transportNoteOn } from '../transport/transportActions';
import { getHoldEnabled } from '../transport/transportStore';
import {
  isActionTarget,
  isSliderTarget,
  isMpkMiniDevice,
  midiValueToSlider,
  type MidiControlTarget,
  type MidiPadAction,
} from './MidiDefaults';
import { resolveCcTarget, reloadControlMap } from './MidiControlMap';
import { handleLearnCc } from './MidiLearn';
import { formatMidiMessage, pitchBendNormalized, type ParsedMidiMessage } from './MidiMessageParser';
import { isPadMidiChannel, isMpkPadCc } from './MidiChannels';
import {
  MIDI_ALL_NOTES_OFF_CC,
  MPK_SUSTAIN_PEDAL_CC,
  resolveMpkPadCcAction,
  resolveMpkPadNoteAction,
} from './MpkMiniProfile';
import { loadMidiMappings } from './MidiStorage';
import {
  padActionBoostAmount,
  padActionControlKey,
  padActionToEffectKind,
} from '../visualization/ThemeMidiEffects';

export type MidiActionHandlers = {
  onPlay: () => void;
  onStop: () => void;
  onToggleHold: () => void;
  onSetHold: (enabled: boolean) => void;
  onPresetPrevious: () => void;
  onPresetNext: () => void;
  onPresetRandom: () => void;
  onProgramChange: (program: number) => void;
};

let actionHandlers: MidiActionHandlers | null = null;
let lastPitchEffectAt = 0;
let sustainPedalDown = false;

export function registerMidiActionHandlers(handlers: MidiActionHandlers | null): void {
  actionHandlers = handlers;
}

export function initMidiPipeline(): void {
  reloadControlMap();
  patchMidiStore({ mappingCount: loadMidiMappings().mappings.length });
}

function executePadAction(action: MidiPadAction, velocity: number): void {
  const handlers = actionHandlers;
  if (!handlers) {
    return;
  }

  const effectKind = padActionToEffectKind(action);
  triggerMidiVisualEffect(effectKind, velocity, action);

  const controlKey = padActionControlKey(action);
  if (controlKey) {
    applyTemporaryBoost(controlKey, padActionBoostAmount(action, velocity));
  }

  switch (action) {
    case 'play':
      handlers.onPlay();
      pulseInteractionBurst(Math.round((velocity / 127) * 30));
      break;
    case 'stop':
      handlers.onStop();
      break;
    case 'presetPrevious':
      handlers.onPresetPrevious();
      pulseInteractionBurst(15);
      break;
    case 'presetNext':
      handlers.onPresetNext();
      pulseInteractionBurst(15);
      break;
    case 'presetRandom':
      handlers.onPresetRandom();
      pulseInteractionBurst(20);
      break;
    case 'hold':
      handlers.onToggleHold();
      pulseInteractionBurst(10);
      break;
    case 'energyBurst':
      applyTemporaryBoost('energy', Math.round(20 + (velocity / 127) * 35));
      pulseInteractionBurst(Math.round((velocity / 127) * 40));
      break;
    case 'mutationBurst':
      applyTemporaryBoost('mutation', Math.round(15 + (velocity / 127) * 30));
      pulseInteractionBurst(Math.round((velocity / 127) * 35));
      break;
    case 'bloomBurst':
    case 'toneBurst':
    case 'textureBurst':
    case 'growthBurst':
    case 'driftBurst':
    case 'moldBoost':
    case 'reverbBurst':
    case 'chorusBurst':
      pulseInteractionBurst(Math.round((velocity / 127) * 35));
      break;
    default:
      break;
  }
}

function executeActionTarget(target: MidiControlTarget, velocity = 127): void {
  const handlers = actionHandlers;
  if (!handlers || isSliderTarget(target)) {
    return;
  }

  switch (target) {
    case 'play':
      handlers.onPlay();
      triggerMidiVisualEffect('play', velocity);
      pulseInteractionBurst(Math.round((velocity / 127) * 25));
      break;
    case 'stop':
      handlers.onStop();
      triggerMidiVisualEffect('stop', velocity);
      break;
    case 'hold':
      handlers.onToggleHold();
      break;
    case 'presetPrevious':
      handlers.onPresetPrevious();
      triggerMidiVisualEffect('presetChange', velocity, 'previous');
      pulseInteractionBurst(12);
      break;
    case 'presetNext':
      handlers.onPresetNext();
      triggerMidiVisualEffect('presetChange', velocity, 'next');
      pulseInteractionBurst(12);
      break;
    case 'presetRandom':
      handlers.onPresetRandom();
      triggerMidiVisualEffect('presetChange', velocity, 'random');
      pulseInteractionBurst(18);
      break;
    default:
      break;
  }
}

function handleNoteOn(
  note: number,
  velocity: number,
  channel: number,
  _deviceName: string | null,
): void {
  const padAction = resolveMpkPadNoteAction(note, channel);
  if (padAction) {
    executePadAction(padAction, velocity);
    recordMidiMessage(`Pad ch${channel + 1} ${note} → ${padAction}`);
    return;
  }

  try {
    transportNoteOn(note, velocity, 'midi');
    recordMidiMessage(`Note ch${channel + 1} ${note} v${velocity}`);
  } catch (error) {
    console.error('[Plantasia MIDI] Note on failed:', error);
  }
}

function handleNoteOff(note: number, channel: number): void {
  if (resolveMpkPadNoteAction(note, channel)) {
    return;
  }

  if (getHoldEnabled()) {
    return;
  }

  transportNoteOff(note);
  recordMidiMessage(`Note Off ch${channel + 1} ${note}`);
}

function handleControlChange(
  controller: number,
  value: number,
  channel: number,
  deviceName: string | null,
): void {
  recordCcDetection(controller, value);
  recordMidiMessage(`CC ${controller} = ${value}`);

  if (handleLearnCc(controller, deviceName, channel)) {
    recordMidiMessage(`Learned CC ${controller}`);
    return;
  }

  if (controller === MPK_SUSTAIN_PEDAL_CC) {
    const pressed = value >= 64;
    if (pressed !== sustainPedalDown) {
      sustainPedalDown = pressed;
      actionHandlers?.onSetHold(pressed);
      if (pressed) {
        triggerMidiVisualEffect('padHit', value, 'sustain');
      }
    }
    return;
  }

  if (controller === MIDI_ALL_NOTES_OFF_CC && value === 0) {
    actionHandlers?.onStop();
    triggerMidiVisualEffect('stop', 127);
    return;
  }

  if (isMpkMiniDevice(deviceName) && isMpkPadCc(controller)) {
    const padCc = resolveMpkPadCcAction(controller);
    if (padCc && value > 64) {
      executePadAction(padCc, value);
      return;
    }
  }

  const target = resolveCcTarget(controller, deviceName, channel);
  if (!target) {
    return;
  }

  if (isSliderTarget(target)) {
    applyMidiTargetValue(target, midiValueToSlider(value));
    triggerMidiVisualEffect('knobTwist', value, target);
    return;
  }

  if (isActionTarget(target) && value > 64) {
    executeActionTarget(target, value);
  }
}

function handlePitchBend(value: number): void {
  const normalized = pitchBendNormalized(value);
  setPitchBend(normalized);
  recordMidiMessage(`Pitch ${normalized.toFixed(2)}`);
  engineAdapter.applyPitchBend(normalized);

  const now = performance.now();
  if (Math.abs(normalized) > 0.08 && now - lastPitchEffectAt > 80) {
    lastPitchEffectAt = now;
    triggerMidiVisualEffect('pitchBend', Math.round(Math.abs(normalized) * 127));
  }
}

function handleChannelPressure(pressure: number, channel: number): void {
  if (!isPadMidiChannel(channel)) {
    return;
  }

  setChannelPressure(pressure);
  recordMidiMessage(`Pressure ${pressure}`);
  engineAdapter.applyChannelPressure(pressure);
  if (pressure > 20) {
    triggerMidiVisualEffect('padHit', pressure, 'aftertouch');
    pulseInteractionBurst(Math.round((pressure / 127) * 25));
  }
}

function handleProgramChange(program: number, channel: number, deviceName: string | null): void {
  recordMidiMessage(`Program ${program} ch${channel + 1}`);

  if (isMpkMiniDevice(deviceName) && !isPadMidiChannel(channel)) {
    return;
  }

  actionHandlers?.onProgramChange(program);
  triggerMidiVisualEffect('presetChange', 100, `program-${program}`);
  pulseInteractionBurst(10);
}

/** Route a parsed MIDI message through the full control pipeline. */
export function routeMidiMessage(
  message: ParsedMidiMessage,
  deviceName: string | null,
): void {
  pulseMidiActivity();
  setMpkMiniActive(isMpkMiniDevice(deviceName));

  switch (message.type) {
    case 'noteOn':
      handleNoteOn(message.note, message.velocity, message.channel, deviceName);
      break;
    case 'noteOff':
      handleNoteOff(message.note, message.channel);
      break;
    case 'controlChange':
      handleControlChange(message.controller, message.value, message.channel, deviceName);
      break;
    case 'programChange':
      handleProgramChange(message.program, message.channel, deviceName);
      break;
    case 'pitchBend':
      handlePitchBend(message.value);
      break;
    case 'channelPressure':
      handleChannelPressure(message.pressure, message.channel);
      break;
    case 'unknown':
      logUnknownPad(formatMidiMessage(message));
      break;
    default:
      break;
  }
}

/** Keys on channel 1 must never trigger pad/preset actions (MPK overlap fix). */
export function resolveNoteRouting(note: number, channel: number): 'pad' | 'note' {
  return resolveMpkPadNoteAction(note, channel) ? 'pad' : 'note';
}
