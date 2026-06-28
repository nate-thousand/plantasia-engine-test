import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type ModulationControlsProps = {
  modulation: UseInstrumentReturn['modulation'];
  audioReady: boolean;
};

export function ModulationControls({ modulation, audioReady }: ModulationControlsProps) {
  return (
    <ControlGroup label="Modulation">
      <ControlSlider
        label="Growth"
        value={modulation.values.growthRate}
        disabled={!audioReady}
        placeholder
        onChange={(value) => modulation.onChange('growthRate', value)}
      />
      <ControlSlider
        label="Drift"
        value={modulation.values.drift}
        disabled={!audioReady}
        placeholder
        onChange={(value) => modulation.onChange('drift', value)}
      />
      <ControlSlider
        label="Mutation"
        value={modulation.values.mutation}
        disabled={!audioReady}
        onChange={(value) => modulation.onChange('mutation', value)}
      />
      <ControlSlider
        label="Energy"
        value={modulation.values.energy}
        disabled={!audioReady}
        onChange={(value) => modulation.onChange('energy', value)}
      />
    </ControlGroup>
  );
}
