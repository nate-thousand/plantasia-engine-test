import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, useState } from 'react';
import { engineAdapter } from '../audio/EngineAdapter';
import { formatCategoryLabel } from '../presets/categories';
import { KeyboardInput } from '../input/KeyboardInput';
import { MidiInputManager } from '../input/MidiInput';
import {
  disableMidiLearn,
  setLearnTarget,
  toggleMidiLearn,
} from '../input/MidiLearn';
import type { MidiControlTarget } from '../input/MidiDefaults';
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
  subscribeEngineStore,
} from '../stores/engineStore';
import { getMidiStore, subscribeMidiStore } from '../stores/midiStore';
import {
  getPresetStore,
  subscribePresetStore,
} from '../stores/presetStore';
import { randomPresetIndex } from '../audio/presets';
import {
  ensureInstrumentAudio,
  transportNoteOff,
  transportNoteOn,
  transportSelectPreset,
  transportSetHold,
  transportToggleHold,
} from '../transport/transportActions';
import { attachTransportKeyboard, initTransport } from '../transport/initTransport';
import { getTransportStore, subscribeTransportStore, setTransportError } from '../transport/transportStore';
import { useTransport, transportStateLabel } from '../transport/useTransport';
import type {
  ModulationControlValues,
  PresetSummary,
  SoundControlValues,
} from '../types/instrument';
import {
  midiStateIndicator,
  visualStateIndicator,
} from '../visuals/organism/InstrumentVisualState';

function catalogToSummaries(
  catalog: ReturnType<typeof getPresetStore>['catalog'],
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
  const transportStore = useSyncExternalStore(subscribeTransportStore, getTransportStore, getTransportStore);
  const transport = useTransport();

  const sound = controlStore.sound;
  const modulation = controlStore.modulation;

  const [keyboardOctave, setKeyboardOctave] = useState(0);

  const keyboardRef = useRef<KeyboardInput | null>(null);
  const midiRef = useRef<MidiInputManager | null>(null);

  const presets = useMemo(() => catalogToSummaries(presetStore.catalog), [presetStore.catalog]);
  const presetIndex = presetStore.activeIndex;

  const activePreset = presetStore.activePreset;
  const activeMetadata = presetStore.activeMetadata;

  const visualState = transport.visualState;

  const organismStateLabel = useMemo(() => {
    if (transport.transportState === 'loading') {
      return 'dormant';
    }
    if (engineStore.activeNoteCount > 0 || transport.isPlaying) {
      return 'playing';
    }
    return 'active';
  }, [transport.transportState, transport.isPlaying, engineStore.activeNoteCount]);

  const currentPresetName =
    activeMetadata?.name ?? presets[presetIndex]?.name ?? '—';
  const currentPresetCategory = activeMetadata?.category
    ? formatCategoryLabel(activeMetadata.category)
    : null;

  const selectPreset = useCallback(
    async (index: number, preserveControls = false) => {
      await transportSelectPreset(index, preserveControls);
    },
    [],
  );

  useEffect(() => {
    initTransport();
    const detachKeyboard = attachTransportKeyboard();
    return () => {
      detachKeyboard();
    };
  }, []);

  useEffect(() => {
    return subscribeControlChanges((nextSound, nextModulation, source) => {
      if (!engineAdapter.isAudioRunning()) {
        return;
      }
      if (source === 'midi' || source === 'ui') {
        engineAdapter.applyControlSurface(nextSound, nextModulation);
      }
      if (getTransportStore().ambientActive) {
        engineAdapter.applyAmbientControls(nextSound, nextModulation);
      }
    });
  }, []);

  useEffect(() => {
    const keyboard = new KeyboardInput({
      onNoteOn: (midi, velocity) => transportNoteOn(midi, velocity, 'keyboard'),
      onNoteOff: (midi) => transportNoteOff(midi),
      onOctaveChange: (offset) => setKeyboardOctave(offset),
    });

    keyboardRef.current = keyboard;
    keyboard.attach();

    const midi = new MidiInputManager();
    midiRef.current = midi;

    if (MidiInputManager.isSupported()) {
      void midi.connect().catch(() => undefined);
    }

    return () => {
      keyboard.detach();
      midi.disconnect();
      keyboardRef.current = null;
      midiRef.current = null;
    };
  }, []);

  useEffect(() => {
    keyboardRef.current?.setEnabled(engineStore.keyboardEnabled);
  }, [engineStore.keyboardEnabled]);

  const updateSound = useCallback(
    (key: keyof SoundControlValues, value: number) => {
      updateSoundControl(key, value, 'ui');
      if (!getTransportStore().sessionStarted) {
        return;
      }
      void ensureInstrumentAudio().then((ready) => {
        if (!ready) {
          return;
        }
        const store = getControlStore();
        engineAdapter.applyControlSurface(store.sound, store.modulation);
        if (getTransportStore().ambientActive) {
          engineAdapter.applyAmbientControls(store.sound, store.modulation);
        }
      });
    },
    [],
  );

  const updateModulation = useCallback(
    (key: keyof ModulationControlValues, value: number) => {
      updateModulationControl(key, value, 'ui');
      if (!getTransportStore().sessionStarted) {
        return;
      }
      void ensureInstrumentAudio().then((ready) => {
        if (!ready) {
          return;
        }
        const store = getControlStore();
        engineAdapter.applyControlSurface(store.sound, store.modulation);
        if (getTransportStore().ambientActive) {
          engineAdapter.applyAmbientControls(store.sound, store.modulation);
        }
      });
    },
    [],
  );

  const connectMidi = useCallback(async () => {
    try {
      await midiRef.current?.connect();
      setTransportError(null);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'MIDI could not connect.';
      setTransportError(message);
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

  const midiConnected = engineStore.midiState === 'connected';

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
      transportState: transportStateLabel(transport.transportState, midiConnected),
    },
    transport,
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
        void selectPreset(randomPresetIndex(presetIndex, presets.length), preserveControls ?? false),
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
      enabled: engineStore.keyboardEnabled,
      octaveOffset: keyboardOctave,
      holdEnabled: transportStore.holdEnabled,
      onToggleHold: transportToggleHold,
      onSetHold: transportSetHold,
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
      onConnect: () => void connectMidi().catch(() => undefined),
      onSelectDevice: selectMidiDevice,
      onToggleLearn: handleToggleLearn,
      onSelectLearnTarget: handleSelectLearnTarget,
    },
    error: transportStore.error,
  };
}

export type UseInstrumentReturn = ReturnType<typeof useInstrument>;
