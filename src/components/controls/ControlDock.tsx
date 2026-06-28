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
      <TransportControls transport={instrument.transport} />
      <PresetControls presets={instrument.presets} audioReady={audioReady} />
      <SoundControls sound={instrument.sound} audioReady={audioReady} />
      <ModulationControls modulation={instrument.modulation} audioReady={audioReady} />
      <MidiControls midi={instrument.midi} audioReady={audioReady} />
    </div>
  );
}
