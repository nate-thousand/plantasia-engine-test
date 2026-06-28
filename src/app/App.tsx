import { ControlDock } from '../components/controls/ControlDock';
import { OrganismView } from '../components/overlays/OrganismView';
import { TopOverlay } from '../components/overlays/TopOverlay';
import { useInstrument } from '../hooks/useInstrument';
import { InstrumentShell } from '../layouts/InstrumentShell';

export function App() {
  const instrument = useInstrument();

  return (
    <InstrumentShell
      error={instrument.error}
      chrome={
        <TopOverlay
          audioIndicator={instrument.overlay.audioIndicator}
          presetName={instrument.overlay.presetName}
          midiIndicator={instrument.overlay.midiIndicator}
        />
      }
      visualizer={<OrganismView ascii={instrument.organismAscii} />}
      controls={<ControlDock instrument={instrument} />}
    />
  );
}
