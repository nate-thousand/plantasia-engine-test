import { useCallback, useMemo, useState } from 'react';
import { setOutputVolume, startAudioEngine, playEngineNote, stopEngineNote } from '../audio/engine';
import {
  getPresetCatalog,
  loadPresetAtIndex,
  randomPresetIndex,
} from '../audio/presets';
import type {
  MidiSurfaceState,
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
  const [visualState, setVisualState] = useState<InstrumentVisualState>('dormant');
  const [audioReady, setAudioReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [holdEnabled, setHoldEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [presetIndex, setPresetIndex] = useState(0);
  const [sound, setSound] = useState<SoundControlValues>(DEFAULT_SOUND);
  const [modulation, setModulation] = useState<ModulationControlValues>(DEFAULT_MODULATION);
  const [midiLearn, setMidiLearn] = useState(false);
  const [midiState] = useState<MidiSurfaceState>('off');

  const organismParams: OrganismVisualParams = useMemo(
    () => ({
      visualState,
      energy: modulation.energy,
      mutation: modulation.mutation,
      bloom: sound.bloom,
      tone: sound.tone,
      texture: sound.texture,
      growthRate: modulation.growthRate,
      drift: modulation.drift,
    }),
    [
      visualState,
      modulation.energy,
      modulation.mutation,
      modulation.growthRate,
      modulation.drift,
      sound.bloom,
      sound.tone,
      sound.texture,
    ],
  );

  const organism = useMemo(() => createOrganismForParams(organismParams), [organismParams]);
  const organismAscii = useMemo(() => renderOrganism(organism), [organism]);

  const currentPresetName = audioReady ? (presets[presetIndex]?.name ?? '—') : '—';

  const startAudio = useCallback(async () => {
    setError(null);
    setIsInitializing(true);

    try {
      await startAudioEngine({ volume: sound.volume });
      const catalog = getPresetCatalog().map((preset) => ({
        id: preset.id,
        name: preset.name,
      }));
      setPresets(catalog);
      setPresetIndex(0);
      loadPresetAtIndex(0);
      setAudioReady(true);
      setVisualState('active');
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Audio could not start.';
      console.error('[Plantasia Engine Test] Audio start failed:', caught);
      setError(message);
    } finally {
      setIsInitializing(false);
    }
  }, [sound.volume]);

  const selectPreset = useCallback(
    (index: number) => {
      if (!audioReady || presets.length === 0) {
        return;
      }

      const wrapped = ((index % presets.length) + presets.length) % presets.length;

      try {
        loadPresetAtIndex(wrapped);
        setPresetIndex(wrapped);
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
      setVisualState('playing');
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
      setVisualState('resting');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Note could not stop.';
      setError(message);
    }
  }, [audioReady]);

  const updateSound = useCallback(
    (key: keyof SoundControlValues, value: number) => {
      setSound((current) => ({ ...current, [key]: value }));

      if (key === 'volume' && audioReady) {
        setOutputVolume(value);
      }

      // Tone, texture, bloom: organism visual mapping only — audio deferred.
    },
    [audioReady],
  );

  const updateModulation = useCallback((key: keyof ModulationControlValues, value: number) => {
    setModulation((current) => ({ ...current, [key]: value }));
    // Growth, drift, mutation, energy: organism visual mapping only — audio deferred.
  }, []);

  const toggleHold = useCallback(() => {
    setHoldEnabled((current) => !current);
    // Hold: placeholder — future sustain / voice hold behavior.
  }, []);

  const toggleMidiLearn = useCallback(() => {
    setMidiLearn((current) => !current);
    // MIDI Learn: placeholder — future Web MIDI milestone.
  }, []);

  return {
    organismAscii,
    overlay: {
      audioIndicator: visualStateIndicator(visualState),
      presetName: currentPresetName,
      midiIndicator: midiStateIndicator(midiState),
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
    midi: {
      state: midiState,
      learnEnabled: midiLearn,
      onToggleLearn: toggleMidiLearn,
    },
    error,
  };
}

export type UseInstrumentReturn = ReturnType<typeof useInstrument>;
