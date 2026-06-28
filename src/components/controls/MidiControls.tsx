import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { MIDI_LEARN_TARGET_LABELS, type MidiControlTarget } from '../../input/MidiDefaults';

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

const ACTION_LEARN_TARGETS: MidiControlTarget[] = [
  'play',
  'stop',
  'hold',
  'presetPrevious',
  'presetNext',
  'presetRandom',
];

export function MidiControls({ midi, audioReady }: MidiControlsProps) {
  const hasDevices = midi.devices.length > 0;
  const detectedCcList = Object.keys(midi.detectedCcs)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(-4);

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
      {midi.lastMessage ? (
        <span className="control-midi-meta">{midi.lastMessage}</span>
      ) : null}
      {midi.lastCcNumber !== null ? (
        <span className="control-midi-meta">CC {midi.lastCcNumber}</span>
      ) : null}
      {detectedCcList.length > 0 ? (
        <span className="control-midi-meta">
          Detected: {detectedCcList.map((cc) => `CC${cc}`).join(' ')}
        </span>
      ) : null}
      {midi.mappingCount > 0 ? (
        <span className="control-midi-meta">{midi.mappingCount} learned</span>
      ) : null}
      {midi.learnEnabled ? (
        <div className="control-midi-learn">
          <span className="control-midi-meta">
            {midi.learnTarget
              ? `Target: ${MIDI_LEARN_TARGET_LABELS[midi.learnTarget]}`
              : 'Click a control label'}
          </span>
          <div className="control-midi-learn__actions">
            {ACTION_LEARN_TARGETS.map((target) => (
              <ControlButton
                key={target}
                label={MIDI_LEARN_TARGET_LABELS[target]}
                active={midi.learnTarget === target}
                disabled={!audioReady}
                onClick={() => midi.onSelectLearnTarget(target)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </ControlGroup>
  );
}
