import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type KeyboardControlsProps = {
  keyboard: UseInstrumentReturn['keyboard'];
  audioReady: boolean;
};

export function KeyboardControls({ keyboard, audioReady }: KeyboardControlsProps) {
  return (
    <ControlGroup label="Keyboard">
      <span className="control-indicator">
        {audioReady ? (keyboard.enabled ? 'Enabled' : 'Off') : '—'}
      </span>
    </ControlGroup>
  );
}
