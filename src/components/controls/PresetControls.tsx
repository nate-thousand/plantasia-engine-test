import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type PresetControlsProps = {
  presets: UseInstrumentReturn['presets'];
  midi: UseInstrumentReturn['midi'];
};

/** Preset details and random — primary selector lives in UnifiedTransport. */
export function PresetControls({ presets, midi }: PresetControlsProps) {
  const learn = midi.learnEnabled;
  const active = presets.items[presets.index];

  return (
    <ControlGroup
      label="Preset details"
      className="control-group--compact control-group--preset"
      bodyClassName="control-group__body--stack"
    >
      {active?.description ? (
        <p className="control-hint control-hint--description">{active.description}</p>
      ) : (
        <span className="control-hint">Use the transport bar to change presets.</span>
      )}

      {active?.tags?.length ? (
        <span className="control-hint">{active.tags.join(' · ')}</span>
      ) : null}

      <p className="control-hint control-hint--meta">
        Hold Shift when using preset arrows in the drawer to keep slider values.
      </p>

      <div className="control-row">
        <ControlButton
          label="⎈ random"
          disabled={presets.items.length === 0}
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
