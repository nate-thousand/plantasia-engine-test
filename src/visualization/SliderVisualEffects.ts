import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import { pickThemeAccent, pickThemeChar } from './ThemeCharacters';
import { FEEDBACK_GAIN, feedbackScale, feedbackThreshold } from './VisualFeedback';
import type { PresetTheme } from './types';

export type SliderKey =
  | 'volume'
  | 'tone'
  | 'texture'
  | 'bloom'
  | 'growthRate'
  | 'drift'
  | 'mutation'
  | 'energy';

export type SliderVizState = Record<SliderKey, number> & {
  /** Weighted blend — higher when any slider is pushed right. */
  combined: number;
};

export type SliderPaintFn = (x: number, y: number, char: string, priority: number) => void;

const SLIDER_KEYS: SliderKey[] = [
  'volume',
  'tone',
  'texture',
  'bloom',
  'growthRate',
  'drift',
  'mutation',
  'energy',
];

function norm(value: number): number {
  return Math.max(0, Math.min(1, value / 100));
}

export function buildSliderVizState(
  sound: SoundControlValues,
  modulation: ModulationControlValues,
): SliderVizState {
  const volume = norm(sound.volume);
  const tone = norm(sound.tone);
  const texture = norm(sound.texture);
  const bloom = norm(sound.bloom);
  const growthRate = norm(modulation.growthRate);
  const drift = norm(modulation.drift);
  const mutation = norm(modulation.mutation);
  const energy = norm(modulation.energy);

  const combined =
    volume * 0.14 +
    tone * 0.12 +
    texture * 0.12 +
    bloom * 0.12 +
    growthRate * 0.12 +
    drift * 0.12 +
    mutation * 0.12 +
    energy * 0.14;

  return {
    volume,
    tone,
    texture,
    bloom,
    growthRate,
    drift,
    mutation,
    energy,
    combined,
  };
}

/** Scene animation + density boost from slider positions. */
export function sliderSceneIntensity(sliders: SliderVizState): {
  energy: number;
  amplitude: number;
  animSpeed: number;
} {
  return {
    energy: feedbackScale(0.15 + sliders.energy * 0.85 + sliders.growthRate * 0.25, 3),
    amplitude: feedbackScale(0.08 + sliders.volume * 0.5 + sliders.combined * 0.35, 2.5),
    animSpeed: feedbackScale(0.5 + sliders.growthRate * 0.8 + sliders.energy * 0.6 + sliders.drift * 0.3, 4),
  };
}

/** Per-frame ambient particle spawn rate multiplier from sliders. */
export function sliderAmbientParticleRate(sliders: SliderVizState): number {
  return feedbackScale(
    0.2 +
      sliders.energy * 2.5 +
      sliders.bloom * 1.8 +
      sliders.texture * 1.2 +
      sliders.drift * 1.5 +
      sliders.mutation * 1.4 +
      sliders.volume * 0.8,
    12,
  );
}

/** Wind / ripple depth from drift + bloom. */
export function sliderWindDepth(sliders: SliderVizState): number {
  return feedbackScale(sliders.drift * 0.9 + sliders.bloom * 0.35 + sliders.energy * 0.25, 3);
}

/** Bass ground pulse strength from volume. */
export function sliderBassStrength(sliders: SliderVizState, audioBass: number): number {
  return feedbackScale(audioBass * (0.4 + sliders.volume * 1.2), 3);
}

/** Spectrum / waveform visibility from volume + tone + energy. */
export function sliderSpectrumGain(sliders: SliderVizState, audioAmp: number): number {
  return feedbackScale(audioAmp * (0.35 + sliders.volume * 0.9 + sliders.tone * 0.4 + sliders.energy * 0.35), 3);
}

/** Detect sliders that moved since last frame (for pulse bursts). */
export function detectSliderChanges(
  prev: SliderVizState | null,
  next: SliderVizState,
  threshold = feedbackThreshold(0.015),
): { key: SliderKey; delta: number; value: number }[] {
  if (!prev) {
    return [];
  }

  const changes: { key: SliderKey; delta: number; value: number }[] = [];
  for (const key of SLIDER_KEYS) {
    const delta = next[key] - prev[key];
    if (Math.abs(delta) >= threshold) {
      changes.push({ key, delta, value: next[key] });
    }
  }
  return changes;
}

