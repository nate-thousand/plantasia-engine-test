import { InstrModuleColumn, WsZone } from '../primitives/InstrModuleColumn';
import { InstrMeter } from '../primitives/InstrMeter';
import type { UseInstrumentReturn } from '../../../hooks/useInstrument';

type OutputModuleProps = {
  status: UseInstrumentReturn['status'];
};

function StatusLine({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }
  return (
    <div className="ws-status-line">
      <span className="ws-status-line__key">{label}</span>
      <span className="ws-status-line__val">{value}</span>
    </div>
  );
}

export function OutputModule({ status }: OutputModuleProps) {
  return (
    <InstrModuleColumn index="05" title="Output">
      <WsZone label="Master">
        <InstrMeter label="Level" value={72} />
        <span className="instr-hint">Device volume (placeholder)</span>
      </WsZone>

      <WsZone label="Status">
        <div className="ws-status-list" aria-live="polite">
          <StatusLine label="Transport" value={status.transportState} />
          <StatusLine label="Audio" value={status.audioIndicator} />
          <StatusLine label="State" value={status.organismStateLabel} />
          <StatusLine label="Preset" value={status.presetName} />
          <StatusLine label="Category" value={status.presetCategory} />
          <StatusLine label="MIDI" value={status.midiIndicator} />
          <StatusLine label="Device" value={status.midiDeviceName} />
          <StatusLine label="Note" value={status.lastNoteLabel} />
          <StatusLine label="CC" value={status.lastCcLabel} />
          <StatusLine label="Learn" value={status.learnLabel} />
          {status.mappingCount > 0 ? (
            <StatusLine label="Maps" value={String(status.mappingCount)} />
          ) : null}
        </div>
      </WsZone>
    </InstrModuleColumn>
  );
}
