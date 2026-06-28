import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import type { SoundControlValues } from '../../types/instrument';

type SoundControlsProps = {
  sound: UseInstrumentReturn['sound'];
};

const SLIDER_KEYS: { key: keyof SoundControlValues; label: string; tooltip: string }[] = [
  {
    key: 'mold',
    label: 'Mold',
    tooltip:
      'Organic decay, tape instability, and evolving sonic decomposition.',
  },
  { key: 'tone', label: 'Tone', tooltip: 'Filter resonance and harmonic emphasis.' },
  { key: 'texture', label: 'Texture', tooltip: 'Brightness, grain, and spectral density.' },
  { key: 'bloom', label: 'Bloom', tooltip: 'Space, delay, and reverb bloom.' },
];

export function SoundControls({ sound }: SoundControlsProps) {
  return (
    <ControlGroup label="Sound" className="control-group--sliders">
      {SLIDER_KEYS.map(({ key, label, tooltip }) => (
        <ControlSlider
          key={key}
          label={label}
          title={tooltip}
          value={sound.values[key]}
          highlighted={sound.highlight?.target === key}
          onChange={(value) => sound.onChange(key, value)}
        />
      ))}
    </ControlGroup>
  );
}
