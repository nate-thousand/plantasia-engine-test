import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, useState } from 'react';
import { engineAdapter } from '../audio/EngineAdapter';
import { startAudioEngine, playEngineNote, stopEngineNote } from '../audio/engine';
import {
  bootstrapPresetCatalog,
  buildPresetCatalog,
  loadPresetAtIndex,
  randomPresetIndex,
} from '../audio/presets';
import { resolvePresetIndexFromProgram } from '../input/PresetMidiDefaults';
import { formatCategoryLabel } from '../presets/categories';
import { KeyboardInput } from '../input/KeyboardInput';
import { MidiInputManager } from '../input/MidiInput';
import {
  disableMidiLearn,
  setLearnTarget,
  toggleMidiLearn,
} from '../input/MidiLearn';
import type { MidiControlTarget } from '../input/MidiDefaults';
import { registerMidiActionHandlers, initMidiPipeline } from '../input/MidiRouter';
import {
  getControlStore,
  subscribeControlChanges,
  subscribeControlStore,
  updateModulationControl,
  updateSoundControl,
} from '../stores/controlStore';
import {
  getEngineStore,
  patchEngineStore,
  clearActiveNotes,
  registerNoteOff,
  registerNoteOn,
  subscribeEngineStore,
} from '../stores/engineStore';
import { getMidiStore, subscribeMidiStore, pulseScreenFeedback } from '../stores/midiStore';
import {
  getPresetStore,
  resetPresetStore,
  subscribePresetStore,
} from '../stores/presetStore';
import type {
  ModulationControlValues,
  PresetSummary,
  SoundControlValues,
} from '../types/instrument';
import {
  midiStateIndicator,
  visualStateIndicator,
  type InstrumentVisualState,
} from '../visuals/organism/InstrumentVisualState';

function catalogToSummaries(
  catalog: ReturnType<typeof bootstrapPresetCatalog>['catalog'],
): PresetSummary[] {
  return catalog.map((entry) => ({
    id: entry.metadata.id,
    name: entry.metadata.name,
    index: entry.index,
    category: entry.metadata.category,
    description: entry.metadata.description,
    mood: entry.metadata.mood,
    species: entry.metadata.species,
    asciiState: entry.metadata.asciiState,
    tags: entry.metadata.tags,
    visual: entry.metadata.visual,
  }));
}

