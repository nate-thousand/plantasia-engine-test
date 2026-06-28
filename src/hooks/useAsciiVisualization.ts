import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { sampleAudioFeedback } from '../audio/visualization/AudioTap';
import { getControlStore, subscribeControlStore } from '../stores/controlStore';
import { getEngineStore, subscribeEngineStore } from '../stores/engineStore';
import { getMidiStore, subscribeMidiStore, decayInteractionBurst } from '../stores/midiStore';
import {
  getVizAccessibility,
  initVizAccessibility,
  subscribeVizAccessibility,
} from '../stores/visualizationStore';
import { AsciiEngine } from '../visualization/AsciiEngine';
import type { VizInputSnapshot } from '../visualization/types';

export type AsciiVisualizationProps = {
  presetId: string;
  presetName: string;
};

export type AsciiDisplayMetrics = {
  fontSize: number;
  gridWidth: number;
  gridHeight: number;
};

/** Reference cell size for grid resolution — display font-size is computed separately to fill viewport. */
const REF_CHAR_WIDTH = 7;
const REF_CHAR_HEIGHT = 12;
const CHAR_ASPECT = 0.58;
const LINE_HEIGHT = 1;
const MIN_ASCII_FONT_PT = 8;
const MAX_ASCII_FONT_PT = 24;
/** CSS px → pt (96dpi reference). */
const PX_TO_PT = 72 / 96;

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

function computeFillFontSize(
  containerWidth: number,
  containerHeight: number,
  gridWidth: number,
  gridHeight: number,
): number {
  if (gridWidth <= 0 || gridHeight <= 0) {
    return MIN_ASCII_FONT_PT;
  }

  const fontFromHeight = containerHeight / (gridHeight * LINE_HEIGHT);
  const fontFromWidth = containerWidth / (gridWidth * CHAR_ASPECT);
  const fitPt = Math.min(fontFromHeight, fontFromWidth) * PX_TO_PT;
  return Math.max(MIN_ASCII_FONT_PT, Math.min(MAX_ASCII_FONT_PT, fitPt));
}

export function useAsciiVisualization({ presetId, presetName }: AsciiVisualizationProps) {
  const engineStore = useSyncExternalStore(subscribeEngineStore, getEngineStore, getEngineStore);
  const controlStore = useSyncExternalStore(subscribeControlStore, getControlStore, getControlStore);
  const midiStore = useSyncExternalStore(subscribeMidiStore, getMidiStore, getMidiStore);
  const accessibility = useSyncExternalStore(
    subscribeVizAccessibility,
    getVizAccessibility,
    getVizAccessibility,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AsciiEngine | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const [ascii, setAscii] = useState('');
  const [displayMetrics, setDisplayMetrics] = useState<AsciiDisplayMetrics>({
    fontSize: 10,
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
      engine.resize(width, height, REF_CHAR_WIDTH, REF_CHAR_HEIGHT);
      const dims = engine.dimensions;
      setDisplayMetrics({
        fontSize: computeFillFontSize(width, height, dims.width, dims.height),
        gridWidth: dims.width,
        gridHeight: dims.height,
      });
    };

    updateGrid();
    const observer = new ResizeObserver(updateGrid);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!engineStore.audioReady) {
      engineRef.current?.reset();
    }
  }, [engineStore.audioReady]);

  useEffect(() => {
    const loop = (time: number) => {
      const engine = engineRef.current;
      if (!engine) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const deltaMs = lastFrameRef.current ? time - lastFrameRef.current : 16;
      lastFrameRef.current = time;

      const audio = engineStore.audioReady ? sampleAudioFeedback() : silentAudio;

      decayInteractionBurst();

      const snapshot: VizInputSnapshot = {
        audioReady: engineStore.audioReady,
        activeNotes: engineStore.activeNotes,
        sound: controlStore.sound,
        modulation: controlStore.modulation,
        presetId,
        presetName,
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
      };

      const frame = engine.tick(snapshot, deltaMs);
      setAscii(frame);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [
    engineStore.audioReady,
    engineStore.activeNotes,
    controlStore.sound,
    controlStore.modulation,
    controlStore.highlight?.tick,
    midiStore.interactionBurst,
    midiStore.pitchBend,
    midiStore.modWheel,
    midiStore.channelPressure,
    midiStore.midiVisualEffect?.tick,
    presetId,
    presetName,
  ]);

  return { containerRef, ascii, accessibility, audioActive: engineStore.audioReady, displayMetrics };
}
