import { MidiControls } from './MidiControls';
import { ModulationControls } from './ModulationControls';
import { PresetControls } from './PresetControls';
import { SoundControls } from './SoundControls';
import { TransportControls } from './TransportControls';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type ControlDockProps = {
  instrument: UseInstrumentReturn;
};

export function ControlDock({ instrument }: ControlDockProps) {
  const audioReady = instrument.transport.audioReady;

  return (
    <div className="control-dock">
      <TransportControls transport={instrument.transport} midi={instrument.midi} />
      <PresetControls presets={instrument.presets} midi={instrument.midi} audioReady={audioReady} />
      <SoundControls sound={instrument.sound} midi={instrument.midi} audioReady={audioReady} />
      <ModulationControls
        modulation={instrument.modulation}
        midi={instrument.midi}
        audioReady={audioReady}
      />
      <MidiControls midi={instrument.midi} audioReady={audioReady} />
    </div>
  );
}
