import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import type { SoundControlValues } from '../../types/instrument';

type SoundControlsProps = {
  sound: UseInstrumentReturn['sound'];
  midi: UseInstrumentReturn['midi'];
  audioReady: boolean;
};

const SLIDER_KEYS: { key: keyof SoundControlValues; label: string; learn: 'volume' | 'tone' | 'texture' | 'bloom' }[] = [
  { key: 'volume', label: 'Volume', learn: 'volume' },
  { key: 'tone', label: 'Tone', learn: 'tone' },
  { key: 'texture', label: 'Texture', learn: 'texture' },
  { key: 'bloom', label: 'Bloom', learn: 'bloom' },
];

export function SoundControls({ sound, midi, audioReady }: SoundControlsProps) {
  return (
    <ControlGroup label="Sound" className="control-group--sliders">
      {SLIDER_KEYS.map(({ key, label, learn }) => (
        <ControlSlider
          key={key}
          label={label}
          value={sound.values[key]}
          disabled={!audioReady}
          highlighted={sound.highlight?.target === key}
          learnActive={midi.learnEnabled && midi.learnTarget === learn}
          onSelectLearn={
            midi.learnEnabled ? () => midi.onSelectLearnTarget(learn) : undefined
          }
          onChange={(value) => sound.onChange(key, value)}
        />
      ))}
    </ControlGroup>
  );
}
