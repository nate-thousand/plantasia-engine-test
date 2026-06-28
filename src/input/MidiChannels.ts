/** MIDI channel index (0–15) for MPK Mini factory pad bank — channel 10. */
export const MPK_PAD_CHANNEL = 9;

/** Keyboard / synth voice channel (channel 1). */
export const MPK_KEY_CHANNEL = 0;

/** True when note messages should be treated as pad/transport (not musical keys). */
export function isPadMidiChannel(channel: number): boolean {
  return channel === MPK_PAD_CHANNEL;
}

/** CC numbers assigned to MPK Mini knobs 1–8 in factory default. */
export const MPK_KNOB_CC_MIN = 1;
export const MPK_KNOB_CC_MAX = 8;

export function isMpkKnobCc(cc: number): boolean {
  return cc >= MPK_KNOB_CC_MIN && cc <= MPK_KNOB_CC_MAX;
}

/** CC range for pad bank A/B in CC mode — never overlaps knob CCs. */
export const MPK_PAD_CC_MIN = 20;
export const MPK_PAD_CC_MAX = 35;

export function isMpkPadCc(cc: number): boolean {
  return cc >= MPK_PAD_CC_MIN && cc <= MPK_PAD_CC_MAX;
}

/** Joystick Y axis often sends CC 1 on MPK — same as knob 1; documented hardware overlap. */
export const MPK_MOD_WHEEL_CC = 1;
