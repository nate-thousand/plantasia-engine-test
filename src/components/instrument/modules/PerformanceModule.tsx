import { useSyncExternalStore } from 'react';
import { InstrButton } from '../primitives/InstrButton';
import { InstrModuleColumn, WsZone } from '../primitives/InstrModuleColumn';
import { InstrSelect } from '../primitives/InstrSelect';
import { InstrMeter } from '../primitives/InstrMeter';
import type { UseInstrumentReturn } from '../../../hooks/useInstrument';
import { keyboardRangeLabel } from '../../../input/KeyboardInput';
import { MIDI_LEARN_TARGET_LABELS } from '../../../input/MidiDefaults';
import {
  getVisualEnergyStore,
  subscribeVisualEnergyStore,
} from '../../../stores/visualEnergyStore';

type PerformanceModuleProps = {
  instrument: UseInstrumentReturn;
};

function midiStatusLabel(midi: PerformanceModuleProps['instrument']['midi']): string {
  if (!midi.supported) {
    return 'Unsupported';
  }
  switch (midi.state) {
    case 'connected':
      return 'Connected';
    case 'pending':
      return 'Connecting';
    default:
      return 'Ready';
  }
}

export function PerformanceModule({ instrument }: PerformanceModuleProps) {
  const { midi, keyboard, presets } = instrument;
  const learn = midi.learnEnabled;
  const hasDevices = midi.devices.length > 0;
  const active = presets.items[presets.index];
  const range = keyboardRangeLabel(keyboard.octaveOffset);
  const visualEnergy = useSyncExternalStore(
    subscribeVisualEnergyStore,
    () => getVisualEnergyStore().visualEnergy,
    () => getVisualEnergyStore().visualEnergy,
  );

  return (
    <InstrModuleColumn index="04" title="Performance">
      <WsZone label="Visual Energy">
        <InstrMeter label="Energy" value={Math.round(visualEnergy * 100)} />
      </WsZone>

      <WsZone label="MIDI">
        <div className="ws-action-row">
          <span className="instr-label">{midiStatusLabel(midi)}</span>
          <InstrButton disabled={!midi.supported} onClick={midi.onConnect}>
            Connect
          </InstrButton>
          <InstrButton active={midi.learnEnabled} onClick={midi.onToggleLearn}>
            {midi.learnEnabled ? 'Learn On' : 'Learn'}
          </InstrButton>
        </div>
        <InstrSelect
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
        </InstrSelect>
        {learn && midi.learnTarget ? (
          <span className="instr-hint">
            Learn: {MIDI_LEARN_TARGET_LABELS[midi.learnTarget]}
          </span>
        ) : learn ? (
          <span className="instr-hint">Click a control to map</span>
        ) : null}
      </WsZone>

      <WsZone label="Keyboard">
        <div className="ws-action-row">
          <span className="instr-label">
            {keyboard.enabled ? `Active · ${range}` : 'Off'}
          </span>
          <InstrButton active={keyboard.holdEnabled} onClick={keyboard.onToggleHold}>
            {keyboard.holdEnabled ? 'Hold On' : 'Hold Off'}
          </InstrButton>
        </div>
        <span className="instr-hint">A–K · Z/X octave · Space ambient</span>
      </WsZone>

      <WsZone label="Touch">
        <span className="instr-hint">Pointer activity drives visual energy on stage.</span>
      </WsZone>

      <WsZone label="Preset">
        {active?.description ? (
          <p className="instr-hint">{active.description}</p>
        ) : null}
        {active?.tags?.length ? (
          <span className="instr-hint">{active.tags.join(' · ')}</span>
        ) : null}
        <InstrButton
          disabled={presets.items.length === 0}
          active={learn && midi.learnTarget === 'presetRandom'}
          onClick={
            learn
              ? () => midi.onSelectLearnTarget('presetRandom')
              : (event) => presets.onRandom(event.shiftKey)
          }
        >
          Random
        </InstrButton>
      </WsZone>
    </InstrModuleColumn>
  );
}
