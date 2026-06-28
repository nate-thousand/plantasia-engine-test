import { engineAdapter } from '../audio/EngineAdapter';
import {
  applyTemporaryBoost,
  applyMidiTargetValue,
} from '../stores/controlStore';
import { registerNoteOff, registerNoteOn, pulseMidiActivity } from '../stores/engineStore';
import {
  logUnknownPad,
  patchMidiStore,
  pulseInteractionBurst,
  recordCcDetection,
  recordMidiMessage,
} from '../stores/midiStore';
import {
  DEFAULT_PAD_CC_ACTIONS,
  DEFAULT_PAD_NOTE_ACTIONS,
  isActionTarget,
  isSliderTarget,
  midiValueToSlider,
  type MidiControlTarget,
  type MidiPadAction,
} from './MidiDefaults';
import { resolveCcTarget, reloadControlMap } from './MidiControlMap';
import { handleLearnCc } from './MidiLearn';
import { formatMidiMessage, type ParsedMidiMessage } from './MidiMessageParser';
import { loadMidiMappings } from './MidiStorage';

export type MidiActionHandlers = {
  onPlay: () => void;
  onStop: () => void;
  onToggleHold: () => void;
  onPresetPrevious: () => void;
  onPresetNext: () => void;
  onPresetRandom: () => void;
  onProgramChange: (program: number) => void;
};

let actionHandlers: MidiActionHandlers | null = null;

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
      pulseInteractionBurst(Math.round((velocity / 127) * 25));
      break;
    case 'stop':
      handlers.onStop();
      break;
    case 'hold':
      handlers.onToggleHold();
      break;
    case 'presetPrevious':
      handlers.onPresetPrevious();
      pulseInteractionBurst(12);
      break;
    case 'presetNext':
      handlers.onPresetNext();
      pulseInteractionBurst(12);
      break;
    case 'presetRandom':
      handlers.onPresetRandom();
      pulseInteractionBurst(18);
      break;
    default:
      break;
  }
}

function resolvePadAction(note: number): MidiPadAction | null {
  return DEFAULT_PAD_NOTE_ACTIONS[note] ?? null;
}

function resolvePadCcAction(cc: number): MidiPadAction | null {
  return DEFAULT_PAD_CC_ACTIONS[cc] ?? null;
}

function handleNoteOn(note: number, velocity: number): void {
  const padAction = resolvePadAction(note);
  if (padAction) {
    executePadAction(padAction, velocity);
    recordMidiMessage(`Pad ${note} → ${padAction}`);
    return;
  }

  if (!engineAdapter.isAudioRunning()) {
    return;
  }

  try {
    engineAdapter.noteOn(note, velocity);
    registerNoteOn(note, velocity);
    recordMidiMessage(`Note On ${note} v${velocity}`);
  } catch (error) {
    console.error('[Plantasia MIDI] Note on failed:', error);
  }
}

function handleNoteOff(note: number): void {
  const padAction = resolvePadAction(note);
  if (padAction) {
    return;
  }

  engineAdapter.noteOff(note);
  registerNoteOff(note);
  recordMidiMessage(`Note Off ${note}`);
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

  const padCc = resolvePadCcAction(controller);
  if (padCc && value > 64) {
    executePadAction(padCc, value);
    return;
  }

  const target = resolveCcTarget(controller, deviceName, channel);
  if (!target) {
    console.info('[Plantasia MIDI] Unmapped CC', { controller, value, deviceName });
    return;
  }

  if (isSliderTarget(target)) {
    applyMidiTargetValue(target, midiValueToSlider(value));
    return;
  }

  if (isActionTarget(target) && value > 64) {
    executeActionTarget(target, value);
  }
}

function handleProgramChange(program: number): void {
  recordMidiMessage(`Program ${program}`);
  actionHandlers?.onProgramChange(program);
  pulseInteractionBurst(10);
}

/** Route a parsed MIDI message through the full control pipeline. */
export function routeMidiMessage(
  message: ParsedMidiMessage,
  deviceName: string | null,
): void {
  pulseMidiActivity();

  switch (message.type) {
    case 'noteOn':
      handleNoteOn(message.note, message.velocity);
      break;
    case 'noteOff':
      handleNoteOff(message.note);
      break;
    case 'controlChange':
      handleControlChange(message.controller, message.value, message.channel, deviceName);
      break;
    case 'programChange':
      handleProgramChange(message.program);
      break;
    case 'unknown':
      logUnknownPad(formatMidiMessage(message));
      break;
    default:
      break;
  }
}
