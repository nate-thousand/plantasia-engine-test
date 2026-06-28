import { useState, useSyncExternalStore } from 'react';
import { ControlDock } from '../components/controls/ControlDock';
import { UnifiedTransport } from '../components/controls/UnifiedTransport';
import { AsciiCanvasView } from '../components/overlays/AsciiCanvasView';
import { TitleScreen } from '../components/overlays/TitleScreen';
import { useInstrument } from '../hooks/useInstrument';
import { InstrumentShell } from '../layouts/InstrumentShell';
import { isSessionStarted, subscribeTransportStore } from '../transport/transportStore';
import { AppErrorBoundary } from './AppErrorBoundary';

export function App() {
  const instrument = useInstrument();
  const [menuOpen, setMenuOpen] = useState(false);
  const sessionStarted = useSyncExternalStore(
    subscribeTransportStore,
    () => isSessionStarted(),
    () => false,
  );

  return (
    <AppErrorBoundary>
      <InstrumentShell
        error={instrument.error}
        visualizer={
          <>
            <AsciiCanvasView />
            <TitleScreen />
          </>
        }
        transport={
          <UnifiedTransport
            instrument={instrument}
            menuOpen={menuOpen}
            sessionStarted={sessionStarted}
            onMenuToggle={() => setMenuOpen((open) => !open)}
          />
        }
        controls={<ControlDock instrument={instrument} menuOpen={menuOpen} />}
      />
    </AppErrorBoundary>
  );
}
