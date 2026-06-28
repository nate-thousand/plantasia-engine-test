export type ParsedMidiMessage =
  | { type: 'noteOn'; channel: number; note: number; velocity: number }
  | { type: 'noteOff'; channel: number; note: number }
  | { type: 'controlChange'; channel: number; controller: number; value: number }
  | { type: 'programChange'; channel: number; program: number }
  | { type: 'pitchBend'; channel: number; value: number }
  | { type: 'channelPressure'; channel: number; pressure: number }
  | { type: 'unknown'; status: number; data: number[] };

/** Normalize 14-bit pitch bend to -1..1. */
export function pitchBendNormalized(value: number): number {
  return Math.max(-1, Math.min(1, value / 8192));
}

export function parseMidiMessage(data: Uint8Array | number[]): ParsedMidiMessage | null {
  if (!data || data.length < 1) {
    return null;
  }

  const status = data[0];
  const command = status & 0xf0;
  const channel = status & 0x0f;

  if (command === 0x90 && data.length >= 3) {
    const note = data[1];
    const velocity = data[2];
    if (velocity === 0) {
      return { type: 'noteOff', channel, note };
    }
    return { type: 'noteOn', channel, note, velocity };
  }

  if (command === 0x80 && data.length >= 2) {
    return { type: 'noteOff', channel, note: data[1] };
  }

  if (command === 0xb0 && data.length >= 3) {
    return { type: 'controlChange', channel, controller: data[1], value: data[2] };
  }

  if (command === 0xc0 && data.length >= 2) {
    return { type: 'programChange', channel, program: data[1] };
  }

  if (command === 0xe0 && data.length >= 3) {
    const value = data[1] | (data[2] << 7);
    return { type: 'pitchBend', channel, value };
  }

  if (command === 0xd0 && data.length >= 2) {
    return { type: 'channelPressure', channel, pressure: data[1] };
  }

  return { type: 'unknown', status, data: Array.from(data) };
}

export function formatMidiMessage(message: ParsedMidiMessage): string {
  switch (message.type) {
    case 'noteOn':
      return `Note On ${message.note} v${message.velocity}`;
    case 'noteOff':
      return `Note Off ${message.note}`;
    case 'controlChange':
      return `CC ${message.controller} = ${message.value}`;
    case 'programChange':
      return `Program ${message.program}`;
    case 'pitchBend':
      return `Pitch ${pitchBendNormalized(message.value).toFixed(2)}`;
    case 'channelPressure':
      return `Pressure ${message.pressure}`;
    case 'unknown':
      return `MIDI ${message.status.toString(16)}`;
    default:
      return 'MIDI';
  }
}
