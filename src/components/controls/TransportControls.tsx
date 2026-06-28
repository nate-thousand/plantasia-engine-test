import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type TransportControlsProps = {
  transport: UseInstrumentReturn['transport'];
  midi: UseInstrumentReturn['midi'];
};

export function TransportControls({ transport, midi }: TransportControlsProps) {
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
        active={midi.learnEnabled && midi.learnTarget === 'play'}
        onClick={
          midi.learnEnabled
            ? () => midi.onSelectLearnTarget('play')
            : transport.onPlay
        }
      />
      <ControlButton
        label="Stop Note"
        disabled={!transport.audioReady}
        active={midi.learnEnabled && midi.learnTarget === 'stop'}
        onClick={
          midi.learnEnabled
            ? () => midi.onSelectLearnTarget('stop')
            : transport.onStop
        }
      />
      <ControlButton
        label={transport.holdEnabled ? 'Hold On' : 'Hold'}
        disabled={!transport.audioReady}
        active={transport.holdEnabled || (midi.learnEnabled && midi.learnTarget === 'hold')}
        onClick={
          midi.learnEnabled
            ? () => midi.onSelectLearnTarget('hold')
            : transport.onToggleHold
        }
      />
    </ControlGroup>
  );
}
