import { engineAdapter } from '../audio/EngineAdapter';
import {
  bootstrapPresetCatalog,
  loadPresetAtIndex,
  randomPresetIndex,
} from '../audio/presets';
import { startAudioEngine, stopEngineNote } from '../audio/engine';
import { buildPresetCatalog } from '../presets/engineRegistry';
import { resolvePresetIndexFromProgram } from '../input/PresetMidiDefaults';
import {
  clearActiveNotes,
  registerNoteOff,
  registerNoteOn,
} from '../stores/engineStore';
import { getControlStore } from '../stores/controlStore';
import { getPresetStore, resetPresetStore } from '../stores/presetStore';
import { pulseScreenFeedback } from '../stores/midiStore';
import { pulseVisualEnergy } from '../stores/visualEnergyStore';
import type { TransportActionSource } from './types';
import {
  getHoldEnabled,
  getTransportStore,
  isTransportAudioReady,
  isTransportLoading,
  isTransportPlaying,
  patchTransportStore,
  setTransportError,
  setTransportState,
  syncTransportPlayingState,
} from './transportStore';

function emitTransportFeedback(
  kind: 'play' | 'stop' | 'padHit' | 'presetChange' | 'knobTwist',
  velocity = 100,
  detail?: string,
): void {
  pulseScreenFeedback(velocity, kind, detail);
}

export async function startTransportAudio(): Promise<void> {
  if (isTransportAudioReady() || isTransportLoading()) {
    return;
  }

  setTransportError(null);
  setTransportState('loading');

  try {
    await startAudioEngine();
    const { defaultIndex } = bootstrapPresetCatalog();
    const store = getControlStore();
    engineAdapter.applyControlSurface(store.sound, store.modulation);
    await loadPresetAtIndex(defaultIndex, { silent: true });
    patchTransportStore({ transportState: 'ready', chordActive: false, ambientActive: false });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Audio could not start.';
    console.error('[Plantasia Transport] Audio start failed:', caught);
    setTransportError(message);
    setTransportState('idle');
    resetPresetStore();
  }
}

/** Play — awaken ambient audiovisual session (Milestone 13D). */
export async function transportPlay(_source: TransportActionSource = 'ui'): Promise<void> {
  if (!isTransportAudioReady()) {
    return;
  }

  const preset = getPresetStore().activePreset;
  if (!preset) {
    return;
  }

  try {
    patchTransportStore({ ambientActive: true, chordActive: false });
    await engineAdapter.startAmbientPlayback(preset);
    syncTransportPlayingState();
    pulseVisualEnergy('ui', 100);
    emitTransportFeedback('play', 110);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Ambient playback could not start.';
    patchTransportStore({ ambientActive: false });
    setTransportError(message);
  }
}

/** Stop — fade ambient audio and return to Home visuals. */
export async function transportStop(_source: TransportActionSource = 'ui'): Promise<void> {
  if (!isTransportAudioReady()) {
    return;
  }

  try {
    patchTransportStore({ ambientActive: false, chordActive: false });
    syncTransportPlayingState();
    stopEngineNote();
    clearActiveNotes();
    await engineAdapter.stopAmbientPlayback(true);
    setTransportState('ready');
    pulseVisualEnergy('ui', 40);
    emitTransportFeedback('stop', 90);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Playback could not stop.';
    setTransportError(message);
  }
}

/** Spacebar / primary transport toggle — start audio, play, or stop. */
export async function toggleTransportPlayStop(source: TransportActionSource = 'keyboard'): Promise<void> {
  const { transportState } = getTransportStore();

  if (transportState === 'idle') {
    await startTransportAudio();
    if (isTransportAudioReady()) {
      await transportPlay(source);
    }
    return;
  }

  if (transportState === 'loading') {
    return;
  }

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
  if (!engineAdapter.isAudioRunning()) {
    return;
  }

  try {
    engineAdapter.noteOn(midi, velocity);
    registerNoteOn(midi, velocity, source);
    syncTransportPlayingState();
    emitTransportFeedback('padHit', velocity);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Note could not play.';
    setTransportError(message);
  }
}

export function transportNoteOff(midi: number): void {
  if (getHoldEnabled()) {
    return;
  }

  engineAdapter.noteOff(midi);
  registerNoteOff(midi);
  syncTransportPlayingState();
  emitTransportFeedback('padHit', 55);
}

export async function transportSelectPreset(
  index: number,
  preserveControls = false,
): Promise<void> {
  if (!isTransportAudioReady()) {
    return;
  }

  const catalog = buildPresetCatalog();
  if (catalog.length === 0) {
    return;
  }

  const wrapped = ((index % catalog.length) + catalog.length) % catalog.length;
  const wasAmbient = getTransportStore().ambientActive;

  try {
    await loadPresetAtIndex(wrapped, { preserveControls, silent: true });
    setTransportError(null);
    patchTransportStore({ chordActive: false });
    syncTransportPlayingState();
    emitTransportFeedback('presetChange', 127);
    pulseVisualEnergy('preset', 90);

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

/** Legacy reconcile — no-op while ambient session drives playing state. */
export function transportReconcileChordIdle(): void {
  syncTransportPlayingState();
}