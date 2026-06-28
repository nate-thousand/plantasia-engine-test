import { KeyboardControls } from './KeyboardControls';
import { MidiControls } from './MidiControls';
import { ModulationControls } from './ModulationControls';
import { PresetControls } from './PresetControls';
import { SoundControls } from './SoundControls';
import { StatusFeedback } from './StatusFeedback';
import { VizControls } from './VizControls';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type ControlDockProps = {
  instrument: UseInstrumentReturn;
  menuOpen: boolean;
};

/** Settings drawer — sound, MIDI, keyboard, viz. Playback lives in UnifiedTransport. */
export function ControlDock({ instrument, menuOpen }: ControlDockProps) {
  const audioReady = instrument.transport.audioReady;

  return (
    <div
      className={`control-dock-shell${menuOpen ? ' control-dock-shell--open' : ''}`}
      data-menu-open={menuOpen ? 'true' : 'false'}
    >
      <div
        id="control-dock-panel"
        className="control-dock-panel"
        aria-hidden={menuOpen ? 'false' : 'true'}
      >
        <div className="control-dock">
          <div className="control-dock__main">
            <StatusFeedback status={instrument.status} />

            <div className="control-dock__grid">
              <PresetControls presets={instrument.presets} midi={instrument.midi} audioReady={audioReady} />
              <MidiControls midi={instrument.midi} audioReady={audioReady} />
              <KeyboardControls keyboard={instrument.keyboard} audioReady={audioReady} />
              <SoundControls
                sound={instrument.sound}
                midi={instrument.midi}
                audioReady={audioReady}
              />
              <ModulationControls
                modulation={instrument.modulation}
                midi={instrument.midi}
                audioReady={audioReady}
              />
              <VizControls />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
