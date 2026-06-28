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
import { tickMusicalColor } from '../stores/musicalColorStore';
import {
  getVizAccessibility,
  initVizAccessibility,
  subscribeVizAccessibility,
} from '../stores/visualizationStore';
import { getPresetStore, subscribePresetStore } from '../stores/presetStore';
import { AsciiEngine } from '../visualization/AsciiEngine';
import { resolvePresetTheme } from '../visualization/PresetThemes';
import { TARGET_VIZ_FPS } from '../visualization/VisualFeedback';
import {
  buildSliderVizState,
  detectSliderChanges,
  type SliderVizState,
} from '../visualization/SliderVisualEffects';
import { behaviorFromVisualEnergy } from '../visualization/VisualEnergy';
import { behaviorForRenderMode, resolveExperientialMode } from '../visualization/VisualMode';
import { isSessionStarted, isTransportAmbientActive } from '../transport/transportStore';
import {
  amplifyBehaviorForPerformance,
  createPerformanceAnimationState,
  tickPerformanceAnimation,
} from '../visualization/PerformanceAnimation';
import { computeViewportLayout, CHAR_ASPECT } from '../visualization/viewportLayout';
import { interpolateMusicalColor, saturateHex } from '../visuals/colorMusicTheory';
import {
  amplifyBehaviorForInteraction,
  computeInteractionFrame,
} from '../visualization/InteractionResponse';
import { patchVizDebugSnapshot } from '../stores/vizDebugStore';
import type { VizInputSnapshot } from '../visualization/types';
import {
  buildLayoutMetrics,
  createGlyphRenderBackend,
  isPixiRenderer,
  resolveRendererMode,
} from '../canvas/GlyphRenderBackend';
import type { GlyphRenderBackend } from '../canvas/types';
import { recordFrameMs } from '../canvas/frameMetrics';

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
  const cameraRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  const backendRef = useRef<GlyphRenderBackend | null>(null);
  const gsapChoreographyRef = useRef<typeof import('../canvas/gsapChoreography') | null>(null);
  const engineRef = useRef<AsciiEngine | null>(null);
  const frameRef = useRef<number | null>(null);
  const performanceRef = useRef(createPerformanceAnimationState());
  const displayScaleRef = useRef(1);
  const prevSlidersRef = useRef<SliderVizState | null>(null);
  const presetTransitionRef = useRef(0);
  const lastPresetIdRef = useRef('');
  const blendedAmbientRef = useRef('#7FD88F');
  const presetRef = useRef({
    presetId: props.presetId ?? 'seed',
    presetName: props.presetName ?? 'Seed',
  });

  const [displayMetrics, setDisplayMetrics] = useState<AsciiDisplayMetrics>({
    fontSizePx: 10,
    scale: 1,
    gridWidth: 47,
    gridHeight: 33,
  });
  const displayMetricsRef = useRef(displayMetrics);

  useEffect(() => {
    const active = presetStore.activePreset;
    const metadata = presetStore.activeMetadata;
    presetRef.current = {
      presetId: active?.id ?? props.presetId ?? 'seed',
      presetName: metadata?.name ?? props.presetName ?? 'Seed',
    };
  }, [presetStore.activePreset, presetStore.activeMetadata, props.presetId, props.presetName]);

  useEffect(() => {
    displayMetricsRef.current = displayMetrics;
  }, [displayMetrics]);

  useEffect(() => {
    initVizAccessibility();
  }, []);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AsciiEngine({
        initialDimensions: { width: 47, height: 33 },
        accessibility,
      });
      engineRef.current.setSuppressShapeGridPaint(isPixiRenderer());
    } else {
      engineRef.current.setAccessibility(accessibility);
    }
  }, [accessibility]);

  useEffect(() => {
    let disposed = false;

    const mountBackend = () => {
      const host = containerRef.current;
      const pre = preRef.current;
      if (!host || !pre) {
        return;
      }

      const mode = resolveRendererMode();
      void createGlyphRenderBackend(mode).then((backend) => {
        if (disposed) {
          backend.dispose();
          return;
        }
      backendRef.current = backend;
      if (mode === 'pixi') {
        void import('../canvas/gsapChoreography').then((mod) => {
          if (!disposed) {
            gsapChoreographyRef.current = mod;
          }
        });
      }
      void backend.mount(host, pre, mode === 'pixi' ? pixiCanvasRef.current : null);
      });
    };

    requestAnimationFrame(mountBackend);

    return () => {
      disposed = true;
      backendRef.current?.dispose();
      backendRef.current = null;
      gsapChoreographyRef.current = null;
      void import('../canvas/gsapChoreography').then((mod) => mod.disposeAmbientChoreography()).catch(() => undefined);
    };
  }, []);

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
      displayScaleRef.current = layout.scale;
      const metrics = buildLayoutMetrics(
        {
          fontSizePx: layout.fontSizePx,
          scale: layout.scale,
          gridWidth: layout.width,
          gridHeight: layout.height,
        },
        CHAR_ASPECT,
      );
      backendRef.current?.resize(metrics);
    };

    updateGrid();
    const observer = new ResizeObserver(updateGrid);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      const presetId = activePreset?.id ?? presetRef.current.presetId;
      const presetName = activeMetadata?.name ?? presetRef.current.presetName;

      if (presetId !== lastPresetIdRef.current) {
        if (lastPresetIdRef.current) {
          presetTransitionRef.current = 1;
        }
        lastPresetIdRef.current = presetId;
        presetRef.current = { presetId, presetName };
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
          ambientActive: isTransportAmbientActive(),
          sessionStarted: isSessionStarted(),
        },
        deltaMs,
        accessibility,
      );

      const sceneTheme = activePreset
        ? resolvePresetTheme(activePreset, activeMetadata?.category ?? null)
        : resolvePresetTheme(presetId, presetName);

      const ambientActive = isTransportAmbientActive();
      const sessionStarted = isSessionStarted();
      const frameInput = {
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
        ambientActive,
        sessionStarted,
      };

      const performanceState = tickPerformanceAnimation(
        performanceRef.current,
        frameInput,
        energyState,
        sceneTheme,
        time / 1000,
        deltaMs,
        accessibility.reduceMotion,
      );
      performanceRef.current = performanceState;

      const baseBehavior = behaviorForRenderMode(
        energyState.renderMode,
        energyState.displayEnergy,
        accessibility.reduceMotion,
        behaviorFromVisualEnergy(
          energyState.visualEnergy,
          energyState.sources,
          accessibility.reduceMotion,
        ),
        ambientActive,
        energyState.playModeEnergy,
      );
      const interaction = computeInteractionFrame(energyState.sources, frameInput);
      const energyBehavior = amplifyBehaviorForInteraction(
        amplifyBehaviorForPerformance(baseBehavior, performanceState),
        interaction,
      );

      const presetAmbientHex =
        blendedAmbientRef.current || sceneTheme.colorHint || sceneTheme.colorPalette[0] || '#7FD88F';

      const musicalState = tickMusicalColor({
        activeNotes: engineStore.activeNotes,
        presetAmbientHex,
        deltaMs,
      });

      const musicalColor = {
        displayHex: musicalState.display.hex,
        ambientHex: musicalState.ambient.hex,
        weight: musicalState.musicalWeight,
        bloom:
          musicalState.bloom +
          (interaction.isInteracting
            ? interaction.notePulse * 0.45 + interaction.controlPulse * 0.25
            : 0),
      };

      const snapshot: VizInputSnapshot = {
        audioReady: engineStore.audioReady,
        activeNotes: engineStore.activeNotes,
        sound: controlStore.sound,
        modulation: controlStore.modulation,
        presetId,
        presetName,
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
        renderMode: energyState.renderMode,
        energyBehavior,
        presetTransition: presetTransitionRef.current,
        musicalColor,
        performance: performanceState,
        ambientActive,
        sessionStarted,
        interaction,
      };

      const frame = engine.tick(snapshot, deltaMs);
      blendedAmbientRef.current = frame.ambientColorHint;

      const fps = deltaMs > 0 ? 1000 / deltaMs : TARGET_VIZ_FPS;
      patchVizDebugSnapshot({
        visualEnergy: energyState.displayEnergy,
        interactionIntensity: interaction.interactionIntensity,
        interactionBoost: interaction.interactionBoost,
        activeSource: interaction.activeSource,
        isInteracting: interaction.isInteracting,
        glyphCount: engine.getLastShapeGlyphCount(),
        particleCount: engine.getParticleCount(),
        fps,
        profile: interaction.profile,
      });

      const layoutMetrics = buildLayoutMetrics(displayMetricsRef.current, CHAR_ASPECT);
      const paintStart = performance.now();

      const backend = backendRef.current;
      if (backend) {
        backend.render({
          html: frame.html,
          shapeGlyphs: frame.shapeGlyphs,
          metrics: layoutMetrics,
          musicalColor: frame.musicalColor,
          ambientColorHint: frame.ambientColorHint,
        });
      } else {
        pre.innerHTML = frame.html;
      }

      const domEnd = performance.now();
      let pixiMs = 0;
      const pixiContainer = backend?.getPixiGlyphContainer?.() ?? null;
      if (pixiContainer) {
        gsapChoreographyRef.current?.tickAmbientChoreography(
          ambientActive,
          pixiContainer,
          accessibility.reduceMotion,
        );
        pixiMs = performance.now() - domEnd;
      }

      recordFrameMs(
        performance.now() - paintStart,
        domEnd - paintStart,
        pixiMs,
        backend?.id ?? 'dom',
      );

      const container = containerRef.current;
      const appShell = document.getElementById('plantasia-app');
      const canvasColor = saturateHex(
        musicalState.musicalWeight > 0.08 ? musicalState.display.hex : frame.ambientColorHint,
      );
      const canvasRgb =
        musicalState.musicalWeight > 0.08 ? musicalState.display.rgb : hexToRgb(canvasColor);

      if (appShell) {
        const uiPrimary = saturateHex(frame.ambientColorHint);
        appShell.style.setProperty('--plantasia-color-primary', uiPrimary);
        appShell.style.setProperty('--plantasia-color-organism', uiPrimary);
        appShell.style.setProperty('--plantasia-color-accent', interpolateAccent(uiPrimary));
      }
      if (container) {
        container.style.setProperty('--musical-color', canvasColor);
        container.style.setProperty('--musical-color-r', String(canvasRgb.r));
        container.style.setProperty('--musical-color-g', String(canvasRgb.g));
        container.style.setProperty('--musical-color-b', String(canvasRgb.b));
        const glowBase =
          Math.min(1, musicalState.musicalWeight * 0.65 + musicalState.bloom * 0.35) +
          performanceState.glowBoost;
        container.style.setProperty('--musical-glow-opacity', String(Math.min(1, glowBase)));
        container.style.setProperty('--performance-shimmer', String(performanceState.shimmer));
        container.dataset.performanceMode = resolveExperientialMode(
          ambientActive,
          energyState.playModeEnergy,
          sessionStarted,
        );
      }

      const cameraEl = cameraRef.current;
      const compEl = compositionRef.current;
      const scale = displayScaleRef.current;
      if (cameraEl) {
        cameraEl.style.transform = performanceState.cameraTransform || 'none';
      }
      if (compEl) {
        const comp = performanceState.compositionTransform
          ? `${performanceState.compositionTransform} scale(${scale})`
          : `scale(${scale})`;
        compEl.style.transform = comp;
        compEl.style.transformOrigin = 'center center';
      }
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
    cameraRef,
    compositionRef,
    preRef,
    pixiCanvasRef,
    rendererMode: resolveRendererMode(),
    accessibility,
    audioActive: engineStore.audioReady,
    displayMetrics,
    updatePointerGrid,
    clearPointer,
  };
}

function interpolateAccent(primaryHex: string): string {
  return saturateHex(interpolateMusicalColor(primaryHex, '#48E8C8', 0.12).hex);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
