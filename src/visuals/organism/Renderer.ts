import type { Edge } from './Edge';
import {
  connectionGlyph,
  intersectionGlyph,
  isApprovedSymbol,
} from './Grammar';
import type { Node } from './Node';
import type { Organism } from './Organism';

export type RenderOptions = {
  /** Reserved — future animation frame index. */
  frame?: number;
  /** Reserved — future engine-driven node highlights. */
  highlightNodeIds?: string[];
  /** Reserved — future pulse, bloom, mutation, and energy-flow animation. */
  animate?: boolean;
};

export type RendererDimensions = {
  width: number;
  height: number;
};

type GridCell = {
  char: string;
  edgeCount: number;
};

/**
 * Grid-based ASCII renderer for procedural organisms.
 * Static output in this milestone — architecture supports future animation.
 */
export class Renderer {
  readonly width: number;
  readonly height: number;

  constructor(dimensions: RendererDimensions) {
    this.width = dimensions.width;
    this.height = dimensions.height;
  }

  render(organism: Organism, _options: RenderOptions = {}): string {
    const grid = this.createGrid();

    for (const edge of organism.edges) {
      this.drawEdge(grid, edge, organism);
    }

    for (const node of organism.listNodes()) {
      this.drawNode(grid, node);
    }

    return this.gridToString(grid);
  }

  private createGrid(): GridCell[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({ char: ' ', edgeCount: 0 })),
    );
  }

  private drawEdge(grid: GridCell[][], edge: Edge, organism: Organism): void {
    if (edge.pathGlyphs.length > 0) {
      for (const point of edge.pathGlyphs) {
        this.paintGlyph(grid, point.x, point.y, point.symbol, true);
      }
      return;
    }

    const from = organism.getNode(edge.from);
    const to = organism.getNode(edge.to);

    if (!from || !to) {
      return;
    }

    this.drawLine(grid, from.x, from.y, to.x, to.y);
  }

  private drawLine(grid: GridCell[][], x0: number, y0: number, x1: number, y1: number): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));

    if (steps === 0) {
      return;
    }

    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      const glyph = connectionGlyph(x1 - x, y1 - y);
      this.paintGlyph(grid, x, y, glyph, true);
    }
  }

  private drawNode(grid: GridCell[][], node: Node): void {
    this.paintGlyph(grid, node.x, node.y, node.symbol, false);
  }

  private paintGlyph(
    grid: GridCell[][],
    x: number,
    y: number,
    symbol: string,
    isEdge: boolean,
  ): void {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return;
    }

    if (!isApprovedSymbol(symbol) && symbol !== ' ') {
      return;
    }

    const cell = grid[y]?.[x];
    if (!cell) {
      return;
    }

    if (isEdge) {
      cell.edgeCount += 1;
      cell.char = cell.edgeCount > 1 ? intersectionGlyph() : symbol;
      return;
    }

    cell.char = symbol;
    cell.edgeCount = 0;
  }

  private gridToString(grid: GridCell[][]): string {
    return grid.map((row) => row.map((cell) => cell.char).join('')).join('\n');
  }
}

const DEFAULT_RENDERER = new Renderer({ width: 15, height: 11 });

/** Convenience helper for UI integration. */
export function renderOrganism(organism: Organism, options?: RenderOptions): string {
  return DEFAULT_RENDERER.render(organism, options);
}
