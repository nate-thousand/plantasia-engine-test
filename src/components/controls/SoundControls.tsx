import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import type { SoundControlValues } from '../../types/instrument';

type SoundControlsProps = {
  sound: UseInstrumentReturn['sound'];
  midi: UseInstrumentReturn['midi'];
};

const SLIDER_KEYS: { key: keyof SoundControlValues; label: string; tooltip: string; learn: 'mold' | 'tone' | 'texture' | 'bloom' }[] = [
  {
    key: 'mold',
    label: 'Mold',
    tooltip:
      'Introduces organic decay, tape instability, digital rot, granular corruption, and evolving sonic decomposition.',
    learn: 'mold',
  },
  { key: 'tone', label: 'Tone', tooltip: 'Filter resonance and harmonic emphasis.', learn: 'tone' },
  { key: 'texture', label: 'Texture', tooltip: 'Brightness, grain, and spectral density.', learn: 'texture' },
  { key: 'bloom', label: 'Bloom', tooltip: 'Space, delay, and reverb bloom.', learn: 'bloom' },
];

export function SoundControls({ sound, midi }: SoundControlsProps) {
  return (
    <ControlGroup label="Sound" className="control-group--sliders">
      {SLIDER_KEYS.map(({ key, label, tooltip, learn }) => (
        <ControlSlider
          key={key}
          label={label}
          title={tooltip}
          value={sound.values[key]}
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
