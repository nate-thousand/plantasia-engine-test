import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type MidiControlsProps = {
  midi: UseInstrumentReturn['midi'];
};

export function MidiControls({ midi }: MidiControlsProps) {
  return (
    <ControlGroup label="MIDI">
      <span className="control-indicator">{midi.state === 'off' ? 'Off' : midi.state}</span>
      <ControlButton
        label={midi.learnEnabled ? 'Learn On' : 'MIDI Learn'}
        placeholder
        active={midi.learnEnabled}
        onClick={midi.onToggleLearn}
      />
      <select className="control-select control-select--placeholder" disabled aria-label="MIDI device">
        <option>None</option>
      </select>
    </ControlGroup>
  );
}
