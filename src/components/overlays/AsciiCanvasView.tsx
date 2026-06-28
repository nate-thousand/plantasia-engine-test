import { useAsciiVisualization, type AsciiVisualizationProps } from '../../hooks/useAsciiVisualization';
import { CHAR_ASPECT } from '../../visualization/viewportLayout';

export function AsciiCanvasView(props: AsciiVisualizationProps = {}) {
  const {
    containerRef,
    preRef,
    accessibility,
    audioActive,
    displayMetrics,
    updatePointerGrid,
    clearPointer,
  } = useAsciiVisualization(props);

  const charWidthPx = displayMetrics.fontSizePx * CHAR_ASPECT;
  const contentWidth = displayMetrics.gridWidth * charWidthPx;
  const contentHeight = displayMetrics.gridHeight * displayMetrics.fontSizePx;

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
          width: '100%',
          height: '100%',
        } as React.CSSProperties
      }
    >
      <div
        className="ascii-canvas-view__scale-wrap"
        style={{
          width: contentWidth,
          height: contentHeight,
          transform: `scale(${displayMetrics.scale})`,
        }}
      >
        <pre
          ref={preRef}
          className="ascii-canvas-view__frame"
          style={{
            fontSize: `${displayMetrics.fontSizePx}px`,
            lineHeight: 1,
            width: contentWidth,
            height: contentHeight,
            margin: 0,
          }}
        />
      </div>
    </div>
  );
}
