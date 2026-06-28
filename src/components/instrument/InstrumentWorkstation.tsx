import { useEffect, useState } from 'react';
import type { UseInstrumentReturn } from '../../hooks/useInstrument';
import { TransportModule } from './modules/TransportModule';
import { SoundModule } from './modules/SoundModule';
import { VisualModule } from './modules/VisualModule';
import { PerformanceModule } from './modules/PerformanceModule';
import { OutputModule } from './modules/OutputModule';
import { InstrIcon } from './primitives/InstrIcon';

type InstrumentWorkstationProps = {
  instrument: UseInstrumentReturn;
};

/**
 * M14 hardware workstation — five module columns, always visible on desktop.
 * Replaces the collapsible drawer pattern entirely.
 */
export function InstrumentWorkstation({ instrument }: InstrumentWorkstationProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [deckOpen, setDeckOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 960px)');
    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setDeckOpen(!mobile);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div
      className={`workstation-shell${deckOpen ? ' workstation-shell--open' : ''}`}
      data-deck-open={deckOpen ? 'true' : 'false'}
    >
      {isMobile ? (
        <button
          type="button"
          className="workstation-shell__toggle"
          aria-expanded={deckOpen}
          aria-controls="instrument-workstation"
          onClick={() => setDeckOpen((open) => !open)}
        >
          <InstrIcon name={deckOpen ? 'chevron-down' : 'chevron-up'} size={16} />
          <span>{deckOpen ? 'Hide controls' : 'Show controls'}</span>
        </button>
      ) : null}

      <div id="instrument-workstation" className="workstation" aria-label="Instrument controls">
        <TransportModule instrument={instrument} />
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
  );
}
