import { useSyncExternalStore } from 'react';
import { formatCategoryLabel } from '../../presets/categories';
import { getPresetStore, subscribePresetStore } from '../../stores/presetStore';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import {
  startTransportAudio,
  transportPlay,
  transportPresetNext,
  transportPresetPrevious,
  transportSelectPreset,
  transportStop,
} from '../../transport/transportActions';
import { transportStateLabel, useTransport } from '../../transport/useTransport';

type UnifiedTransportProps = {
  instrument: UseInstrumentReturn;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

function TransportIconButton({
  label,
  title,
  disabled,
  active,
  primary,
  onClick,
}: {
  label: string;
  title: string;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`unified-transport__btn${active ? ' unified-transport__btn--active' : ''}${primary ? ' unified-transport__btn--primary' : ''}`}
      disabled={disabled}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** Single playback transport — play/stop, preset, menu. Always visible. */
export function UnifiedTransport({ instrument, menuOpen, onMenuToggle }: UnifiedTransportProps) {
  const transport = useTransport();
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);
  const { midi, presets } = instrument;
  const learn = midi.learnEnabled;
  const midiConnected = instrument.status.midiIndicator.includes('●');

  const handlePlay = () => {
    if (learn) {
      midi.onSelectLearnTarget('play');
      return;
    }
    if (transport.transportState === 'idle') {
      void startTransportAudio().then(() => void transportPlay('ui'));
      return;
    }
    if (transport.isPlaying) {
      return;
    }
    void transportPlay('ui');
  };

  const handleStop = () => {
    if (learn) {
      midi.onSelectLearnTarget('stop');
      return;
    }
    transportStop('ui');
  };

  const presetName =
    presetStore.activeMetadata?.name ??
    presets.items[presetStore.activeIndex]?.name ??
    '—';

  const groups =
    presetStore.groups.length > 0
      ? presetStore.groups
      : [
          {
            id: 'all',
            label: 'Presets',
            presets: presets.items.map((item, index) => ({
              index,
              preset: { id: item.id, name: item.name },
              metadata: { id: item.id, name: item.name },
            })),
          },
        ];

  return (
    <div
      className="unified-transport"
      data-transport-state={transport.transportState}
      data-midi-connected={midiConnected ? 'true' : 'false'}
      aria-label="Playback transport"
    >
      <div className="unified-transport__playback">
        <TransportIconButton
          label={transport.isInitializing ? '…' : '▶'}
          title={
            transport.transportState === 'idle'
              ? 'Start audio and play (Space)'
              : transport.isPlaying
                ? 'Playing'
                : 'Play (Space)'
          }
          disabled={transport.isInitializing}
          active={transport.isPlaying}
          primary
          onClick={handlePlay}
        />
        <TransportIconButton
          label="■"
          title="Stop (Space toggles play/stop)"
          disabled={!transport.audioReady}
          active={learn && midi.learnTarget === 'stop'}
          onClick={handleStop}
        />
      </div>

      <div className="unified-transport__preset">
        <TransportIconButton
          label="◀"
          title="Previous preset"
          disabled={!transport.audioReady || presets.items.length === 0}
          active={learn && midi.learnTarget === 'presetPrevious'}
          onClick={
            learn
              ? () => midi.onSelectLearnTarget('presetPrevious')
              : () => transportPresetPrevious()
          }
        />
        <select
          className="unified-transport__select"
          value={presetStore.activeIndex}
          disabled={!transport.audioReady || presets.items.length === 0}
          aria-label={`Preset: ${presetName}`}
          onChange={(event) => void transportSelectPreset(Number(event.target.value))}
        >
          {presets.items.length === 0 ? (
            <option value={0}>—</option>
          ) : groups.length > 1 ? (
            groups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.presets.map((entry) => (
                  <option key={entry.preset.id} value={entry.index}>
                    {entry.metadata.name}
                  </option>
                ))}
              </optgroup>
            ))
          ) : (
            presets.items.map((preset, index) => (
              <option key={preset.id} value={index}>
                {preset.name}
              </option>
            ))
          )}
        </select>
        <TransportIconButton
          label="▶"
          title="Next preset"
          disabled={!transport.audioReady || presets.items.length === 0}
          active={learn && midi.learnTarget === 'presetNext'}
          onClick={
            learn ? () => midi.onSelectLearnTarget('presetNext') : () => transportPresetNext()
          }
        />
      </div>

      <div className="unified-transport__status" aria-live="polite">
        <span className="unified-transport__state">
          {transportStateLabel(transport.transportState, midiConnected)}
        </span>
        {presetStore.activeMetadata?.category ? (
          <span className="unified-transport__meta">
            {formatCategoryLabel(presetStore.activeMetadata.category)}
          </span>
        ) : null}
      </div>

      <TransportIconButton
        label={menuOpen ? 'close' : 'menu'}
        title={menuOpen ? 'Close settings' : 'Open settings'}
        active={menuOpen}
        onClick={onMenuToggle}
      />
    </div>
  );
}
