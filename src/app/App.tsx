import { useState } from 'react';
import { ControlDock } from '../components/controls/ControlDock';
import { UnifiedTransport } from '../components/controls/UnifiedTransport';
import { AsciiCanvasView } from '../components/overlays/AsciiCanvasView';
import { useInstrument } from '../hooks/useInstrument';
import { InstrumentShell } from '../layouts/InstrumentShell';
import { AppErrorBoundary } from './AppErrorBoundary';

export function App() {
  const instrument = useInstrument();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AppErrorBoundary>
      <InstrumentShell
        error={instrument.error}
        visualizer={<AsciiCanvasView />}
        transport={
          <UnifiedTransport
            instrument={instrument}
            menuOpen={menuOpen}
            onMenuToggle={() => setMenuOpen((open) => !open)}
          />
        }
        controls={<ControlDock instrument={instrument} menuOpen={menuOpen} />}
      />
    </AppErrorBoundary>
  );
}
