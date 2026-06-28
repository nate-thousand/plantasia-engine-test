import type { MidiControlTarget, MidiPadAction } from './MidiDefaults';
import {
  DEFAULT_PAD_CC_ACTIONS,
  DEFAULT_PAD_NOTE_ACTIONS,
  isMpkMiniDevice,
  MPK_MINI_KNOB_CC_MAP,
} from './MidiDefaults';
import { isPadMidiChannel } from './MidiChannels';

/** Bank B pad note actions (factory MPK Mini MK3 — C2–G2). Pad channel only. */
export const MPK_MINI_BANK_B_PAD_ACTIONS: Record<number, MidiPadAction> = {
  36: 'bloomBurst',
  37: 'toneBurst',
  38: 'textureBurst',
  39: 'growthBurst',
  40: 'driftBurst',
  41: 'volumeBoost',
  42: 'reverbBurst',
  43: 'chorusBurst',
};

/** Bank B pad CC mode (CC 28–35). */
export const MPK_MINI_BANK_B_CC_ACTIONS: Record<number, MidiPadAction> = {
  28: 'bloomBurst',
  29: 'toneBurst',
  30: 'textureBurst',
  31: 'growthBurst',
  32: 'driftBurst',
  33: 'volumeBoost',
  34: 'reverbBurst',
  35: 'chorusBurst',
};

/** Sustain pedal → hold while pressed. */
export const MPK_SUSTAIN_PEDAL_CC = 64;

/** All-notes-off (common panic). */
export const MIDI_ALL_NOTES_OFF_CC = 123;

export const MPK_MINI_KNOB_CCS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * Resolve pad action from a note — only on drum/pad MIDI channel.
 * Keyboard notes on channel 1 always play music, never change presets.
 */
export function resolveMpkPadNoteAction(note: number, channel: number): MidiPadAction | null {
  if (!isPadMidiChannel(channel)) {
    return null;
  }
  return DEFAULT_PAD_NOTE_ACTIONS[note] ?? MPK_MINI_BANK_B_PAD_ACTIONS[note] ?? null;
}

export function resolveMpkPadCcAction(cc: number): MidiPadAction | null {
  return DEFAULT_PAD_CC_ACTIONS[cc] ?? MPK_MINI_BANK_B_CC_ACTIONS[cc] ?? null;
}

export function resolveMpkCcTarget(
  cc: number,
  deviceName: string | null,
): MidiControlTarget | null {
  if (!isMpkMiniDevice(deviceName)) {
    return null;
  }
  return MPK_MINI_KNOB_CC_MAP[cc] ?? null;
}

export function isMpkPadNote(note: number): boolean {
  return note in DEFAULT_PAD_NOTE_ACTIONS || note in MPK_MINI_BANK_B_PAD_ACTIONS;
}

export const MPK_MINI_CONTROL_SUMMARY = {
  keys: 'Channel 1 — Note On/Off only (never changes preset)',
  knobs: 'CC 1–8 → Volume, Tone, Texture, Bloom, Growth, Drift, Mutation, Energy',
  joystickX: 'Pitch Bend → pan drift + visual wind',
  joystickY: 'CC 1 (shared with Knob 1 on hardware)',
  padsBankA: 'Channel 10, Notes 48–55 → Transport & preset (pads only)',
  padsBankB: 'Channel 10, Notes 36–43 → FX bursts (pads only)',
  padsCcMode: 'CC 20–35 (pad CC mode, value > 64)',
  sustain: 'CC 64 → Hold while pressed',
  programChange: 'Channel 10 only → load preset by index',
} as const;
