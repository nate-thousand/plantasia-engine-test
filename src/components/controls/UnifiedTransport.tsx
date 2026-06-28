import { useSyncExternalStore } from 'react';
import { getPresetStore, subscribePresetStore } from '../../stores/presetStore';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import {
  transportPresetNext,
  transportPresetPrevious,
  transportSelectPreset,
  transportStartSession,
  transportStop,
} from '../../transport/transportActions';
import { beginInstrumentSession } from '../../transport/sessionStart';
import { transportStateLabel, useTransport } from '../../transport/useTransport';

type UnifiedTransportProps = {
  instrument: UseInstrumentReturn;
  menuOpen: boolean;
  sessionStarted: boolean;
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
export function UnifiedTransport({
  instrument,
  menuOpen,
  sessionStarted,
  onMenuToggle,
}: UnifiedTransportProps) {
  const transport = useTransport();
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);
  const { presets } = instrument;
  const midiConnected = instrument.status.midiIndicator.includes('●');

  const handleStartOrPlay = () => {
    if (transport.isInitializing) {
      return;
    }
    if (!sessionStarted) {
      beginInstrumentSession('ui');
      return;
    }
    if (transport.isPlaying) {
      return;
    }
    void transportStartSession('ui');
  };

  const handleStop = () => {
    transportStop('ui');
  };

  const presetName =
    presetStore.activeMetadata?.name ??
    presets.items[presetStore.activeIndex]?.name ??
    '—';

  const canSelectPreset = presets.items.length > 0;

  const groups =
    presetStore.groups.length > 0
      ? presetStore.groups
      : [
          {
            id: 'all',
            label: 'Worlds',
            presets: presets.items.map((item, index) => ({
              index,
              preset: { id: item.id, name: item.name },
              metadata: { id: item.id, name: item.name },
            })),
          },
        ];

  return (
    <div
      className={`unified-transport${sessionStarted ? '' : ' unified-transport--title'}`}
      data-transport-state={transport.transportState}
      data-midi-connected={midiConnected ? 'true' : 'false'}
      aria-label="Playback transport"
    >
      <div className="unified-transport__playback">
        <TransportIconButton
          label={transport.isInitializing ? '…' : sessionStarted && transport.isPlaying ? '▶' : '▶'}
          title={
            !sessionStarted
              ? 'Begin (Space)'
              : transport.isPlaying
                ? 'Ambient playing'
                : 'Start ambient soundscape (Space)'
          }
          disabled={transport.isInitializing}
          active={sessionStarted && transport.isPlaying}
          primary
          onClick={handleStartOrPlay}
        />
        {sessionStarted ? (
          <TransportIconButton
            label="■"
            title="Stop ambient soundscape (Space)"
            disabled={!transport.isPlaying}
            onClick={handleStop}
          />
        ) : null}
      </div>

      <div className="unified-transport__preset">
        <TransportIconButton
          label="◀"
          title="Previous preset"
          disabled={!canSelectPreset}
          onClick={() => transportPresetPrevious()}
        />
        <select
          className="unified-transport__select"
          value={presetStore.activeIndex}
          disabled={!canSelectPreset}
          aria-label={`Preset: ${presetName}`}
          onChange={(event) => void transportSelectPreset(Number(event.target.value))}
        >
          {presets.items.length === 0 ? (
            <option value={0}>Loading…</option>
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
          disabled={!canSelectPreset}
          onClick={() => transportPresetNext()}
        />
      </div>

      {sessionStarted ? (
        <div className="unified-transport__status" aria-live="polite">
          <span className="unified-transport__state">
            {transportStateLabel(transport.transportState, midiConnected)}
          </span>
        </div>
      ) : null}

      <TransportIconButton
        label={menuOpen ? 'close' : 'menu'}
        title={menuOpen ? 'Close settings' : 'Open settings'}
        active={menuOpen}
        onClick={onMenuToggle}
      />
    </div>
  );
}
