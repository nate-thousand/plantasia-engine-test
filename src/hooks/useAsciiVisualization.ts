import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { sampleAudioFeedback } from '../audio/visualization/AudioTap';
import { getControlStore } from '../stores/controlStore';
import { getEngineStore, subscribeEngineStore } from '../stores/engineStore';
import { getMidiStore, decayInteractionBurst } from '../stores/midiStore';
import {
  getPointerStore,
  updatePointerGrid,
  clearPointer,
  decayPointerActivity,
} from '../stores/pointerStore';
import { tickVisualEnergy } from '../stores/visualEnergyStore';
import {
  getVizAccessibility,
  initVizAccessibility,
  subscribeVizAccessibility,
} from '../stores/visualizationStore';
import { getPresetStore, subscribePresetStore } from '../stores/presetStore';
import { AsciiEngine } from '../visualization/AsciiEngine';
import { TARGET_VIZ_FPS } from '../visualization/VisualFeedback';
import {
  buildSliderVizState,
  detectSliderChanges,
  type SliderVizState,
} from '../visualization/SliderVisualEffects';
import { behaviorFromVisualEnergy } from '../visualization/VisualEnergy';
import { computeViewportLayout } from '../visualization/viewportLayout';
import type { VizInputSnapshot } from '../visualization/types';

export type AsciiVisualizationProps = {
  presetId?: string;
  presetName?: string;
};

export type AsciiDisplayMetrics = {
  fontSizePx: number;
  scale: number;
  gridWidth: number;
  gridHeight: number;
};

/** Reference cell size used to derive grid dimensions from the container. */
const REF_CHAR_WIDTH = 10;
const REF_CHAR_HEIGHT = 16;
const FRAME_MS = 1000 / TARGET_VIZ_FPS;
const PRESET_TRANSITION_MS = 1400;

const silentAudio = {
  amplitude: 0,
  peak: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  brightness: 0,
  isActive: false,
  spectrum: [] as number[],
  waveform: [] as number[],
};

