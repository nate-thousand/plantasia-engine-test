import type { GlyphLayoutMetrics, GlyphRenderBackend, RenderFrameInput } from './types';

/** DOM `<pre>` innerHTML renderer — default production path. */
export class DomPreBackend implements GlyphRenderBackend {
  readonly id = 'dom' as const;

  private pre: HTMLPreElement | null = null;

  async mount(_host: HTMLElement, pre: HTMLPreElement): Promise<void> {
    this.pre = pre;
  }

  resize(_metrics: GlyphLayoutMetrics): void {
    // Pre sizing handled by React inline styles.
  }

  render(input: RenderFrameInput): void {
    if (this.pre) {
      this.pre.innerHTML = input.html;
    }
  }

  dispose(): void {
    this.pre = null;
  }
}
