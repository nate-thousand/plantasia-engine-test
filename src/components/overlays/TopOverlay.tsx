type TopOverlayProps = {
  audioIndicator: string;
  presetName: string;
  organismStateLabel: string;
  midiIndicator: string;
  midiDeviceName: string | null;
  lastNoteLabel: string | null;
  lastMidiMessage: string | null;
  learnLabel: string | null;
  mappingCount: number;
  lastCcLabel: string | null;
};

export function TopOverlay({
  audioIndicator,
  presetName,
  organismStateLabel,
  midiIndicator,
  midiDeviceName,
  lastNoteLabel,
  lastMidiMessage,
  learnLabel,
  mappingCount,
  lastCcLabel,
}: TopOverlayProps) {
  return (
    <header className="top-overlay">
      <div className="top-overlay__title">Plantasia Engine Test</div>
      <div className="top-overlay__status">
        <span>{audioIndicator}</span>
        <span>{organismStateLabel}</span>
        <span>{presetName}</span>
        <span>{midiIndicator}</span>
        {midiDeviceName ? <span>{midiDeviceName}</span> : null}
        {lastNoteLabel ? <span>{lastNoteLabel}</span> : null}
        {lastMidiMessage ? <span>{lastMidiMessage}</span> : null}
        {lastCcLabel ? <span>{lastCcLabel}</span> : null}
        {learnLabel ? <span>{learnLabel}</span> : null}
        {mappingCount > 0 ? <span>{mappingCount} map</span> : null}
      </div>
    </header>
  );
}
