import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type TransportControlsProps = {
  transport: UseInstrumentReturn['transport'];
  midi: UseInstrumentReturn['midi'];
};

type TransportButtonProps = {
  label: string;
  title: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
};

function TransportButton({ label, title, disabled, active, onClick }: TransportButtonProps) {
  return (
    <button
      type="button"
      className={`transport-bar__btn${active ? ' transport-bar__btn--active' : ''}`}
      disabled={disabled}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** Vertical transport bar — power, play, stop, hold. */
export function TransportControls({ transport, midi }: TransportControlsProps) {
  const learn = midi.learnEnabled;

  return (
    <nav className="transport-bar" aria-label="Transport">
      <TransportButton
        label={transport.isInitializing ? '…' : '⏻'}
        title={transport.isInitializing ? 'Starting audio' : 'Start audio engine'}
        disabled={transport.audioReady || transport.isInitializing}
        onClick={transport.onStartAudio}
      />
      <TransportButton
        label="▶"
        title="Play note"
        disabled={!transport.audioReady}
        active={learn && midi.learnTarget === 'play'}
        onClick={learn ? () => midi.onSelectLearnTarget('play') : transport.onPlay}
      />
      <TransportButton
        label="■"
        title="Stop note"
        disabled={!transport.audioReady}
        active={learn && midi.learnTarget === 'stop'}
        onClick={learn ? () => midi.onSelectLearnTarget('stop') : transport.onStop}
      />
      <TransportButton
        label="H"
        title={transport.holdEnabled ? 'Release hold' : 'Toggle hold'}
        disabled={!transport.audioReady}
        active={transport.holdEnabled || (learn && midi.learnTarget === 'hold')}
        onClick={learn ? () => midi.onSelectLearnTarget('hold') : transport.onToggleHold}
      />
    </nav>
  );
}
