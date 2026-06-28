import { useAsciiVisualization, type AsciiVisualizationProps } from '../../hooks/useAsciiVisualization';
import { useDebugMode } from '../../hooks/useDebugMode';
import { FrameMetricsDebugPanel } from '../debug/FrameMetricsDebugPanel';
import { MusicalColorDebugPanel } from '../debug/MusicalColorDebugPanel';
import { CHAR_ASPECT } from '../../visualization/viewportLayout';

export function AsciiCanvasView(props: AsciiVisualizationProps = {}) {
  const debugMode = useDebugMode();
  const {
    containerRef,
    cameraRef,
    compositionRef,
    preRef,
    pixiCanvasRef,
    rendererMode,
    accessibility,
    audioActive,
    displayMetrics,
    updatePointerGrid,
    clearPointer,
  } = useAsciiVisualization(props);

  const charWidthPx = displayMetrics.fontSizePx * CHAR_ASPECT;
  const contentWidth = displayMetrics.gridWidth * charWidthPx;
  const contentHeight = displayMetrics.gridHeight * displayMetrics.fontSizePx;
  const pixiActive = rendererMode === 'pixi';

  const mapPointerToGrid = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) {
      return null;
    }
    const rect = container.getBoundingClientRect();
    const localX = (clientX - rect.left) / displayMetrics.scale;
    const localY = (clientY - rect.top) / displayMetrics.scale;
    const gridX = Math.floor(localX / charWidthPx);
    const gridY = Math.floor(localY / displayMetrics.fontSizePx);
    return {
      gridX: Math.max(0, Math.min(displayMetrics.gridWidth - 1, gridX)),
      gridY: Math.max(0, Math.min(displayMetrics.gridHeight - 1, gridY)),
    };
  };

  return (
    <div
      ref={containerRef}
      className={`ascii-canvas-view${accessibility.reduceMotion ? '' : ' ascii-canvas-view--live'}`}
      aria-label="Procedural ASCII ecosystem"
      data-reduce-motion={accessibility.reduceMotion ? 'true' : 'false'}
      data-audio-active={audioActive ? 'true' : 'false'}
      data-renderer={rendererMode}
      data-performance-mode="ambient"
      onPointerMove={(event) => {
        const grid = mapPointerToGrid(event.clientX, event.clientY);
        if (grid) {
          const isTouch = event.pointerType === 'touch';
          updatePointerGrid(grid.gridX, grid.gridY, event.buttons > 0 || isTouch, isTouch);
        }
      }}
      onPointerDown={(event) => {
        const grid = mapPointerToGrid(event.clientX, event.clientY);
        if (grid) {
          const isTouch = event.pointerType === 'touch';
          updatePointerGrid(grid.gridX, grid.gridY, true, isTouch);
        }
      }}
      onPointerUp={() => clearPointer()}
      onPointerLeave={() => clearPointer()}
      style={
        {
          '--ascii-contrast': accessibility.contrast / 100,
          '--ascii-grid-width': displayMetrics.gridWidth,
          '--ascii-grid-height': displayMetrics.gridHeight,
          '--musical-color': 'var(--plantasia-color-organism)',
          '--musical-glow-opacity': '0',
          '--performance-shimmer': '0',
          width: '100%',
          height: '100%',
        } as React.CSSProperties
      }
    >
      {debugMode ? <MusicalColorDebugPanel /> : null}
      {debugMode ? <FrameMetricsDebugPanel /> : null}
      <div ref={cameraRef} className="ascii-canvas-view__camera">
        <div
          ref={compositionRef}
          className="ascii-canvas-view__scale-wrap"
          style={{
            width: contentWidth,
            height: contentHeight,
          }}
        >
          <pre
            ref={preRef}
            className={`ascii-canvas-view__frame${pixiActive ? ' ascii-canvas-view__frame--underlay' : ''}`}
            style={{
              fontSize: `${displayMetrics.fontSizePx}px`,
              lineHeight: 1,
              width: contentWidth,
              height: contentHeight,
              margin: 0,
            }}
          />
          <canvas
            ref={pixiCanvasRef}
            className={`ascii-canvas-view__pixi${pixiActive ? '' : ' ascii-canvas-view__pixi--hidden'}`}
            aria-hidden="true"
            width={contentWidth}
            height={contentHeight}
            style={{
              width: contentWidth,
              height: contentHeight,
            }}
          />
        </div>
      </div>
    </div>
  );
}
