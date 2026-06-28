/**
 * Milestone 13F + 15C — per-glyph animation inside readable shapes.
 */
import type { InteractionFrameState } from './InteractionResponse';
import {
  animationIntensitySpan,
  STATIC_ANIMATION_RATIO,
} from './animationIntensity';
import {
  clampGlyphRotation,
  clampGlyphScale,
  interactionMutationBoost,
  interactionOpacityPulse,
} from './InteractionResponse';
import type { ShapeGlyphPoint } from './ShapeComposition';
import type { VisualEnergyBehavior } from './types';

export type AnimatedGlyph = ShapeGlyphPoint & {
  char: string;
  priority: number;
  scale?: number;
  rotation?: number;
  alpha?: number;
};

export type GlyphAnimContext = {
  time: number;
  visualEnergy: number;
  amplitude: number;
  jitter: number;
  spread: number;
  pointerActivity: number;
  pointer?: {
    gridX: number;
    gridY: number;
    active: boolean;
    activity: number;
    velocity: number;
    isTouch: boolean;
  };
  presetTransition?: number;
  interaction?: InteractionFrameState;
  clusterOffset?: { translateX: number; translateY: number; breathe: number; scale: number };
};

function pointerPush(
  x: number,
  y: number,
  pointer: GlyphAnimContext['pointer'],
  frame: InteractionFrameState | undefined,
): { dx: number; dy: number } {
  if (!pointer || !frame?.isInteracting || pointer.activity < 0.04) {
    return { dx: 0, dy: 0 };
  }

  const dx = x - pointer.gridX;
  const dy = y - pointer.gridY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const radius = 4 + frame.interactionBoost * 10 * frame.interactionIntensity;
  if (dist > radius) {
    return { dx: 0, dy: 0 };
  }

  const falloff = 1 - dist / radius;
  const force = falloff * pointer.activity * pointer.velocity * frame.interactionIntensity;
  const push = pointer.isTouch ? 2.8 : 1.6;
  return {
    dx: (dx / dist) * force * push,
    dy: (dy / dist) * force * push,
  };
}

