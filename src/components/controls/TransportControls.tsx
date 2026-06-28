import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type TransportControlsProps = {
  transport: UseInstrumentReturn['transport'];
};

export function TransportControls({ transport }: TransportControlsProps) {
  return (
    <ControlGroup label="Transport" className="control-group--compact">
      <ControlButton
        label={transport.isInitializing ? 'Starting…' : 'Start Audio'}
        disabled={transport.audioReady || transport.isInitializing}
        onClick={transport.onStartAudio}
      />
      <ControlButton
        label="Play Note"
        disabled={!transport.audioReady}
        onClick={transport.onPlay}
      />
      <ControlButton
        label="Stop Note"
        disabled={!transport.audioReady}
        onClick={transport.onStop}
      />
      <ControlButton
        label={transport.holdEnabled ? 'Hold On' : 'Hold'}
        disabled={!transport.audioReady}
        active={transport.holdEnabled}
        placeholder
        onClick={transport.onToggleHold}
      />
    </ControlGroup>
  );
}
