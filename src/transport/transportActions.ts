import { engineAdapter } from '../audio/EngineAdapter';
import {
  bootstrapPresetCatalog,
  loadPresetAtIndex,
  randomPresetIndex,
} from '../audio/presets';
import { stopEngineNote } from '../audio/engine';
import { buildPresetCatalog } from '../presets/engineRegistry';
import { resolvePresetIndexFromProgram } from '../input/PresetMidiDefaults';
import {
  clearActiveNotes,
  registerNoteOff,
  registerNoteOn,
} from '../stores/engineStore';
import { getControlStore } from '../stores/controlStore';
import { getPresetStore, setActivePresetIndex } from '../stores/presetStore';
import { pulseScreenFeedback } from '../stores/midiStore';
import { pulseVisualEnergy } from '../stores/visualEnergyStore';
import { scaleEventAmount } from '../visualization/InteractionResponse';
import type { TransportActionSource } from './types';
import {
  getHoldEnabled,
  getTransportStore,
  isTransportAmbientActive,
  isSessionStarted,
  isTransportAudioReady,
  isTransportPlaying,
  patchTransportStore,
  setTransportError,
  setTransportState,
  syncEngineFromAdapter,
  syncTransportPlayingState,
} from './transportStore';

function emitTransportFeedback(
  kind: 'play' | 'stop' | 'padHit' | 'presetChange' | 'knobTwist',
  velocity = 100,
  detail?: string,
): void {
  pulseScreenFeedback(velocity, kind, detail);
}

let ensureInstrumentPromise: Promise<boolean> | null = null;
let sessionStartPromise: Promise<void> | null = null;

/** Start Tone.js and load the active preset — does not start ambient playback. */
export async function ensureInstrumentAudio(): Promise<boolean> {
  if (isTransportAudioReady()) {
    return true;
  }

  if (ensureInstrumentPromise) {
    return ensureInstrumentPromise;
  }

  ensureInstrumentPromise = (async () => {
    setTransportError(null);
    setTransportState('loading');

    try {
      await engineAdapter.kickAudioFromUserGesture();
      const { defaultIndex } = bootstrapPresetCatalog();
      const presetIndex = getPresetStore().ready ? getPresetStore().activeIndex : defaultIndex;
      const store = getControlStore();
      engineAdapter.applyControlSurface(store.sound, store.modulation);
      await loadPresetAtIndex(presetIndex);
      patchTransportStore({
        transportState: isSessionStarted() ? 'ready' : 'idle',
        chordActive: false,
        ambientActive: false,
      });
      syncEngineFromAdapter();
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Audio could not start.';
      console.error('[Plantasia Transport] Audio start failed:', caught);
      setTransportError(message);
      setTransportState(getPresetStore().ready ? 'ready' : 'idle');
      return false;
    }
  })().finally(() => {
    ensureInstrumentPromise = null;
  });

  return ensureInstrumentPromise;
}

/** @deprecated Use ensureInstrumentAudio — kept for callers that only need init. */
export const startTransportAudio = ensureInstrumentAudio;

/** Play — start ambient soundscape only (instrument must be initialized). */
export async function transportPlay(_source: TransportActionSource = 'ui'): Promise<void> {
  const ready = isSessionStarted() ? isTransportAudioReady() : await ensureInstrumentAudio();
  if (!ready) {
    return;
  }

  if (!isSessionStarted()) {
    patchTransportStore({ sessionStarted: true });
  }

  const preset = getPresetStore().activePreset;
  if (!preset) {
    return;
  }

  try {
    patchTransportStore({ ambientActive: true, chordActive: false });
    await engineAdapter.startAmbientPlayback(preset);
    syncTransportPlayingState();
    pulseVisualEnergy('ui', scaleEventAmount(110));
    emitTransportFeedback('play', 110);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Ambient playback could not start.';
    patchTransportStore({ ambientActive: false });
    setTransportError(message);
  }
}

/** Stop — fade ambient soundscape; instrument stays available for notes and controls. */
export async function transportStop(_source: TransportActionSource = 'ui'): Promise<void> {
  if (!isTransportAmbientActive()) {
    return;
  }

  try {
    patchTransportStore({ ambientActive: false, chordActive: false });
    syncTransportPlayingState();

    if (isTransportAudioReady()) {
      stopEngineNote();
      clearActiveNotes();
      await engineAdapter.stopAmbientPlayback(true);
    }

    if (getTransportStore().transportState === 'playing') {
      setTransportState('ready');
    }

    pulseVisualEnergy('ui', scaleEventAmount(40));
    emitTransportFeedback('stop', 90);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Playback could not stop.';
    setTransportError(message);
  }
}

