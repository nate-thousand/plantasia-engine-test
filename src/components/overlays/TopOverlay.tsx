type TopOverlayProps = {
  audioIndicator: string;
  presetName: string;
  midiIndicator: string;
};

export function TopOverlay({ audioIndicator, presetName, midiIndicator }: TopOverlayProps) {
  return (
    <header className="top-overlay">
      <div className="top-overlay__title">Plantasia Engine Test</div>
      <div className="top-overlay__status">
        <span>{audioIndicator}</span>
        <span>{presetName}</span>
        <span>{midiIndicator}</span>
      </div>
    </header>
  );
}
