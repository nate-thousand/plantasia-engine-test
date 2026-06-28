import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import type { ModulationControlValues } from '../../types/instrument';

type ModulationControlsProps = {
  modulation: UseInstrumentReturn['modulation'];
  midi: UseInstrumentReturn['midi'];
  audioReady: boolean;
};

const SLIDER_KEYS: {
  key: keyof ModulationControlValues;
  label: string;
  learn: 'growthRate' | 'drift' | 'mutation' | 'energy';
}[] = [
  { key: 'growthRate', label: 'Growth', learn: 'growthRate' },
  { key: 'drift', label: 'Drift', learn: 'drift' },
  { key: 'mutation', label: 'Mutation', learn: 'mutation' },
  { key: 'energy', label: 'Energy', learn: 'energy' },
];

export function ModulationControls({ modulation, midi, audioReady }: ModulationControlsProps) {
  return (
    <ControlGroup label="Modulation" className="control-group--sliders">
      {SLIDER_KEYS.map(({ key, label, learn }) => (
        <ControlSlider
          key={key}
          label={label}
          value={modulation.values[key]}
          disabled={!audioReady}
          highlighted={modulation.highlight?.target === key}
          learnActive={midi.learnEnabled && midi.learnTarget === learn}
          onSelectLearn={
            midi.learnEnabled ? () => midi.onSelectLearnTarget(learn) : undefined
          }
          onChange={(value) => modulation.onChange(key, value)}
        />
      ))}
    </ControlGroup>
  );
}
