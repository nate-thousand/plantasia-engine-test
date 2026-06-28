import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type SoundControlsProps = {
  sound: UseInstrumentReturn['sound'];
  audioReady: boolean;
};

export function SoundControls({ sound, audioReady }: SoundControlsProps) {
  return (
    <ControlGroup label="Sound">
      <ControlSlider
        label="Volume"
        value={sound.values.volume}
        disabled={!audioReady}
        placeholder
        onChange={(value) => sound.onChange('volume', value)}
      />
      <ControlSlider
        label="Tone"
        value={sound.values.tone}
        disabled={!audioReady}
        placeholder
        onChange={(value) => sound.onChange('tone', value)}
      />
      <ControlSlider
        label="Texture"
        value={sound.values.texture}
        disabled={!audioReady}
        placeholder
        onChange={(value) => sound.onChange('texture', value)}
      />
      <ControlSlider
        label="Bloom"
        value={sound.values.bloom}
        disabled={!audioReady}
        onChange={(value) => sound.onChange('bloom', value)}
      />
    </ControlGroup>
  );
}
