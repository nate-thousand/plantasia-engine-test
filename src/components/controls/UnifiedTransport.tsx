import { useSyncExternalStore } from 'react';
import { formatCategoryLabel } from '../../presets/categories';
import { getPresetStore, subscribePresetStore } from '../../stores/presetStore';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import {
  transportPlay,
  transportPresetNext,
  transportPresetPrevious,
  transportSelectPreset,
  transportStop,
} from '../../transport/transportActions';
import { transportStateLabel, useTransport } from '../../transport/useTransport';
import { InstrButton } from '../instrument/primitives/InstrButton';
import { InstrSelect } from '../instrument/primitives/InstrSelect';

type UnifiedTransportProps = {
  instrument: UseInstrumentReturn;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

/** M14 transport — play/stop, preset, panel toggle. Always visible. */
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

  const canSelectPreset = presets.items.length > 0;

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
      className="instr-transport"
      data-transport-state={transport.transportState}
      data-midi-connected={midiConnected ? 'true' : 'false'}
      aria-label="Playback transport"
    >
      <div className="instr-transport__group" aria-label="Transport">
        <InstrButton
          variant="compact"
          active={transport.isPlaying}
          disabled={transport.isInitializing}
          title={
            transport.isPlaying
              ? 'Ambient playing'
              : 'Start ambient soundscape (Space)'
          }
          aria-label={
            transport.isPlaying
              ? 'Ambient playing'
              : 'Start ambient soundscape'
          }
          onClick={handlePlay}
        >
          {transport.isInitializing ? '…' : 'Play'}
        </InstrButton>
        <InstrButton
          variant="compact"
          disabled={!transport.isPlaying}
          active={learn && midi.learnTarget === 'stop'}
          title="Stop ambient soundscape (Space)"
          aria-label="Stop ambient soundscape"
          onClick={handleStop}
        >
          Stop
        </InstrButton>
        <InstrButton
          variant="compact"
          disabled
          title="Record — future placeholder"
          aria-label="Record (future placeholder)"
        >
          Rec
        </InstrButton>
      </div>

      <div className="instr-transport__preset" aria-label="Preset">
        <InstrButton
          variant="compact"
          disabled={!canSelectPreset}
          active={learn && midi.learnTarget === 'presetPrevious'}
          title="Previous preset"
          aria-label="Previous preset"
          onClick={
            learn
              ? () => midi.onSelectLearnTarget('presetPrevious')
              : () => transportPresetPrevious()
          }
        >
          Prev
        </InstrButton>
        <InstrSelect
          className="instr-transport__select"
          value={presetStore.activeIndex}
          disabled={!canSelectPreset}
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
        </InstrSelect>
        <InstrButton
          variant="compact"
          disabled={!canSelectPreset}
          active={learn && midi.learnTarget === 'presetNext'}
          title="Next preset"
          aria-label="Next preset"
          onClick={
            learn ? () => midi.onSelectLearnTarget('presetNext') : () => transportPresetNext()
          }
        >
          Next
        </InstrButton>
      </div>

      <div className="instr-transport__status" aria-live="polite">
        <span className="instr-transport__preset-name">{presetName}</span>
        <span className="instr-transport__meta">
          {transportStateLabel(transport.transportState, midiConnected)}
          {presetStore.activeMetadata?.category
            ? ` · ${formatCategoryLabel(presetStore.activeMetadata.category)}`
            : null}
        </span>
      </div>

      <InstrButton
        variant="compact"
        active={menuOpen}
        title={menuOpen ? 'Close settings' : 'Open settings'}
        aria-expanded={menuOpen}
        aria-controls="instrument-surface-panel"
        onClick={onMenuToggle}
      >
        {menuOpen ? 'Close' : 'Panel'}
      </InstrButton>
    </div>
  );
}
