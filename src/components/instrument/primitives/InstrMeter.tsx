type InstrMeterProps = {
  value: number;
  max?: number;
  label?: string;
};

export function InstrMeter({ value, max = 100, label }: InstrMeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      {label ? <span className="instr-label">{label}</span> : null}
      <div className="instr-meter" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className="instr-meter__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type InstrWaveformProps = {
  /** Normalized heights 0–1 */
  samples?: number[];
};

export function InstrWaveform({ samples }: InstrWaveformProps) {
  const points =
    samples ??
    Array.from({ length: 32 }, (_, i) => 0.35 + Math.sin(i * 0.45) * 0.25 + Math.cos(i * 0.18) * 0.1);

  const path = points
    .map((h, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 50 - h * 40;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="instr-waveform" aria-hidden>
      <svg className="instr-waveform__svg" viewBox="0 0 100 50" preserveAspectRatio="none">
        <path className="instr-waveform__path" d={path} />
      </svg>
    </div>
  );
}
