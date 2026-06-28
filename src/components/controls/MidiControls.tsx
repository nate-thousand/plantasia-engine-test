import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type MidiControlsProps = {
  midi: UseInstrumentReturn['midi'];
  audioReady: boolean;
};

function midiStatusLabel(midi: MidiControlsProps['midi']): string {
  if (!midi.supported) {
    return '—';
  }

  switch (midi.state) {
    case 'connected':
      return 'On';
    case 'pending':
      return '…';
    default:
      return 'Off';
  }
}

export function MidiControls({ midi, audioReady }: MidiControlsProps) {
  const hasDevices = midi.devices.length > 0;

  return (
    <ControlGroup label="MIDI" className="control-group--compact" bodyClassName="control-group__body--stack">
      <div className="control-group__inline">
        <span className="control-indicator">{midiStatusLabel(midi)}</span>
        <ControlButton
          label="Connect"
          disabled={!audioReady || !midi.supported}
          onClick={midi.onConnect}
        />
        <ControlButton
          label={midi.learnEnabled ? 'Learn On' : 'Learn'}
          disabled={!audioReady}
          active={midi.learnEnabled}
          placeholder
          onClick={midi.onToggleLearn}
        />
      </div>
      <select
        className={`control-select control-select--wide${hasDevices ? '' : ' control-select--placeholder'}`}
        disabled={!audioReady || !hasDevices}
        aria-label="MIDI device"
        value={midi.selectedDeviceId ?? ''}
        onChange={(event) => midi.onSelectDevice(event.target.value)}
      >
        {!hasDevices ? (
          <option value="">—</option>
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
