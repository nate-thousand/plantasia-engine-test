import { paintShapeScene } from './ShapeScenePainters';
import { paintSliderReactiveOverlays, type SliderVizState } from './SliderVisualEffects';
import type { PresetTheme, VisualEnergyBehavior, VisualRenderMode } from './types';

export type ScenePaintFn = (x: number, y: number, char: string, priority: number) => void;

export type SceneContext = {
  width: number;
  height: number;
  theme: PresetTheme;
  time: number;
  energy: number;
  amplitude: number;
  animSpeed: number;
  sliders: SliderVizState;
  interactionPulse: number;
  /** Normalized 0–1 reactive intensity — drives glyph animation depth. */
  visualEnergy: number;
  /** idleHome vs activePlay — separate render paths. */
  renderMode: VisualRenderMode;
  /** Glyph motion scale from energy behavior (13F). */
  asciiDensityScale: number;
  pointer: {
    gridX: number;
    gridY: number;
    active: boolean;
    activity: number;
    velocity: number;
    isTouch: boolean;
  };
  energyBehavior: VisualEnergyBehavior;
  /** Performance cluster offsets (Milestone 13C). */
  performance?: import('./PerformanceAnimation').PerformanceAnimationState;
  /** Transport ambient session active (Milestone 13D). */
  ambientActive?: boolean;
  /** 0–1 play-mode energy for experiential mode resolution (13F). */
  playModeEnergy?: number;
  paint: ScenePaintFn;
};

/** Paint shape-based ASCII scene — one concept per preset, no wallpaper (13F). */
export function paintBotanicalScene(ctx: SceneContext): void {
  paintShapeScene(ctx);

  paintSliderReactiveOverlays(
    ctx.width,
    ctx.height,
    ctx.theme,
    ctx.sliders,
    ctx.time,
    ctx.paint,
    ctx.interactionPulse,
    ctx.visualEnergy,
  );
}
