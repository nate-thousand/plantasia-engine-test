import { useAsciiVisualization, type AsciiVisualizationProps } from '../../hooks/useAsciiVisualization';

export function AsciiCanvasView(props: AsciiVisualizationProps) {
  const { containerRef, ascii, accessibility, audioActive, displayMetrics } =
    useAsciiVisualization(props);

  return (
    <div
      ref={containerRef}
      className={`ascii-canvas-view${accessibility.reduceMotion ? '' : ' ascii-canvas-view--live'}`}
      aria-label="Procedural ASCII ecosystem"
      data-reduce-motion={accessibility.reduceMotion ? 'true' : 'false'}
      data-audio-active={audioActive ? 'true' : 'false'}
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
      <pre
        className="ascii-canvas-view__frame"
        style={{
          fontSize: `${displayMetrics.fontSize}pt`,
          lineHeight: 1,
        }}
      >
        {ascii}
      </pre>
    </div>
  );
}