/** Paint slider-reactive overlays on top of the botanical scene. */
export function paintSliderReactiveOverlays(
  width: number,
  height: number,
  theme: PresetTheme,
  sliders: SliderVizState,
  time: number,
  paint: SliderPaintFn,
  interactionPulse = 0,
): void {
  const ground = height - 2;
  const cx = Math.floor(width / 2);
  const pulse = interactionPulse / 127;
  const gain = FEEDBACK_GAIN;

  if (sliders.volume > feedbackThreshold(0.08) || pulse > 0.05) {
    const span = Math.round((sliders.volume + pulse * 0.5) * width * 0.5 * gain);
    const char = sliders.volume > 0.65 ? '▓' : sliders.volume > 0.35 ? '▒' : '░';
    for (let x = cx - span; x <= cx + span; x += 1) {
      if (x >= 0 && x < width) {
        paint(x, ground, char, 3);
      }
    }
  }

  if (sliders.tone > feedbackThreshold(0.12) || pulse > 0.08) {
    const topRows = Math.round((sliders.tone + pulse * 0.4) * 4 * gain);
    for (let y = 0; y < topRows; y += 1) {
      for (let x = 0; x < width; x += Math.max(1, Math.round(6 - sliders.tone * 4 - pulse * 2))) {
        if (Math.sin(x * 0.4 + time * 2 * gain + y) > 0.55 - sliders.tone * 0.2 - pulse * 0.15) {
          paint(x, y, pickThemeChar(theme, x + y + Math.floor(time * gain)), 2);
        }
      }
    }
  }

  if (sliders.texture > feedbackThreshold(0.15) || pulse > 0.06) {
    const density = (sliders.texture + pulse * 0.35) * 0.45 * gain;
    for (let y = 1; y < height - 2; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (Math.sin(x * 0.7 + y * 0.5 + time * gain) > 1 - density * 2) {
          paint(x, y, pickThemeChar(theme, x * 3 + y), 2);
        }
      }
    }
  }

  if (sliders.bloom > feedbackThreshold(0.12) || pulse > 0.1) {
    const r = Math.round((2 + sliders.bloom * 5 + pulse * 4) * Math.min(gain, 3));
    const corners = [
      { x: 2, y: 2 },
      { x: width - 3, y: 2 },
      { x: 2, y: ground - 2 },
      { x: width - 3, y: ground - 2 },
    ];
    for (const [i, corner] of corners.entries()) {
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          if (Math.abs(dx) + Math.abs(dy) <= r) {
            paint(
              corner.x + dx,
              corner.y + dy,
              pickThemeAccent(theme, i + dx + dy + Math.floor(time)),
              3,
            );
          }
        }
      }
    }
  }

  if (sliders.growthRate > feedbackThreshold(0.12) || pulse > 0.08) {
    const columns = Math.max(3, Math.round((sliders.growthRate + pulse * 0.3) * width * 0.15 * gain));
    for (let i = 0; i < columns; i += 1) {
      const x = Math.floor((i + 0.5) * (width / columns));
      const h = Math.round((sliders.growthRate + pulse * 0.25) * (height * 0.55) * gain);
      for (let dy = 0; dy < h; dy += 1) {
        if (dy % 2 === 0) {
          paint(x, ground - dy, '|', 2);
        }
      }
    }
  }

  if (sliders.drift > feedbackThreshold(0.1) || pulse > 0.06) {
    const rows = Math.round((2 + sliders.drift * 5 + pulse * 3) * Math.min(gain, 2.5));
    for (let row = 0; row < rows; row += 1) {
      const y = Math.floor((row + 1) * (height / (rows + 2)));
      for (let x = 0; x < width; x += 1) {
        const wave = Math.sin(x * 0.25 + time * (1.5 + sliders.drift * 2) * gain + row);
        if (Math.abs(wave) > 0.65 - sliders.drift * 0.3 - pulse * 0.2) {
          paint(x, y, '~', 2);
        }
      }
    }
  }

  if (sliders.mutation > feedbackThreshold(0.1) || pulse > 0.12) {
    const count = Math.round((sliders.mutation + pulse * 0.4) * width * height * 0.012 * gain);
    for (let i = 0; i < count; i += 1) {
      const x = Math.floor(pseudo(i, time) * width);
      const y = Math.floor(pseudo(i + 7, time * 1.3) * (height - 2));
      if (Math.random() < (sliders.mutation + pulse * 0.3) * 0.85) {
        paint(x, y, pickThemeAccent(theme, i + Math.floor(time * 10 * gain)), 3);
      }
    }
  }

  if (sliders.energy > feedbackThreshold(0.1) || pulse > 0.08) {
    const sparkCount = Math.round((sliders.energy + pulse * 0.5) * width * 0.25 * gain);
    for (let i = 0; i < sparkCount; i += 1) {
      const x = Math.floor(pseudo(i + 3, time * 0.7 * gain) * width);
      const y = Math.floor(pseudo(i + 11, time * gain) * height);
      paint(x, y, pickThemeChar(theme, i + Math.floor(time * 5 * gain)), 2);
    }
  }
}

/** Spawn count when a slider moves right. */
export function sliderChangeBurstCount(key: SliderKey, value: number, delta: number): number {
  if (delta <= 0) {
    return Math.max(2, Math.round(value * 2 * FEEDBACK_GAIN));
  }
  const base = Math.round((Math.abs(delta) * 40 + value * 8) * FEEDBACK_GAIN);
  switch (key) {
    case 'energy':
    case 'bloom':
      return base + 4 * FEEDBACK_GAIN;
    case 'mutation':
      return base + 3 * FEEDBACK_GAIN;
    case 'volume':
      return base + 2 * FEEDBACK_GAIN;
    default:
      return base + FEEDBACK_GAIN;
  }
}

function pseudo(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
