import { useEffect, useSyncExternalStore, useState } from 'react';
import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { getPresetStore, subscribePresetStore } from '../../stores/presetStore';

type PresetControlsProps = {
  presets: UseInstrumentReturn['presets'];
  midi: UseInstrumentReturn['midi'];
  audioReady: boolean;
};

export function PresetControls({ presets, midi, audioReady }: PresetControlsProps) {
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);
  const learn = midi.learnEnabled;
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setShiftHeld(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setShiftHeld(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const groups =
    presetStore.groups.length > 0
      ? presetStore.groups
      : [
          {
            id: 'all',
            label: 'Presets',
            presets: presets.items.map((item, index) => ({
              index,
              preset: { id: item.id, name: item.name } as import('plantasia-sound-engine').PlantasiaPreset,
              metadata: { id: item.id, name: item.name },
            })),
          },
        ];

  return (
    <ControlGroup
      label="Preset"
      className="control-group--compact control-group--preset"
      bodyClassName="control-group__body--stack"
    >
      <select
        className="control-select control-select--wide"
        value={presets.index}
        disabled={!audioReady || presets.items.length === 0}
        onChange={(event) => presets.onSelect(Number(event.target.value), shiftHeld)}
        aria-label="Preset"
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

      {presets.items[presets.index]?.description ? (
        <p className="control-hint control-hint--description">
          {presets.items[presets.index].description}
        </p>
      ) : null}

      {presets.items[presets.index]?.tags?.length ? (
        <span className="control-hint">
          {presets.items[presets.index].tags!.join(' · ')}
        </span>
      ) : null}

      {presetStore.themeWarning ? (
        <span className="control-hint control-hint--warning">{presetStore.themeWarning}</span>
      ) : null}

      <p className="control-hint control-hint--meta">
        Preset id differs from display name (e.g. seed → Moss). Hold Shift when switching to keep
        slider values.
      </p>

      {presetStore.loadError ? (
        <span className="control-hint control-hint--error">{presetStore.loadError}</span>
      ) : null}

      <div className="control-row">
        <ControlButton
          label="◀"
          disabled={!audioReady}
          active={learn && midi.learnTarget === 'presetPrevious'}
          onClick={
            learn
              ? () => midi.onSelectLearnTarget('presetPrevious')
              : (event) => presets.onPrevious(event.shiftKey)
          }
        />
        <ControlButton
          label="▶"
          disabled={!audioReady}
          active={learn && midi.learnTarget === 'presetNext'}
          onClick={
            learn ? () => midi.onSelectLearnTarget('presetNext') : (event) => presets.onNext(event.shiftKey)
          }
        />
        <ControlButton
          label="⎈"
          disabled={!audioReady}
          active={learn && midi.learnTarget === 'presetRandom'}
          onClick={
            learn
              ? () => midi.onSelectLearnTarget('presetRandom')
              : (event) => presets.onRandom(event.shiftKey)
          }
        />
      </div>
    </ControlGroup>
  );
}
