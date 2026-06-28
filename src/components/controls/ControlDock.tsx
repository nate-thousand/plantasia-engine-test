import { useState } from 'react';
import { KeyboardControls } from './KeyboardControls';
import { MidiControls } from './MidiControls';
import { ModulationControls } from './ModulationControls';
import { PresetControls } from './PresetControls';
import { SoundControls } from './SoundControls';
import { StatusFeedback } from './StatusFeedback';
import { TransportControls } from './TransportControls';
import { VizControls } from './VizControls';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type ControlDockProps = {
  instrument: UseInstrumentReturn;
};

export function ControlDock({ instrument }: ControlDockProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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
          <TransportControls transport={instrument.transport} midi={instrument.midi} />

          <div className="control-dock__main">
            <StatusFeedback status={instrument.status} />

            <div className="control-dock__grid">
              <PresetControls
                presets={instrument.presets}
                midi={instrument.midi}
                audioReady={audioReady}
              />
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

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="control-dock-panel"
        onClick={() => setMenuOpen((open) => !open)}
      >
        menu
      </button>
    </div>
  );
}
