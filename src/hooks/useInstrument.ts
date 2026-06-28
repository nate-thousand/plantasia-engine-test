import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, useState } from 'react';
import { engineAdapter } from '../audio/EngineAdapter';
import { startAudioEngine, playEngineNote, stopEngineNote } from '../audio/engine';
import {
  getPresetCatalog,
  loadPresetAtIndex,
  randomPresetIndex,
} from '../audio/presets';
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
import { getMidiStore, subscribeMidiStore } from '../stores/midiStore';
import type {
  ModulationControlValues,
  PresetSummary,
  SoundControlValues,
} from '../types/instrument';
import {
  buildOrganismState,
  midiStateIndicator,
  organismStateLabel,
  visualStateIndicator,
  type InstrumentVisualState,
} from '../visuals/organism/InstrumentVisualState';
import { buildOrganismFromState } from '../visuals/organism/OrganismMappings';
import { renderOrganism } from '../visuals/organism/Renderer';

export function useInstrument() {
  const engineStore = useSyncExternalStore(subscribeEngineStore, getEngineStore, getEngineStore);
  const controlStore = useSyncExternalStore(subscribeControlStore, getControlStore, getControlStore);
  const midiStore = useSyncExternalStore(subscribeMidiStore, getMidiStore, getMidiStore);

  const sound = controlStore.sound;
  const modulation = controlStore.modulation;

  const [manualVisual, setManualVisual] = useState<InstrumentVisualState>('dormant');
  const [holdEnabled, setHoldEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [presetIndex, setPresetIndex] = useState(0);

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

  const organismState = useMemo(
    () => {
      const pulseBoost = midiStore.interactionBurst;
      const energy =
        engineStore.activeNoteCount > 0
          ? Math.max(modulation.energy, engineStore.inputEnergy)
          : modulation.energy;

      return buildOrganismState({
        audioReady,
        visualState,
        activeNotes: engineStore.activeNotes,
        lastNote:
          engineStore.activeNotes.length > 0
            ? engineStore.activeNotes[engineStore.activeNotes.length - 1]
            : null,
        sound,
        modulation: {
          ...modulation,
          energy: Math.min(100, energy + pulseBoost),
        },
        preset: presets[presetIndex] ?? null,
        interactionBoost: Math.min(
          100,
          pulseBoost + (engineStore.midiActivityTick > 0 ? 15 : 0),
        ),
      });
    },
    [
      audioReady,
      visualState,
      engineStore.activeNotes,
      engineStore.activeNoteCount,
      engineStore.inputEnergy,
      engineStore.midiActivityTick,
      midiStore.interactionBurst,
      sound,
      modulation,
      presets,
      presetIndex,
    ],
  );

  const organism = useMemo(
    () => buildOrganismFromState(organismState),
    [organismState],
  );
  const organismAscii = useMemo(() => renderOrganism(organism), [organism]);

  const currentPresetName = audioReady ? (presets[presetIndex]?.name ?? '—') : '—';

  const handleNoteOn = useCallback((midi: number, velocity: number) => {
    if (!engineAdapter.isAudioRunning()) {
      return;
    }

    try {
      engineAdapter.noteOn(midi, velocity);
      registerNoteOn(midi, velocity);
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
  }, []);

  const selectPreset = useCallback(
    async (index: number) => {
      if (!audioReady || presets.length === 0) {
        return;
      }

      const wrapped = ((index % presets.length) + presets.length) % presets.length;

      try {
        engineAdapter.applyControlSurface(sound, modulation);
        await loadPresetAtIndex(wrapped);
        setPresetIndex(wrapped);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Preset could not load.';
        setError(message);
      }
    },
    [audioReady, presets.length, sound, modulation],
  );

  const play = useCallback(() => {
    if (!audioReady) {
      return;
    }

    try {
      playEngineNote();
      setManualVisual('playing');
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
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not stop.';
      setError(message);
    }
  }, [audioReady]);

  const toggleHold = useCallback(() => {
    setHoldEnabled((current) => !current);
  }, []);

  useEffect(() => {
    initMidiPipeline();

    registerMidiActionHandlers({
      onPlay: play,
      onStop: stop,
      onToggleHold: toggleHold,
      onPresetPrevious: () => void selectPreset(presetIndexRef.current - 1),
      onPresetNext: () => void selectPreset(presetIndexRef.current + 1),
      onPresetRandom: () =>
        void selectPreset(randomPresetIndex(presetIndexRef.current, presetsLengthRef.current)),
      onProgramChange: (program) => void selectPreset(program),
    });

    return () => registerMidiActionHandlers(null);
  }, [play, stop, toggleHold, selectPreset]);

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

  const startAudio = useCallback(async () => {
    setError(null);
    patchEngineStore({ isInitializing: true });

    try {
      await startAudioEngine();
      const catalog = getPresetCatalog().map((preset) => ({
        id: preset.id,
        name: preset.name,
      }));
      setPresets(catalog);
      setPresetIndex(0);
      engineAdapter.applyControlSurface(sound, modulation);
      await loadPresetAtIndex(0);
      patchEngineStore({ audioReady: true, isInitializing: false, keyboardEnabled: true });
      setManualVisual('active');
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Audio could not start.';
      console.error('[Plantasia Engine Test] Audio start failed:', caught);
      setError(message);
      patchEngineStore({ isInitializing: false });
    }
  }, [sound, modulation]);

  const updateSound = useCallback(
    (key: keyof SoundControlValues, value: number) => {
      updateSoundControl(key, value, 'ui');
      if (engineAdapter.isAudioRunning()) {
        const store = getControlStore();
        engineAdapter.applySoundControls(store.sound, store.modulation);
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
    organismAscii,
    overlay: {
      audioIndicator: visualStateIndicator(visualState),
      presetName: currentPresetName,
      organismStateLabel: organismStateLabel(
        organismState.stateLabel,
        engineStore.activeNoteCount,
      ),
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
      onSelect: selectPreset,
      onPrevious: () => selectPreset(presetIndex - 1),
      onNext: () => selectPreset(presetIndex + 1),
      onRandom: () => selectPreset(randomPresetIndex(presetIndex, presets.length)),
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
