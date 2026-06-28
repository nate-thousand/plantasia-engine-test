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
  return (
    <div className="control-dock">
      <TransportControls transport={instrument.transport} />
      <PresetControls presets={instrument.presets} audioReady={instrument.transport.audioReady} />
      <SoundControls sound={instrument.sound} audioReady={instrument.transport.audioReady} />
      <ModulationControls
        modulation={instrument.modulation}
        audioReady={instrument.transport.audioReady}
      />
      <MidiControls midi={instrument.midi} />
    </div>
  );
}
