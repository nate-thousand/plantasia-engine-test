import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { MIDI_LEARN_TARGET_LABELS } from '../../input/MidiDefaults';

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
        <div className="control-row">
          <ControlButton
            label="Connect"
            disabled={!midi.supported}
            onClick={midi.onConnect}
          />
          <ControlButton
            label={midi.learnEnabled ? 'Learn ✓' : 'Learn'}
            active={midi.learnEnabled}
            onClick={midi.onToggleLearn}
          />
        </div>
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

      {midi.learnEnabled ? (
        <span className="control-hint">
          {midi.learnTarget
            ? `Learn: ${MIDI_LEARN_TARGET_LABELS[midi.learnTarget]}`
            : 'Click a control to map'}
        </span>
      ) : null}

      {Object.keys(midi.detectedCcs).length > 0 ? (
        <span className="control-hint">
          Detected:{' '}
          {Object.entries(midi.detectedCcs)
            .slice(-6)
            .map(([cc, value]) => `CC${cc}=${value}`)
            .join(' · ')}
        </span>
      ) : null}
    </ControlGroup>
  );
}
