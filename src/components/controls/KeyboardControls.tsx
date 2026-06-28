import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { keyboardRangeLabel } from '../../input/KeyboardInput';

type KeyboardControlsProps = {
  keyboard: UseInstrumentReturn['keyboard'];
  audioReady: boolean;
};

export function KeyboardControls({ keyboard, audioReady }: KeyboardControlsProps) {
  const range = keyboardRangeLabel(keyboard.octaveOffset);

  return (
    <ControlGroup label="Keyboard" className="control-group--compact">
      <span className="control-indicator">
        {audioReady ? (keyboard.enabled ? `Active · ${range}` : 'Off') : '—'}
      </span>
      <span className="control-hint">A–K row · Z/X octave · vel 100</span>
    </ControlGroup>
  );
}
