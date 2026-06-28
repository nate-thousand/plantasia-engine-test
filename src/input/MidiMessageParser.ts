export type ParsedMidiMessage =
  | { type: 'noteOn'; channel: number; note: number; velocity: number }
  | { type: 'noteOff'; channel: number; note: number }
  | { type: 'controlChange'; channel: number; controller: number; value: number }
  | { type: 'programChange'; channel: number; program: number }
  | { type: 'unknown'; status: number; data: number[] };

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
    case 'unknown':
      return `MIDI ${message.status.toString(16)}`;
    default:
      return 'MIDI';
  }
}
