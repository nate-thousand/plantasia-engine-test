import { SoundModule } from './modules/SoundModule';
import { VisualModule } from './modules/VisualModule';
import { PerformanceModule } from './modules/PerformanceModule';
import { OutputModule } from './modules/OutputModule';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type InstrumentSurfaceProps = {
  instrument: UseInstrumentReturn;
  menuOpen: boolean;
};

/** M14 instrument control surface — modular cards, monochrome workstation layout. */
export function InstrumentSurface({ instrument, menuOpen }: InstrumentSurfaceProps) {
  return (
    <div
      className={`instrument-surface-shell${menuOpen ? ' instrument-surface-shell--open' : ''}`}
      data-menu-open={menuOpen ? 'true' : 'false'}
    >
      <div
        id="instrument-surface-panel"
        className="instrument-surface"
        aria-hidden={menuOpen ? 'false' : 'true'}
      >
        <div className="instrument-surface__grid">
          <SoundModule
            sound={instrument.sound}
            modulation={instrument.modulation}
            midi={instrument.midi}
          />
          <VisualModule />
          <PerformanceModule instrument={instrument} />
          <OutputModule status={instrument.status} />
        </div>
      </div>
    </div>
  );
}