/** Spacebar / click — start session; after that toggle play/stop. */
export async function transportStartSession(
  source: TransportActionSource = 'keyboard',
): Promise<void> {
  if (!isSessionStarted()) {
    if (sessionStartPromise) {
      return sessionStartPromise;
    }

    patchTransportStore({ sessionStarted: true, transportState: 'loading' });

    sessionStartPromise = (async () => {
      const ready = await ensureInstrumentAudio();
      if (!ready) {
        patchTransportStore({ sessionStarted: false, transportState: 'idle' });
        return;
      }

      await transportPlay(source);
    })().finally(() => {
      sessionStartPromise = null;
    });

    return sessionStartPromise;
  }

  await toggleTransportPlayStop(source);
}

/** Spacebar / primary transport toggle — ambient play/stop only. */
export async function toggleTransportPlayStop(source: TransportActionSource = 'keyboard'): Promise<void> {
  if (isTransportPlaying()) {
    await transportStop(source);
  } else {
    await transportPlay(source);
  }
}

export function transportToggleHold(): void {
  const next = !getHoldEnabled();
  patchTransportStore({ holdEnabled: next });
  emitTransportFeedback('knobTwist', 70, 'hold');
}

export function transportSetHold(enabled: boolean): void {
  patchTransportStore({ holdEnabled: enabled });
}

export function transportNoteOn(
  midi: number,
  velocity: number,
  source: 'keyboard' | 'midi' = 'keyboard',
): void {
  if (!isSessionStarted()) {
    return;
  }

  void ensureInstrumentAudio().then((ready) => {
    if (!ready) {
      return;
    }

    try {
      engineAdapter.noteOn(midi, velocity);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not play.';
      setTransportError(message);
    }
  });

  try {
    registerNoteOn(midi, velocity, source);
    emitTransportFeedback('padHit', velocity);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Note could not register.';
    setTransportError(message);
  }
}

export function transportNoteOff(midi: number): void {
  if (getHoldEnabled()) {
    return;
  }

  registerNoteOff(midi);

  if (!isTransportAudioReady()) {
    return;
  }

  engineAdapter.noteOff(midi);
  emitTransportFeedback('padHit', 55);
}

export async function transportSelectPreset(
  index: number,
  preserveControls = false,
): Promise<void> {
  if (!getPresetStore().ready) {
    bootstrapPresetCatalog();
  }

  const catalog = buildPresetCatalog();
  if (catalog.length === 0) {
    return;
  }

  const wrapped = ((index % catalog.length) + catalog.length) % catalog.length;
  setActivePresetIndex(wrapped);

  if (!isSessionStarted()) {
    return;
  }

  const ready = await ensureInstrumentAudio();
  if (!ready) {
    setTransportError(null);
    pulseVisualEnergy('preset', scaleEventAmount(127));
    emitTransportFeedback('presetChange', 127);
    return;
  }

  const wasAmbient = getTransportStore().ambientActive;

  try {
    await loadPresetAtIndex(wrapped, { preserveControls });
    setTransportError(null);
    patchTransportStore({ chordActive: false });
    syncTransportPlayingState();
    emitTransportFeedback('presetChange', 127);
    pulseVisualEnergy('preset', scaleEventAmount(127));

    if (wasAmbient) {
      const preset = getPresetStore().activePreset;
      if (preset) {
        await engineAdapter.startAmbientPlayback(preset);
      }
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Preset could not load.';
    setTransportError(message);
  }
}

export function transportPresetPrevious(preserveControls = false): void {
  void transportSelectPreset(getPresetStore().activeIndex - 1, preserveControls);
}

export function transportPresetNext(preserveControls = false): void {
  void transportSelectPreset(getPresetStore().activeIndex + 1, preserveControls);
}

export function transportPresetRandom(preserveControls = false): void {
  const { activeIndex } = getPresetStore();
  const catalog = buildPresetCatalog();
  void transportSelectPreset(randomPresetIndex(activeIndex, catalog.length), preserveControls);
}

export function transportProgramChange(program: number): void {
  const catalog = buildPresetCatalog();
  const index = resolvePresetIndexFromProgram(program, catalog);
  if (index !== null) {
    void transportSelectPreset(index);
  }
}

/** Legacy reconcile — sync ambient transport state. */
export function transportReconcileChordIdle(): void {
  syncTransportPlayingState();
}
