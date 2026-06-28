import { InstrumentWorkstation } from '../components/instrument/InstrumentWorkstation';
import { AsciiCanvasView } from '../components/overlays/AsciiCanvasView';
import { useInstrument } from '../hooks/useInstrument';
import { InstrumentShell } from '../layouts/InstrumentShell';
import { AppErrorBoundary } from './AppErrorBoundary';

export function App() {
  const instrument = useInstrument();

  return (
    <AppErrorBoundary>
      <InstrumentShell
        error={instrument.error}
        visualizer={<AsciiCanvasView />}
        workstation={<InstrumentWorkstation instrument={instrument} />}
      />
    </AppErrorBoundary>
  );
}
