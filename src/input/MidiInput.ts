import type { MidiDeviceInfo } from '../stores/engineStore';
import { patchEngineStore, pulseMidiActivity } from '../stores/engineStore';

export type MidiInputHandlers = {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff: (midi: number) => void;
};

type WebMidiInputPort = globalThis.MIDIInput;

function isWebMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

function toDeviceInfo(input: WebMidiInputPort): MidiDeviceInfo {
  return {
    id: input.id,
    name: input.name || 'Unknown device',
  };
}

function listInputPorts(access: MIDIAccess): WebMidiInputPort[] {
  const ports: WebMidiInputPort[] = [];
  access.inputs.forEach((input) => {
    ports.push(input);
  });
  return ports;
}

function findInputPort(access: MIDIAccess, deviceId: string): WebMidiInputPort | undefined {
  let match: WebMidiInputPort | undefined;
  access.inputs.forEach((input) => {
    if (input.id === deviceId) {
      match = input;
    }
  });
  return match;
}

export class MidiInputManager {
  private access: MIDIAccess | null = null;
  private selectedInput: WebMidiInputPort | null = null;
  private handlers: MidiInputHandlers;

  constructor(handlers: MidiInputHandlers) {
    this.handlers = handlers;
  }

  static isSupported(): boolean {
    return isWebMidiSupported();
  }

  async connect(): Promise<void> {
    if (!isWebMidiSupported()) {
      throw new Error('Web MIDI is not supported in this browser.');
    }

    patchEngineStore({ midiState: 'pending' });

    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this.access.onstatechange = () => {
      this.refreshDevices();
    };

    this.refreshDevices();

    const devices = listInputPorts(this.access);
    if (devices.length === 0) {
      patchEngineStore({ midiState: 'off' });
      return;
    }

    patchEngineStore({ midiState: 'connected' });

    const currentId = this.selectedInput?.id;
    if (currentId && findInputPort(this.access, currentId)) {
      this.selectDevice(currentId);
      return;
    }

    this.selectDevice(devices[0].id);
  }

  refreshDevices(): void {
    if (!this.access) {
      patchEngineStore({ midiDevices: [] });
      return;
    }

    const devices = listInputPorts(this.access).map(toDeviceInfo);
    patchEngineStore({ midiDevices: devices });

    if (this.selectedInput && !findInputPort(this.access, this.selectedInput.id)) {
      this.detachCurrentInput();
      patchEngineStore({
        selectedDeviceId: null,
        selectedDeviceName: null,
        midiState: devices.length > 0 ? 'connected' : 'off',
      });
    }
  }

  selectDevice(deviceId: string | null): void {
    this.detachCurrentInput();

    if (!this.access || !deviceId) {
      patchEngineStore({
        selectedDeviceId: null,
        selectedDeviceName: null,
      });
      return;
    }

    const input = findInputPort(this.access, deviceId);
    if (!input) {
      return;
    }

    this.selectedInput = input;
    input.onmidimessage = this.handleMessage;

    patchEngineStore({
      selectedDeviceId: deviceId,
      selectedDeviceName: input.name || 'Unknown device',
      midiState: 'connected',
    });
  }

  disconnect(): void {
    this.detachCurrentInput();
    this.access = null;
    patchEngineStore({
      midiState: 'off',
      midiDevices: [],
      selectedDeviceId: null,
      selectedDeviceName: null,
    });
  }

  private detachCurrentInput(): void {
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
      this.selectedInput = null;
    }
  }

  private handleMessage = (event: MIDIMessageEvent): void => {
    const data = event.data;
    if (!data || data.length < 2) {
      return;
    }

    pulseMidiActivity();

    const status = data[0];
    const note = data[1];
    const velocity = data.length > 2 ? data[2] : 0;
    const command = status & 0xf0;

    if (command === 0x90) {
      if (velocity === 0) {
        this.handlers.onNoteOff(note);
      } else {
        this.handlers.onNoteOn(note, velocity);
      }
      return;
    }

    if (command === 0x80) {
      this.handlers.onNoteOff(note);
    }
  };
}

/** Alias matching the architecture doc filename. */
export { MidiInputManager as MidiInput };
