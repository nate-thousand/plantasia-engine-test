import { useSyncExternalStore } from 'react';
import { getEngineStore, subscribeEngineStore } from '../../stores/engineStore';
import { getPresetStore, subscribePresetStore } from '../../stores/presetStore';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import {
  transportPresetNext,
  transportPresetPrevious,
  transportSelectPreset,
} from '../../transport/transportActions';
import { beginInstrumentSession, toggleDemoSession } from '../../transport/sessionStart';
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

/** Single playback transport — one toggle, preset, menu. Always visible. */
export function UnifiedTransport({
  instrument,
  menuOpen,
  sessionStarted,
  onMenuToggle,
}: UnifiedTransportProps) {
  const transport = useTransport();
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);
  const hasKeyboardPlayed = useSyncExternalStore(
    subscribeEngineStore,
    () => getEngineStore().hasKeyboardPlayed,
    () => false,
  );
  const { presets } = instrument;
  const midiConnected = instrument.status.midiIndicator.includes('●');

  const handleToggle = () => {
    if (transport.isInitializing) {
      return;
    }
    if (!sessionStarted) {
      beginInstrumentSession('ui');
      return;
    }
    toggleDemoSession('ui');
  };

  const toggleLabel = transport.isInitializing ? '…' : transport.isPlaying ? '■' : '▶';
  const toggleTitle = !sessionStarted
    ? 'Begin (Space)'
    : transport.isPlaying
      ? 'Stop demo (Space)'
      : 'Start demo (Space)';

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

  const showOnboardingHint = sessionStarted && !hasKeyboardPlayed;

  return (
    <div className="unified-transport-shell">
    <div
      className={`unified-transport${sessionStarted ? '' : ' unified-transport--title'}`}
      data-transport-state={transport.transportState}
      data-midi-connected={midiConnected ? 'true' : 'false'}
      aria-label="Playback transport"
    >
      <div className="unified-transport__playback">
        <TransportIconButton
          label={toggleLabel}
          title={toggleTitle}
          disabled={transport.isInitializing}
          active={sessionStarted && transport.isPlaying}
          primary
          onClick={handleToggle}
        />
      </div>

      <div className="unified-transport__preset">
        <TransportIconButton
          label="‹"
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
          label="›"
          title="Next preset"
          disabled={!canSelectPreset}
          onClick={() => transportPresetNext()}
        />
      </div>

      <div className="unified-transport__status" aria-live="polite">
        <span className="unified-transport__state">
          {transportStateLabel(transport.transportState, midiConnected)}
        </span>
      </div>

      <TransportIconButton
        label={menuOpen ? 'close' : 'menu'}
        title={menuOpen ? 'Close settings' : 'Open settings'}
        active={menuOpen}
        onClick={onMenuToggle}
      />
    </div>
    {showOnboardingHint ? (
      <p className="unified-transport__hint" aria-live="polite">
        A–K to play · ▶ for demo · Space toggles demo
      </p>
    ) : null}
    </div>
  );
}
