import { KeyboardControls } from './KeyboardControls';
import { MidiControls } from './MidiControls';
import { PresetControls } from './PresetControls';
import { SoundControls } from './SoundControls';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type ControlDockProps = {
  instrument: UseInstrumentReturn;
  menuOpen: boolean;
};

/** Settings drawer — sound, MIDI, keyboard. Playback lives in UnifiedTransport. */
export function ControlDock({ instrument, menuOpen }: ControlDockProps) {
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
            <div className="control-dock__grid">
              <PresetControls presets={instrument.presets} />
              <SoundControls sound={instrument.sound} />
              <KeyboardControls keyboard={instrument.keyboard} />
              <MidiControls midi={instrument.midi} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
