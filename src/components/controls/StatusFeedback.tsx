import type { UseInstrumentReturn } from '../../hooks/useInstrument';

type StatusFeedbackProps = {
  status: UseInstrumentReturn['status'];
};

function StatusItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <span className="status-feedback__item">
      <span className="status-feedback__label">{label}</span>
      <span className="status-feedback__value">{value}</span>
    </span>
  );
}

/** Compact live feedback strip — details live in preset/MIDI panels. */
export function StatusFeedback({ status }: StatusFeedbackProps) {
  return (
    <div className="status-feedback" aria-label="Live status">
      <StatusItem label="Transport" value={status.transportState} />
      <StatusItem label="Audio" value={status.audioIndicator} />
      <StatusItem label="State" value={status.organismStateLabel} />
      <StatusItem label="Preset" value={status.presetName} />
      <StatusItem label="Category" value={status.presetCategory} />
      <StatusItem label="MIDI" value={status.midiIndicator} />
      <StatusItem label="Note" value={status.lastNoteLabel} />
      <StatusItem label="CC" value={status.lastCcLabel} />
      {status.mappingCount > 0 ? (
        <StatusItem label="Maps" value={String(status.mappingCount)} />
      ) : null}
    </div>
  );
}
