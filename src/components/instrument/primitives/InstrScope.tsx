type InstrScopeProps = {
  samples: number[];
  label?: string;
};

/** Tiny oscilloscope display. */
export function InstrScope({ samples, label = 'Scope' }: InstrScopeProps) {
  const path = samples
    .map((h, i) => {
      const x = (i / Math.max(samples.length - 1, 1)) * 100;
      const y = 24 - h * 18;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="instr-graph instr-graph--scope" aria-hidden>
      <svg className="instr-graph__svg" viewBox="0 0 100 48" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="48" className="instr-graph__bg" />
        <line x1="0" y1="24" x2="100" y2="24" className="instr-graph__axis" />
        <path d={path} className="instr-graph__trace" />
      </svg>
      <span className="instr-graph__caption">{label}</span>
    </div>
  );
}
