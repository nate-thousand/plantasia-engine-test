import { useSyncExternalStore } from 'react';
import { formatCategoryLabel } from '../../../presets/categories';
import { getPresetStore, subscribePresetStore } from '../../../stores/presetStore';
import type { UseInstrumentReturn } from '../../../hooks/useInstrument';
import {
  transportPlay,
  transportPresetNext,
  transportPresetPrevious,
  transportSelectPreset,
  transportStop,
} from '../../../transport/transportActions';
import { transportStateLabel, useTransport } from '../../../transport/useTransport';
import { InstrIconButton } from '../primitives/InstrIconButton';
import { InstrModuleColumn } from '../primitives/InstrModuleColumn';
import { InstrSelect } from '../primitives/InstrSelect';

type TransportModuleProps = {
  instrument: UseInstrumentReturn;
};

/** Module 01 — vertical transport rail with preset. */
export function TransportModule({ instrument }: TransportModuleProps) {
  const transport = useTransport();
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);
  const { midi, presets } = instrument;
  const learn = midi.learnEnabled;
  const midiConnected = instrument.status.midiIndicator.includes('●');

  const presetName =
    presetStore.activeMetadata?.name ??
    presets.items[presets.index]?.name ??
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

  const handlePlay = () => {
    if (learn) {
      midi.onSelectLearnTarget('play');
      return;
    }
    if (!transport.isPlaying) {
      void transportPlay('ui');
    }
  };

  const handleStop = () => {
    if (learn) {
      midi.onSelectLearnTarget('stop');
      return;
    }
    transportStop('ui');
  };

  return (
    <InstrModuleColumn index="01" title="Transport" className="ws-module--transport">
      <div className="ws-transport-rail" data-transport-state={transport.transportState}>
        <InstrIconButton
          icon="play"
          label="Start ambient soundscape (Space)"
          active={transport.isPlaying}
          disabled={transport.isInitializing}
          onClick={handlePlay}
        />
        <InstrIconButton
          icon="stop"
          label="Stop ambient soundscape"
          active={learn && midi.learnTarget === 'stop'}
          disabled={!transport.isPlaying}
          onClick={handleStop}
        />
        <InstrIconButton
          icon="record"
          label="Record (future placeholder)"
          disabled
        />
      </div>

      <div className="ws-preset-block">
        <p className="ws-preset-block__name">{presetName}</p>
        {presetStore.activeMetadata?.category ? (
          <span className="ws-preset-block__meta">
            {formatCategoryLabel(presetStore.activeMetadata.category)}
          </span>
        ) : null}
        <div className="ws-preset-block__nav">
          <InstrIconButton
            icon="chevron-left"
            label="Previous preset"
            disabled={!canSelectPreset}
            active={learn && midi.learnTarget === 'presetPrevious'}
            onClick={
              learn
                ? () => midi.onSelectLearnTarget('presetPrevious')
                : () => transportPresetPrevious()
            }
          />
          <InstrIconButton
            icon="chevron-right"
            label="Next preset"
            disabled={!canSelectPreset}
            active={learn && midi.learnTarget === 'presetNext'}
            onClick={
              learn ? () => midi.onSelectLearnTarget('presetNext') : () => transportPresetNext()
            }
          />
        </div>
        <InstrSelect
          disabled={!canSelectPreset}
          aria-label={`Preset: ${presetName}`}
          value={presetStore.activeIndex}
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
      </div>

      <div className="ws-transport-status" aria-live="polite">
        <span className="instr-label">
          {transportStateLabel(transport.transportState, midiConnected)}
        </span>
      </div>
    </InstrModuleColumn>
  );
}
