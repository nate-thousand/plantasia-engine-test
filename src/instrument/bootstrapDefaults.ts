import { bootstrapPresetCatalog } from '../audio/presets';
import { pulseVisualEnergy } from '../stores/visualEnergyStore';
import { patchTransportStore } from '../transport/transportStore';

let bootstrapped = false;

/** Load preset catalog and mark the instrument ready — independent of audio/ambient. */
export function bootstrapInstrumentDefaults(): void {
  if (bootstrapped) {
    return;
  }
  bootstrapped = true;

  const { catalog } = bootstrapPresetCatalog();
  if (catalog.length > 0) {
    patchTransportStore({
      transportState: 'idle',
      ambientActive: false,
      chordActive: false,
      sessionStarted: false,
      error: null,
    });
    pulseVisualEnergy('control', 0.45);
  }
}