/** Pick animated char + offset for one glyph in a shape. */
export function animateGlyph(
  point: ShapeGlyphPoint,
  palette: readonly string[],
  ctx: GlyphAnimContext,
): {
  x: number;
  y: number;
  char: string;
  priority: number;
  scale: number;
  rotation: number;
  alpha: number;
} {
  const frame = ctx.interaction;
  const intensitySpan = animationIntensitySpan(ctx.visualEnergy);
  const idleMotion = STATIC_ANIMATION_RATIO + intensitySpan * (1 - STATIC_ANIMATION_RATIO);
  const shapeBreath = Math.sin(ctx.time * (0.14 + intensitySpan * 0.35)) * 0.5 + 0.5;
  const clusterPhase = ctx.time * (0.28 + point.clusterIndex * 0.11 + intensitySpan * 0.55);
  const spreadAmp = ctx.spread * (frame?.isInteracting ? 1 + (frame.interactionBoost ?? 0) * 1.6 : 0.65 + intensitySpan);
  const clusterDriftX = Math.sin(clusterPhase) * (0.8 + idleMotion * 5 + intensitySpan * 8) * spreadAmp;
  const clusterDriftY = Math.cos(clusterPhase * 0.85) * (0.5 + idleMotion * 4 + intensitySpan * 6) * spreadAmp;

  const noteAmp = (frame?.notePulse ?? 0) * (frame?.interactionIntensity ?? 1);
  const glyphPulse = Math.sin(ctx.time * (1.8 + point.glyphIndex * 0.3) + ctx.amplitude * 4 + noteAmp * 3);
  const glyphFlicker = Math.sin(ctx.time * 3.2 + point.x * 0.4 + point.y * 0.3);

  const jitter = frame?.isInteracting ? interactionMutationBoost(frame, ctx.jitter) : ctx.jitter;
  let charIndex = point.glyphIndex % palette.length;
  const mutationThreshold = 0.72 - jitter * 0.5 - (frame?.controlPulse ?? 0) * 0.15;
  if (jitter > 0.12 && glyphFlicker > mutationThreshold) {
    charIndex = (charIndex + 1 + Math.floor(ctx.time * (2 + jitter * 3))) % palette.length;
  }
  if (point.role === 'accent' && glyphPulse > 0.25 - noteAmp * 0.15) {
    charIndex = Math.min(palette.length - 1, charIndex + 1);
  }
  if (frame?.isInteracting && frame.notePulse > 0.2 && glyphFlicker > 0.5) {
    charIndex = (charIndex + 2) % palette.length;
  }

  const perf = ctx.clusterOffset;
  const perfX = perf ? perf.translateX * 0.08 : 0;
  const perfY = perf ? perf.translateY * 0.08 : 0;
  const breatheScale = perf ? 0.85 + perf.breathe * 0.3 : 0.85 + shapeBreath * 0.25;

  const push = pointerPush(point.x, point.y, ctx.pointer, frame);
  const pointerNudge = glyphPulse * ctx.pointerActivity * (frame?.isInteracting ? 1.4 : 0.6);

  const presetT = ctx.presetTransition ?? 0;
  const presetScatter =
    presetT > 0.05
      ? Math.sin(ctx.time * 4 + point.glyphIndex) * presetT * (frame?.interactionIntensity ?? 1) * 2.5
      : 0;

  const x = Math.round(
    point.x +
      clusterDriftX * breatheScale +
      perfX +
      pointerNudge +
      push.dx +
      presetScatter,
  );
  const y = Math.round(
    point.y +
      clusterDriftY * breatheScale +
      perfY +
      glyphPulse * ctx.visualEnergy * (frame?.isInteracting ? 0.75 : 0.4) +
      push.dy +
      presetScatter * 0.65,
  );

  let scale = 1 + (glyphPulse * 0.08 + noteAmp * 0.22 + (frame?.controlPulse ?? 0) * 0.12) * breatheScale;
  if (presetT > 0.08) {
    const collapse = presetT > 0.55 ? (1 - presetT) * 2.2 : presetT * 1.8;
    scale *= 0.55 + collapse * 0.55;
  }
  if (frame) {
    scale = clampGlyphScale(scale, frame);
  }

  let rotation =
    glyphPulse * 0.12 * (frame?.controlPulse ?? 0) +
    noteAmp * 0.35 +
    push.dx * 0.08;
  if (frame) {
    rotation = clampGlyphRotation(rotation, frame);
  }

  const baseAlpha = 0.78 + (point.role === 'accent' ? 0.12 : 0);
  const alpha = frame?.isInteracting ? interactionOpacityPulse(frame, baseAlpha) : baseAlpha;

  const priority = point.role === 'accent' ? 3 : point.role === 'core' ? 2 : 1;
  return { x, y, char: palette[charIndex] ?? '.', priority, scale, rotation, alpha };
}

export function buildAnimatedGlyphs(
  points: ShapeGlyphPoint[],
  palette: readonly string[],
  ctx: GlyphAnimContext,
  maxGlyphs: number,
  width: number,
  height: number,
): AnimatedGlyph[] {
  const out: AnimatedGlyph[] = [];
  const seen = new Set<string>();

  for (const point of points) {
    if (out.length >= maxGlyphs) break;
    const anim = animateGlyph(point, palette, ctx);
    if (anim.x < 1 || anim.y < 1 || anim.x >= width - 1 || anim.y >= height - 1) continue;
    const key = `${anim.x},${anim.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...point, ...anim });
  }
  return out;
}

export function glyphAnimFromBehavior(
  behavior: VisualEnergyBehavior,
  visualEnergy: number,
  interaction?: InteractionFrameState,
): Pick<GlyphAnimContext, 'jitter' | 'spread'> {
  const interactMul = interaction?.isInteracting ? 1 + (interaction.interactionBoost ?? 0) * 1.5 : 1;
  return {
    jitter: Math.min(0.85, behavior.jitter * (0.4 + visualEnergy * 0.6) * interactMul),
    spread: Math.min(1, behavior.spread * (0.35 + visualEnergy * 0.5) * interactMul),
  };
}
