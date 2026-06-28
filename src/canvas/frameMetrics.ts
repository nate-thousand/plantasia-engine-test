const SAMPLE_CAP = 240;

let samples: number[] = [];
let domSamples: number[] = [];
let pixiSamples: number[] = [];
let lastReport = 0;

export type FrameMetricsSnapshot = {
  count: number;
  p50: number;
  p95: number;
  jankFrames: number;
  jankPct: number;
  domP50: number;
  domP95: number;
  pixiP50: number;
  pixiP95: number;
  backend: string;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index] ?? 0;
}

function summarize(values: number[]): { p50: number; p95: number; jankFrames: number; jankPct: number } {
  if (values.length === 0) {
    return { p50: 0, p95: 0, jankFrames: 0, jankPct: 0 };
  }
  const jankFrames = values.filter((v) => v > 32).length;
  return {
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    jankFrames,
    jankPct: (jankFrames / values.length) * 100,
  };
}

export function recordFrameMs(totalMs: number, domMs: number, pixiMs: number, backend: string): void {
  samples.push(totalMs);
  if (domMs > 0) {
    domSamples.push(domMs);
  }
  if (pixiMs > 0) {
    pixiSamples.push(pixiMs);
  }
  if (samples.length > SAMPLE_CAP) {
    samples.shift();
  }
  if (domSamples.length > SAMPLE_CAP) {
    domSamples.shift();
  }
  if (pixiSamples.length > SAMPLE_CAP) {
    pixiSamples.shift();
  }

  const now = performance.now();
  if (now - lastReport > 5000 && import.meta.env.DEV) {
    lastReport = now;
    const snap = getFrameMetrics(backend);
    console.debug('[Plantasia frameMetrics]', snap);
  }
}

export function getFrameMetrics(backend = 'dom'): FrameMetricsSnapshot {
  const total = summarize(samples);
  const dom = summarize(domSamples);
  const pixi = summarize(pixiSamples);
  return {
    count: samples.length,
    p50: total.p50,
    p95: total.p95,
    jankFrames: total.jankFrames,
    jankPct: total.jankPct,
    domP50: dom.p50,
    domP95: dom.p95,
    pixiP50: pixi.p50,
    pixiP95: pixi.p95,
    backend,
  };
}

export function resetFrameMetrics(): void {
  samples = [];
  domSamples = [];
  pixiSamples = [];
}