export function useInstrument() {
  const engineStore = useSyncExternalStore(subscribeEngineStore, getEngineStore, getEngineStore);
  const controlStore = useSyncExternalStore(subscribeControlStore, getControlStore, getControlStore);
  const midiStore = useSyncExternalStore(subscribeMidiStore, getMidiStore, getMidiStore);
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);

  const sound = controlStore.sound;
  const modulation = controlStore.modulation;

  const [manualVisual, setManualVisual] = useState<InstrumentVisualState>('dormant');
  const [holdEnabled, setHoldEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [presetIndex, setPresetIndex] = useState(0);
  const [keyboardOctave, setKeyboardOctave] = useState(0);

  const keyboardRef = useRef<KeyboardInput | null>(null);
  const midiRef = useRef<MidiInputManager | null>(null);
  const holdEnabledRef = useRef(holdEnabled);
  const presetIndexRef = useRef(presetIndex);
  const presetsLengthRef = useRef(presets.length);

  holdEnabledRef.current = holdEnabled;
  presetIndexRef.current = presetIndex;
  presetsLengthRef.current = presets.length;

  const audioReady = engineStore.audioReady;
  const isInitializing = engineStore.isInitializing;

  const activePreset = presetStore.activePreset;
  const activeMetadata = presetStore.activeMetadata;

  const visualState: InstrumentVisualState = useMemo(() => {
    if (!audioReady) {
      return 'dormant';
    }

    if (engineStore.activeNoteCount > 0) {
      return 'playing';
    }

    if (manualVisual === 'dormant') {
      return 'active';
    }

    return manualVisual;
  }, [audioReady, engineStore.activeNoteCount, manualVisual]);

  const organismStateLabel = useMemo(() => {
    if (!audioReady) {
      return 'dormant';
    }
    if (engineStore.activeNoteCount > 0) {
      return 'playing';
    }
    return visualState === 'active' ? 'active' : visualState;
  }, [audioReady, engineStore.activeNoteCount, visualState]);

  const currentPresetName = audioReady ? (activeMetadata?.name ?? presets[presetIndex]?.name ?? '—') : '—';
  const currentPresetCategory = activeMetadata?.category
    ? formatCategoryLabel(activeMetadata.category)
    : null;

  const handleNoteOn = useCallback((midi: number, velocity: number) => {
    if (!engineAdapter.isAudioRunning()) {
      return;
    }

    try {
      engineAdapter.noteOn(midi, velocity);
      registerNoteOn(midi, velocity);
      pulseScreenFeedback(velocity, 'padHit');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not play.';
      setError(message);
    }
  }, []);

  const handleNoteOff = useCallback((midi: number) => {
    if (holdEnabledRef.current) {
      return;
    }
    engineAdapter.noteOff(midi);
    registerNoteOff(midi);
    pulseScreenFeedback(55, 'padHit');
  }, []);

  const selectPreset = useCallback(
    async (index: number, preserveControls = false) => {
      if (!audioReady || presets.length === 0) {
        return;
      }

      const wrapped = ((index % presets.length) + presets.length) % presets.length;

      try {
        await loadPresetAtIndex(wrapped, { preserveControls });
        setPresetIndex(wrapped);
        setError(null);
        pulseScreenFeedback(127, 'presetChange');
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Preset could not load.';
        setError(message);
      }
    },
    [audioReady, presets.length],
  );

  const play = useCallback(() => {
    if (!audioReady) {
      return;
    }

    try {
      playEngineNote();
      setManualVisual('playing');
      pulseScreenFeedback(110, 'play');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not play.';
      setError(message);
    }
  }, [audioReady]);

  const stop = useCallback(() => {
    if (!audioReady) {
      return;
    }

    try {
      stopEngineNote();
      clearActiveNotes();
      setManualVisual('resting');
      pulseScreenFeedback(90, 'stop');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not stop.';
      setError(message);
    }
  }, [audioReady]);

  const toggleHold = useCallback(() => {
    setHoldEnabled((current) => !current);
    pulseScreenFeedback(70, 'knobTwist', 'hold');
  }, []);

  const setHold = useCallback((enabled: boolean) => {
    setHoldEnabled(enabled);
  }, []);

  useEffect(() => {
    initMidiPipeline();

    registerMidiActionHandlers({
      onPlay: play,
      onStop: stop,
      onToggleHold: toggleHold,
      onSetHold: setHold,
      onPresetPrevious: () => void selectPreset(presetIndexRef.current - 1),
      onPresetNext: () => void selectPreset(presetIndexRef.current + 1),
      onPresetRandom: () =>
        void selectPreset(randomPresetIndex(presetIndexRef.current, presetsLengthRef.current)),
      onProgramChange: (program) => {
        const catalog = buildPresetCatalog();
        const index = resolvePresetIndexFromProgram(program, catalog);
        if (index !== null) {
          void selectPreset(index);
        }
      },
    });

    return () => registerMidiActionHandlers(null);
  }, [play, stop, toggleHold, setHold, selectPreset]);

  useEffect(() => {
    return subscribeControlChanges((nextSound, nextModulation, source) => {
      if (source === 'midi' && engineAdapter.isAudioRunning()) {
        engineAdapter.applyControlSurface(nextSound, nextModulation);
      }
    });
  }, []);

  useEffect(() => {
    if (audioReady && engineStore.activeNoteCount === 0 && manualVisual === 'playing') {
      setManualVisual('resting');
    }
  }, [audioReady, engineStore.activeNoteCount, manualVisual]);

  useEffect(() => {
    const keyboard = new KeyboardInput({
      onNoteOn: (midi, velocity) => handleNoteOn(midi, velocity),
      onNoteOff: (midi) => handleNoteOff(midi),
      onOctaveChange: (offset) => setKeyboardOctave(offset),
    });

    keyboardRef.current = keyboard;
    keyboard.attach();

    const midi = new MidiInputManager();
    midiRef.current = midi;

    return () => {
      keyboard.detach();
      midi.disconnect();
      keyboardRef.current = null;
      midiRef.current = null;
    };
  }, [handleNoteOn, handleNoteOff]);

  useEffect(() => {
    keyboardRef.current?.setEnabled(audioReady && engineStore.keyboardEnabled);
  }, [audioReady, engineStore.keyboardEnabled]);

  useEffect(() => {
    setPresetIndex(presetStore.activeIndex);
  }, [presetStore.activeIndex]);

  const startAudio = useCallback(async () => {
    setError(null);
    patchEngineStore({ isInitializing: true });

    try {
      await startAudioEngine();
      const { catalog, defaultIndex } = bootstrapPresetCatalog();
      const summaries = catalogToSummaries(catalog);
      setPresets(summaries);
      setPresetIndex(defaultIndex);
      engineAdapter.applyControlSurface(sound, modulation);
      await loadPresetAtIndex(defaultIndex);
      patchEngineStore({ audioReady: true, isInitializing: false, keyboardEnabled: true });
      setManualVisual('active');
      pulseScreenFeedback(120, 'play');
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Audio could not start.';
      console.error('[Plantasia Engine Test] Audio start failed:', caught);
      setError(message);
      patchEngineStore({ isInitializing: false });
      resetPresetStore();
    }
  }, [sound, modulation]);

  const updateSound = useCallback(
    (key: keyof SoundControlValues, value: number) => {
      updateSoundControl(key, value, 'ui');
      if (engineAdapter.isAudioRunning()) {
        const store = getControlStore();
        engineAdapter.applyControlSurface(store.sound, store.modulation);
      }
    },
    [],
  );

  const updateModulation = useCallback(
    (key: keyof ModulationControlValues, value: number) => {
      updateModulationControl(key, value, 'ui');
      if (engineAdapter.isAudioRunning()) {
        const store = getControlStore();
        engineAdapter.applyControlSurface(store.sound, store.modulation);
      }
    },
    [],
  );

  const connectMidi = useCallback(async () => {
    setError(null);

    try {
      await midiRef.current?.connect();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'MIDI could not connect.';
      setError(message);
      patchEngineStore({ midiState: 'off' });
    }
  }, []);

  const selectMidiDevice = useCallback((deviceId: string) => {
    midiRef.current?.selectDevice(deviceId);
  }, []);

  const handleToggleLearn = useCallback(() => {
    const enabled = toggleMidiLearn();
    if (!enabled) {
      disableMidiLearn();
    }
  }, []);

  const handleSelectLearnTarget = useCallback((target: MidiControlTarget | null) => {
    setLearnTarget(target);
  }, []);

  const learnLabel =
    midiStore.learnEnabled && midiStore.learnTarget
      ? `Learn: ${midiStore.learnTarget}`
      : midiStore.learnEnabled
        ? 'Learn: pick control'
        : null;

  return {
    activePreset,
    status: {
      audioIndicator: visualStateIndicator(visualState),
      presetName: currentPresetName,
      presetCategory: currentPresetCategory,
      presetDescription: activeMetadata?.description ?? null,
      presetTags: activeMetadata?.tags ?? [],
      organismStateLabel,
      midiIndicator: midiStateIndicator(engineStore.midiState),
      midiDeviceName: engineStore.selectedDeviceName,
      lastNoteLabel: engineStore.lastNoteLabel,
      lastMidiMessage: midiStore.lastMessage,
      learnLabel,
      mappingCount: midiStore.mappingCount,
      lastCcLabel:
        midiStore.lastCcNumber !== null
          ? `CC ${midiStore.lastCcNumber}=${midiStore.lastCcValue ?? '—'}`
          : null,
    },
    transport: {
      audioReady,
      isInitializing,
      holdEnabled,
      onStartAudio: () => void startAudio(),
      onPlay: play,
      onStop: stop,
      onToggleHold: toggleHold,
    },
    presets: {
      items: presets,
      index: presetIndex,
      groups: presetStore.groups,
      onSelect: (index: number, preserveControls?: boolean) =>
        selectPreset(index, preserveControls ?? false),
      onPrevious: (preserveControls?: boolean) =>
        selectPreset(presetIndex - 1, preserveControls ?? false),
      onNext: (preserveControls?: boolean) =>
        selectPreset(presetIndex + 1, preserveControls ?? false),
      onRandom: (preserveControls?: boolean) =>
        selectPreset(randomPresetIndex(presetIndex, presets.length), preserveControls ?? false),
    },
    sound: {
      values: sound,
      onChange: updateSound,
      highlight: controlStore.highlight,
    },
    modulation: {
      values: modulation,
      onChange: updateModulation,
      highlight: controlStore.highlight,
    },
    keyboard: {
      enabled: engineStore.keyboardEnabled && audioReady,
      octaveOffset: keyboardOctave,
    },
    midi: {
      state: engineStore.midiState,
      devices: engineStore.midiDevices,
      selectedDeviceId: engineStore.selectedDeviceId,
      selectedDeviceName: engineStore.selectedDeviceName,
      lastNoteLabel: engineStore.lastNoteLabel,
      learnEnabled: midiStore.learnEnabled,
      learnTarget: midiStore.learnTarget,
      lastMessage: midiStore.lastMessage,
      lastCcNumber: midiStore.lastCcNumber,
      mappingCount: midiStore.mappingCount,
      detectedCcs: midiStore.detectedCcs,
      supported: MidiInputManager.isSupported(),
      onConnect: () => void connectMidi(),
      onSelectDevice: selectMidiDevice,
      onToggleLearn: handleToggleLearn,
      onSelectLearnTarget: handleSelectLearnTarget,
    },
    error,
  };
}

export type UseInstrumentReturn = ReturnType<typeof useInstrument>;
