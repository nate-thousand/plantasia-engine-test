import { ControlDock } from '../components/controls/ControlDock';
import { AsciiCanvasView } from '../components/overlays/AsciiCanvasView';
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
          organismStateLabel={instrument.overlay.organismStateLabel}
          midiIndicator={instrument.overlay.midiIndicator}
          midiDeviceName={instrument.overlay.midiDeviceName}
          lastNoteLabel={instrument.overlay.lastNoteLabel}
          lastMidiMessage={instrument.overlay.lastMidiMessage}
          learnLabel={instrument.overlay.learnLabel}
          mappingCount={instrument.overlay.mappingCount}
          lastCcLabel={instrument.overlay.lastCcLabel}
        />
      }
      visualizer={
        <AsciiCanvasView
          presetId={instrument.presets.items[instrument.presets.index]?.id ?? 'seed'}
          presetName={instrument.overlay.presetName}
        />
      }
      controls={<ControlDock instrument={instrument} />}
    />
  );
}
