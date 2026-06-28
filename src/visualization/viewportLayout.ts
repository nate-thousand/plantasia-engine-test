import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH } from './VisualFeedback';

export type GridDimensions = {
  width: number;
  height: number;
};

/** Monospace width ≈ 0.58 × font size for typical mono faces. */
export const CHAR_ASPECT = 0.58;
export const LINE_HEIGHT = 1;

export type ViewportLayout = GridDimensions & {
  fontSizePx: number;
  scale: number;
};

export function computeGridDimensions(
  containerWidth: number,
  containerHeight: number,
  charWidth: number,
  charHeight: number,
): GridDimensions {
  const width = Math.min(
    MAX_GRID_WIDTH,
    Math.max(1, Math.floor(containerWidth / charWidth)),
  );
  const height = Math.min(
    MAX_GRID_HEIGHT,
    Math.max(1, Math.floor(containerHeight / charHeight)),
  );
  return { width, height };
}

/**
 * Grid + font + cover scale so ASCII always fills the stage (no letterboxing).
 * The pre element is centered and scaled up to cover the container.
 */
export function computeViewportLayout(
  containerWidth: number,
  containerHeight: number,
  refCharWidth: number,
  refCharHeight: number,
): ViewportLayout {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 47, height: 33, fontSizePx: 10, scale: 1 };
  }

  const { width: gridWidth, height: gridHeight } = computeGridDimensions(
    containerWidth,
    containerHeight,
    refCharWidth,
    refCharHeight,
  );

  const fontSizePx = containerHeight / (gridHeight * LINE_HEIGHT);
  const charWidthPx = fontSizePx * CHAR_ASPECT;
  const naturalWidth = gridWidth * charWidthPx;
  const naturalHeight = gridHeight * fontSizePx * LINE_HEIGHT;

  const scale = Math.max(
    containerWidth / Math.max(naturalWidth, 1),
    containerHeight / Math.max(naturalHeight, 1),
  );

  return {
    width: gridWidth,
    height: gridHeight,
    fontSizePx,
    scale,
  };
}
