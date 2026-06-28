import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { keyboardRangeLabel } from '../../input/KeyboardInput';

type KeyboardControlsProps = {
  keyboard: UseInstrumentReturn['keyboard'];
};

export function KeyboardControls({ keyboard }: KeyboardControlsProps) {
  const range = keyboardRangeLabel(keyboard.octaveOffset);

  return (
    <ControlGroup label="Keyboard" className="control-group--compact">
      <span className="control-indicator">
        {keyboard.enabled ? `Active · ${range}` : 'Off'}
      </span>
      <span className="control-hint">A–K row · Z/X octave · Space demo on/off</span>
      <div className="control-row">
        <ControlButton
          label={keyboard.holdEnabled ? 'Hold on' : 'Hold off'}
          active={keyboard.holdEnabled}
          onClick={keyboard.onToggleHold}
        />
      </div>
    </ControlGroup>
  );
}
