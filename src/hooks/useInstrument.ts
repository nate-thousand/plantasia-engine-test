import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
  getEngineStore,
  patchEngineStore,
  registerNoteOff,
  registerNoteOn,
  subscribeEngineStore,
} from '../stores/engineStore';
import type {
  ModulationControlValues,
  OrganismVisualParams,
  PresetSummary,
  SoundControlValues,
} from '../types/instrument';
import {
  createOrganismForParams,
  midiStateIndicator,
  visualStateIndicator,
  type InstrumentVisualState,
} from '../visuals/organism/InstrumentVisualState';
import { renderOrganism } from '../visuals/organism/Renderer';

const DEFAULT_SOUND: SoundControlValues = {
  volume: 72,
  tone: 50,
  texture: 40,
  bloom: 35,
};

const DEFAULT_MODULATION: ModulationControlValues = {
  growthRate: 45,
  drift: 30,
  mutation: 20,
  energy: 55,
};

export function useInstrument() {
  const engineStore = useSyncExternalStore(subscribeEngineStore, getEngineStore, getEngineStore);
  const [manualVisual, setManualVisual] = useState<InstrumentVisualState>('dormant');
  const [holdEnabled, setHoldEnabled] = useState(false);
  const [midiLearn, setMidiLearn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [presetIndex, setPresetIndex] = useState(0);
  const [sound, setSound] = useState<SoundControlValues>(DEFAULT_SOUND);
  const [modulation, setModulation] = useState<ModulationControlValues>(DEFAULT_MODULATION);
  const [midiPulse, setMidiPulse] = useState(false);

  const keyboardRef = useRef<KeyboardInput | null>(null);
  const midiRef = useRef<MidiInputManager | null>(null);

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

  const organismParams: OrganismVisualParams = useMemo(() => {
    const pulseBoost = midiPulse ? 20 : 0;
    const baseEnergy =
      engineStore.activeNoteCount > 0
        ? Math.max(modulation.energy, engineStore.inputEnergy)
        : modulation.energy;

    return {
      visualState,
      energy: Math.min(100, baseEnergy + pulseBoost),
      mutation: modulation.mutation,
      bloom: sound.bloom,
      tone: sound.tone,
      texture: sound.texture,
      growthRate: modulation.growthRate,
      drift: modulation.drift,
    };
  }, [
    visualState,
    modulation.energy,
    modulation.mutation,
    modulation.growthRate,
    modulation.drift,
    sound.bloom,
    sound.tone,
    sound.texture,
    engineStore.activeNoteCount,
    engineStore.inputEnergy,
    midiPulse,
  ]);

  const organism = useMemo(() => createOrganismForParams(organismParams), [organismParams]);
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
    engineAdapter.noteOff(midi);
    registerNoteOff();
  }, []);

  useEffect(() => {
    if (audioReady && engineStore.activeNoteCount === 0 && manualVisual === 'playing') {
      setManualVisual('resting');
    }
  }, [audioReady, engineStore.activeNoteCount, manualVisual]);

  useEffect(() => {
    if (engineStore.midiActivityTick === 0) {
      return;
    }

    setMidiPulse(true);
    const timeoutId = window.setTimeout(() => setMidiPulse(false), 180);
    return () => window.clearTimeout(timeoutId);
  }, [engineStore.midiActivityTick]);

  useEffect(() => {
    const keyboard = new KeyboardInput({
      onNoteOn: (midi, velocity) => handleNoteOn(midi, velocity),
      onNoteOff: (midi) => handleNoteOff(midi),
    });

    keyboardRef.current = keyboard;
    keyboard.attach();

    const midi = new MidiInputManager({
      onNoteOn: (midi, velocity) => handleNoteOn(midi, velocity),
      onNoteOff: (midi) => handleNoteOff(midi),
    });

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

  const applySurface = useCallback(
    (soundValues: SoundControlValues, modulationValues: ModulationControlValues) => {
      if (!audioReady) {
        return;
      }

      engineAdapter.applyControlSurface(soundValues, modulationValues);
    },
    [audioReady],
  );

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
      patchEngineStore({ activeNoteCount: 0, inputEnergy: 0 });
      setManualVisual('resting');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not stop.';
      setError(message);
    }
  }, [audioReady]);

  const updateSound = useCallback(
    (key: keyof SoundControlValues, value: number) => {
      setSound((current) => {
        const next = { ...current, [key]: value };
        if (audioReady) {
          engineAdapter.applySoundControls(next, modulation);
        }
        return next;
      });
    },
    [modulation, audioReady],
  );

  const updateModulation = useCallback(
    (key: keyof ModulationControlValues, value: number) => {
      setModulation((current) => {
        const next = { ...current, [key]: value };
        applySurface(sound, next);
        return next;
      });
    },
    [sound, applySurface],
  );

  const toggleHold = useCallback(() => {
    setHoldEnabled((current) => !current);
  }, []);

  const toggleMidiLearn = useCallback(() => {
    setMidiLearn((current) => !current);
  }, []);

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

  return {
    organismAscii,
    overlay: {
      audioIndicator: visualStateIndicator(visualState),
      presetName: currentPresetName,
      midiIndicator: midiStateIndicator(engineStore.midiState),
      midiDeviceName: engineStore.selectedDeviceName,
      lastNoteLabel: engineStore.lastNoteLabel,
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
    },
    modulation: {
      values: modulation,
      onChange: updateModulation,
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
      learnEnabled: midiLearn,
      supported: MidiInputManager.isSupported(),
      onConnect: () => void connectMidi(),
      onSelectDevice: selectMidiDevice,
      onToggleLearn: toggleMidiLearn,
    },
    error,
  };
}

export type UseInstrumentReturn = ReturnType<typeof useInstrument>;
