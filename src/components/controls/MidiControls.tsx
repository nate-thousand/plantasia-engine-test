import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type MidiControlsProps = {
  midi: UseInstrumentReturn['midi'];
};

function midiStatusLabel(midi: MidiControlsProps['midi']): string {
  if (!midi.supported) {
    return 'Unsupported';
  }

  switch (midi.state) {
    case 'connected':
      return 'Connected';
    case 'pending':
      return 'Connecting…';
    default:
      return midi.supported ? 'Ready' : 'Unsupported';
  }
}

/** MIDI device connect — plug and play; no learn UI in Release 1. */
export function MidiControls({ midi }: MidiControlsProps) {
  const hasDevices = midi.devices.length > 0;

  return (
    <ControlGroup
      label="MIDI"
      className="control-group--compact control-group--midi"
      bodyClassName="control-group__body--stack"
    >
      <div className="control-row control-row--between">
        <span className="control-indicator">{midiStatusLabel(midi)}</span>
        <ControlButton label="Connect" disabled={!midi.supported} onClick={midi.onConnect} />
      </div>

      <select
        className={`control-select control-select--wide${hasDevices ? '' : ' control-select--placeholder'}`}
        disabled={!hasDevices}
        aria-label="MIDI input device"
        value={midi.selectedDeviceId ?? ''}
        onChange={(event) => midi.onSelectDevice(event.target.value)}
      >
        {!hasDevices ? (
          <option value="">No devices</option>
        ) : (
          midi.devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))
        )}
      </select>
    </ControlGroup>
  );
}