export function useAsciiVisualization(props: AsciiVisualizationProps = {}) {
  const engineStore = useSyncExternalStore(subscribeEngineStore, getEngineStore, getEngineStore);
  const presetStore = useSyncExternalStore(subscribePresetStore, getPresetStore, getPresetStore);
  const accessibility = useSyncExternalStore(
    subscribeVizAccessibility,
    getVizAccessibility,
    getVizAccessibility,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const engineRef = useRef<AsciiEngine | null>(null);
  const frameRef = useRef<number | null>(null);
  const prevSlidersRef = useRef<SliderVizState | null>(null);
  const presetTransitionRef = useRef(0);
  const lastPresetIdRef = useRef('');
  const presetRef = useRef({
    presetId: props.presetId ?? 'seed',
    presetName: props.presetName ?? 'Seed',
  });

  useEffect(() => {
    const active = presetStore.activePreset;
    const metadata = presetStore.activeMetadata;
    presetRef.current = {
      presetId: active?.id ?? props.presetId ?? 'seed',
      presetName: metadata?.name ?? props.presetName ?? 'Seed',
    };
  }, [presetStore.activePreset, presetStore.activeMetadata, props.presetId, props.presetName]);

  const [displayMetrics, setDisplayMetrics] = useState<AsciiDisplayMetrics>({
    fontSizePx: 10,
    scale: 1,
    gridWidth: 47,
    gridHeight: 33,
  });

  useEffect(() => {
    initVizAccessibility();
  }, []);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AsciiEngine({
        initialDimensions: { width: 47, height: 33 },
        accessibility,
      });
    } else {
      engineRef.current.setAccessibility(accessibility);
    }
  }, [accessibility]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !engineRef.current) {
      return;
    }

    const updateGrid = () => {
      const engine = engineRef.current;
      if (!engine) {
        return;
      }

      const { width, height } = container.getBoundingClientRect();
      const layout = computeViewportLayout(width, height, REF_CHAR_WIDTH, REF_CHAR_HEIGHT);
      engine.resize(width, height, REF_CHAR_WIDTH, REF_CHAR_HEIGHT);
      setDisplayMetrics({
        fontSizePx: layout.fontSizePx,
        scale: layout.scale,
        gridWidth: layout.width,
        gridHeight: layout.height,
      });
    };

    updateGrid();
    const observer = new ResizeObserver(updateGrid);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!engineStore.audioReady) {
      engineRef.current?.softReset();
    }
  }, [engineStore.audioReady]);

  useEffect(() => {
    let lastPaint = 0;

    const paint = (time: number, force = false) => {
      const engine = engineRef.current;
      const pre = preRef.current;
      if (!engine || !pre) {
        return;
      }

      if (!force && time - lastPaint < FRAME_MS) {
        return;
      }

      const deltaMs = lastPaint > 0 ? time - lastPaint : FRAME_MS;
      lastPaint = time;

      const engineStore = getEngineStore();
      const controlStore = getControlStore();
      const midiStore = getMidiStore();
      const accessibility = getVizAccessibility();

      decayInteractionBurst();
      decayPointerActivity();

      const audio = engineStore.audioReady ? sampleAudioFeedback() : silentAudio;
      const pointerState = getPointerStore();
      const presetState = getPresetStore();
      const activePreset = presetState.activePreset;
      const activeMetadata = presetState.activeMetadata;
      const { presetId: currentPresetId, presetName: currentPresetName } = presetRef.current;

      if (currentPresetId !== lastPresetIdRef.current) {
        if (lastPresetIdRef.current) {
          presetTransitionRef.current = 1;
        }
        lastPresetIdRef.current = currentPresetId;
      }
      presetTransitionRef.current = Math.max(
        0,
        presetTransitionRef.current - deltaMs / PRESET_TRANSITION_MS,
      );

      const sliders = buildSliderVizState(controlStore.sound, controlStore.modulation);
      const sliderChanges = prevSlidersRef.current
        ? detectSliderChanges(prevSlidersRef.current, sliders)
        : [];
      prevSlidersRef.current = sliders;
      const sliderDelta =
        sliderChanges.length > 0
          ? Math.max(...sliderChanges.map((change) => Math.abs(change.delta))) / 100
          : 0;

      const energyState = tickVisualEnergy(
        {
          audio,
          activeNotes: engineStore.activeNotes,
          pointerActivity: pointerState.activity,
          pointerVelocity: pointerState.velocity,
          pointerActive: pointerState.active,
          isTouch: pointerState.isTouch,
          sliderCombined: sliders.combined,
          sliderDelta,
          presetTransition: presetTransitionRef.current,
          interactionBoost: midiStore.interactionBurst,
          reduceMotion: accessibility.reduceMotion,
        },
        deltaMs,
        accessibility,
      );

      const energyBehavior = behaviorFromVisualEnergy(
        energyState.visualEnergy,
        energyState.sources,
        accessibility.reduceMotion,
      );

      const snapshot: VizInputSnapshot = {
        audioReady: engineStore.audioReady,
        activeNotes: engineStore.activeNotes,
        sound: controlStore.sound,
        modulation: controlStore.modulation,
        presetId: currentPresetId,
        presetName: currentPresetName,
        activePreset,
        asciiState: activeMetadata?.asciiState ?? activePreset?.asciiState ?? 'seed',
        engineSpecies: activeMetadata?.species ?? activePreset?.species ?? '',
        category: activeMetadata?.category ?? null,
        visualMetadata: activeMetadata?.visual ?? {},
        interactionBoost: midiStore.interactionBurst,
        audio,
        time: time / 1000,
        pitchBend: midiStore.pitchBend,
        modWheel: midiStore.modWheel,
        channelPressure: midiStore.channelPressure,
        midiEffectTick: midiStore.midiVisualEffect?.tick ?? 0,
        midiEffectKind: midiStore.midiVisualEffect?.kind ?? null,
        midiEffectIntensity: midiStore.midiVisualEffect?.intensity ?? 0,
        controlHighlightTick: controlStore.highlight?.tick ?? 0,
        pointer: {
          gridX: pointerState.gridX,
          gridY: pointerState.gridY,
          active: pointerState.active,
          activity: pointerState.activity,
          velocity: pointerState.velocity,
          isTouch: pointerState.isTouch,
        },
        energy: energyState,
        energyBehavior,
        presetTransition: presetTransitionRef.current,
      };

      pre.textContent = engine.tick(snapshot, deltaMs);
    };

    const loop = (time: number) => {
      frameRef.current = requestAnimationFrame(loop);
      paint(time);
    };

    paint(performance.now(), true);
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    preRef,
    accessibility,
    audioActive: engineStore.audioReady,
    displayMetrics,
    updatePointerGrid,
    clearPointer,
  };
}
