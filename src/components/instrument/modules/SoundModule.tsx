import { InstrKnob } from '../primitives/InstrKnob';
import { InstrModuleColumn, WsZone } from '../primitives/InstrModuleColumn';
import { InstrFilterGraph } from '../primitives/InstrFilterGraph';
import { InstrEnvelopeGraph } from '../primitives/InstrEnvelopeGraph';
import { InstrWaveform } from '../primitives/InstrMeter';
import type { UseInstrumentReturn } from '../../../hooks/useInstrument';
import type { MidiControlTarget } from '../../../input/MidiDefaults';
import type { ModulationControlValues, SoundControlValues } from '../../../types/instrument';

type SoundModuleProps = {
  sound: UseInstrumentReturn['sound'];
  modulation: UseInstrumentReturn['modulation'];
  midi: UseInstrumentReturn['midi'];
};

const OSC: {
  key: keyof SoundControlValues;
  label: string;
  tooltip: string;
  learn: 'texture';
}[] = [{ key: 'texture', label: 'Texture', tooltip: 'Brightness, grain, spectral density.', learn: 'texture' }];

const FILTER: {
  key: keyof SoundControlValues;
  label: string;
  tooltip: string;
  learn: 'tone';
}[] = [{ key: 'tone', label: 'Tone', tooltip: 'Filter resonance and harmonic emphasis.', learn: 'tone' }];

const FX: {
  key: keyof SoundControlValues;
  label: string;
  tooltip: string;
  learn: 'mold' | 'bloom';
}[] = [
  { key: 'mold', label: 'Mold', tooltip: 'Organic decay and sonic decomposition.', learn: 'mold' },
  { key: 'bloom', label: 'Bloom', tooltip: 'Space, delay, and reverb bloom.', learn: 'bloom' },
];

const MOD: {
  key: keyof ModulationControlValues;
  label: string;
  learn: 'growthRate' | 'drift' | 'mutation' | 'energy';
}[] = [
  { key: 'growthRate', label: 'Growth', learn: 'growthRate' },
  { key: 'drift', label: 'Drift', learn: 'drift' },
  { key: 'mutation', label: 'Mutation', learn: 'mutation' },
  { key: 'energy', label: 'Energy', learn: 'energy' },
];

export function SoundModule({ sound, modulation, midi }: SoundModuleProps) {
  const learn = midi.learnEnabled;
  const { texture, tone, mold } = sound.values;

  const renderKnob = (
    key: keyof SoundControlValues | keyof ModulationControlValues,
    label: string,
    tooltip: string | undefined,
    learnTarget: MidiControlTarget,
    value: number,
    onChange: (v: number) => void,
    highlight?: boolean,
  ) => (
    <InstrKnob
      key={String(key)}
      label={label}
      title={tooltip}
      value={value}
      active={highlight}
      learnActive={learn && midi.learnTarget === learnTarget}
      onSelectLearn={learn ? () => midi.onSelectLearnTarget(learnTarget) : undefined}
      onChange={onChange}
    />
  );

  return (
    <InstrModuleColumn index="02" title="Sound">
      <div className="ws-signal-row">
        <InstrFilterGraph cutoff={tone} resonance={texture} />
        <InstrEnvelopeGraph
          attack={modulation.values.growthRate}
          sustain={modulation.values.energy}
          release={modulation.values.drift}
        />
        <InstrWaveform
          samples={Array.from({ length: 40 }, (_, i) => {
            const t = texture / 100;
            const m = mold / 100;
            return 0.28 + t * 0.38 + Math.sin(i * 0.32 + m * 5) * 0.22;
          })}
        />
      </div>

      <WsZone label="Oscillator">
        {OSC.map(({ key, label, tooltip, learn: lt }) =>
          renderKnob(
            key,
            label,
            tooltip,
            lt,
            sound.values[key],
            (v) => sound.onChange(key, v),
            sound.highlight?.target === key,
          ),
        )}
      </WsZone>

      <WsZone label="Filter">
        {FILTER.map(({ key, label, tooltip, learn: lt }) =>
          renderKnob(
            key,
            label,
            tooltip,
            lt,
            sound.values[key],
            (v) => sound.onChange(key, v),
            sound.highlight?.target === key,
          ),
        )}
      </WsZone>

      <WsZone label="Effects">
        <div className="ws-knob-row">
          {FX.map(({ key, label, tooltip, learn: lt }) =>
            renderKnob(
              key,
              label,
              tooltip,
              lt,
              sound.values[key],
              (v) => sound.onChange(key, v),
              sound.highlight?.target === key,
            ),
          )}
        </div>
      </WsZone>

      <WsZone label="Modulation">
        <div className="ws-knob-row">
          {MOD.map(({ key, label, learn: lt }) =>
            renderKnob(
              key,
              label,
              undefined,
              lt,
              modulation.values[key],
              (v) => modulation.onChange(key, v),
              modulation.highlight?.target === key,
            ),
          )}
        </div>
      </WsZone>
    </InstrModuleColumn>
  );
}
