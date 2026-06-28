type TopOverlayProps = {
  audioIndicator: string;
  presetName: string;
  midiIndicator: string;
  midiDeviceName: string | null;
  lastNoteLabel: string | null;
};

export function TopOverlay({
  audioIndicator,
  presetName,
  midiIndicator,
  midiDeviceName,
  lastNoteLabel,
}: TopOverlayProps) {
  return (
    <header className="top-overlay">
      <div className="top-overlay__title">Plantasia Engine Test</div>
      <div className="top-overlay__status">
        <span>{audioIndicator}</span>
        <span>{presetName}</span>
        <span>{midiIndicator}</span>
        {midiDeviceName ? <span>{midiDeviceName}</span> : null}
        {lastNoteLabel ? <span>{lastNoteLabel}</span> : null}
      </div>
    </header>
  );
}
