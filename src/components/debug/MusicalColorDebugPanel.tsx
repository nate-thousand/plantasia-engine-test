import { useSyncExternalStore } from 'react';
import { getMusicalColorStore, subscribeMusicalColorStore } from '../../stores/musicalColorStore';

export function MusicalColorDebugPanel() {
  const colorState = useSyncExternalStore(
    subscribeMusicalColorStore,
    getMusicalColorStore,
    getMusicalColorStore,
  );

  const { display, tonal, currentNote } = colorState;

  return (
    <aside className="musical-color-debug" aria-label="Musical color debug">
      <div className="musical-color-debug__title">Musical Color (Scriabin)</div>
      <dl className="musical-color-debug__grid">
        <div>
          <dt>Current Note</dt>
          <dd>{currentNote ?? '—'}</dd>
        </div>
        <div>
          <dt>Detected Chord</dt>
          <dd>{tonal.chordName ?? '—'}</dd>
        </div>
        <div>
          <dt>Detected Key</dt>
          <dd>{tonal.keyName}</dd>
        </div>
        <div>
          <dt>Camelot</dt>
          <dd>{tonal.camelot ?? '—'}</dd>
        </div>
        <div>
          <dt>HEX</dt>
          <dd>{display.hex}</dd>
        </div>
        <div>
          <dt>RGB</dt>
          <dd>
            {display.rgb.r}, {display.rgb.g}, {display.rgb.b}
          </dd>
        </div>
        <div>
          <dt>HSL</dt>
          <dd>
            {display.hsl.h.toFixed(0)}°, {display.hsl.s.toFixed(0)}%, {display.hsl.l.toFixed(0)}%
          </dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{(colorState.musicalWeight * 100).toFixed(0)}%</dd>
        </div>
      </dl>
      <div
        className="musical-color-debug__swatch"
        style={{ backgroundColor: display.hex }}
        aria-hidden
      />
    </aside>
  );
}
