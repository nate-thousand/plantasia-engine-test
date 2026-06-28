import { ControlButton } from './ControlButton';
import { ControlGroup } from './ControlGroup';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type PresetControlsProps = {
  presets: UseInstrumentReturn['presets'];
  audioReady: boolean;
};

export function PresetControls({ presets, audioReady }: PresetControlsProps) {
  return (
    <ControlGroup label="Preset" className="control-group--compact">
      <select
        className="control-select control-select--wide"
        value={presets.index}
        disabled={!audioReady || presets.items.length === 0}
        onChange={(event) => presets.onSelect(Number(event.target.value))}
        aria-label="Preset selector"
      >
        {presets.items.length === 0 ? (
          <option value={0}>—</option>
        ) : (
          presets.items.map((preset, index) => (
            <option key={preset.id} value={index}>
              {preset.name}
            </option>
          ))
        )}
      </select>
      <ControlButton label="Prev" disabled={!audioReady} onClick={presets.onPrevious} />
      <ControlButton label="Next" disabled={!audioReady} onClick={presets.onNext} />
      <ControlButton label="Random" disabled={!audioReady} onClick={presets.onRandom} />
    </ControlGroup>
  );
}
