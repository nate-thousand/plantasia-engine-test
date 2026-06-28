import { useSyncExternalStore } from 'react';
import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { MIDI_LEARN_TARGET_LABELS, type MidiControlTarget } from '../../input/MidiDefaults';
import { getMidiStore, subscribeMidiStore } from '../../stores/midiStore';

type PresetMidiControlsProps = {
  presets: UseInstrumentReturn['presets'];
  midi: UseInstrumentReturn['midi'];
  audioReady: boolean;
};

function midiStatusLabel(midi: PresetMidiControlsProps['midi']): string {
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

const ACTION_LEARN_TARGETS: MidiControlTarget[] = ['play', 'stop', 'hold'];

export function PresetMidiControls({ presets, midi, audioReady }: PresetMidiControlsProps) {
  const midiStore = useSyncExternalStore(subscribeMidiStore, getMidiStore, getMidiStore);
  const hasDevices = midi.devices.length > 0;
  const detectedCcList = Object.keys(midi.detectedCcs)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(-4);

  return (
    <ControlGroup
      label="Preset / MIDI"
      className="control-group--compact control-group--preset-midi"
      bodyClassName="control-group__body--stack"
    >
      <div className="control-subsection">
        <span className="control-subsection__label">Preset</span>
        <select
          className="control-select control-select--wide"
          value={presets.index}
          disabled={!audioReady || presets.items.length === 0}
          onChange={(event) => presets.onSelect(Number(event.target.value))}
          aria-label="Preset selector"
        >
          {presets.items.length === 0 ? (
            <option value={0}>—</option>
          ) : (
            presets.items.map((preset, index) => (
              <option key={preset.id} value={index}>
                {preset.name}
              </option>
            ))
          )}
        </select>
        <div className="control-group__inline">
          <ControlButton
            label="Prev"
            disabled={!audioReady}
            active={midi.learnEnabled && midi.learnTarget === 'presetPrevious'}
            onClick={
              midi.learnEnabled
                ? () => midi.onSelectLearnTarget('presetPrevious')
                : presets.onPrevious
            }
          />
          <ControlButton
            label="Next"
            disabled={!audioReady}
            active={midi.learnEnabled && midi.learnTarget === 'presetNext'}
            onClick={
              midi.learnEnabled ? () => midi.onSelectLearnTarget('presetNext') : presets.onNext
            }
          />
          <ControlButton
            label="Random"
            disabled={!audioReady}
            active={midi.learnEnabled && midi.learnTarget === 'presetRandom'}
            onClick={
              midi.learnEnabled
                ? () => midi.onSelectLearnTarget('presetRandom')
                : presets.onRandom
            }
          />
        </div>
      </div>

      <div className="control-subsection">
        <span className="control-subsection__label">MIDI</span>
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
        {midiStore.isMpkMini ? (
          <span className="control-midi-meta">MPK Mini profile active</span>
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
      </div>
    </ControlGroup>
  );
}
