import { useEffect, useState, useSyncExternalStore } from 'react';
import { getFrameMetrics, resetFrameMetrics } from '../../canvas/frameMetrics';
import { resolveRendererMode } from '../../canvas/GlyphRenderBackend';
import { getVizDebugSnapshot, subscribeVizDebugSnapshot } from '../../stores/vizDebugStore';

/** Debug overlay — interaction response + frame metrics (Milestone 15C). */
export function FrameMetricsDebugPanel() {
  const [, bump] = useState(0);
  const mode = resolveRendererMode();
  const viz = useSyncExternalStore(subscribeVizDebugSnapshot, getVizDebugSnapshot, getVizDebugSnapshot);

  useEffect(() => {
    const id = window.setInterval(() => bump((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, []);

  const metrics = getFrameMetrics(mode);

  return (
    <div className="frame-metrics-debug" aria-live="polite">
      <strong>Visual debug</strong>
      <span>
        profile {viz.profile} · intensity {viz.interactionIntensity.toFixed(1)} · boost{' '}
        {viz.interactionBoost.toFixed(2)}
      </span>
      <span>
        energy {viz.visualEnergy.toFixed(2)} · source {viz.activeSource}
        {viz.isInteracting ? ' · interacting' : ' · idle'}
      </span>
      <span>
        glyphs {viz.glyphCount} · particles {viz.particleCount} · fps {viz.fps.toFixed(0)}
      </span>
      <span>
        frame p50 {metrics.p50.toFixed(1)}ms · p95 {metrics.p95.toFixed(1)}ms · jank {metrics.jankPct.toFixed(0)}%
        · backend {metrics.backend}
      </span>
      <button type="button" className="frame-metrics-debug__reset" onClick={() => resetFrameMetrics()}>
        Reset metrics
      </button>
    </div>
  );
}
