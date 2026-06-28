type InstrFilterGraphProps = {
  cutoff: number;
  resonance: number;
};

/** Filter response curve — cutoff from tone, peak from texture. */
export function InstrFilterGraph({ cutoff, resonance }: InstrFilterGraphProps) {
  const fc = cutoff / 100;
  const q = resonance / 100;
  const knee = 0.15 + fc * 0.65;
  const peak = 0.35 + q * 0.45;
  const path = [
    `M 0 42`,
    `L ${knee * 40} ${42 - peak * 28}`,
    `Q ${(knee + 0.08) * 50} ${42 - peak * 32} ${knee * 60 + 20} 38`,
    `L 100 40`,
  ].join(' ');

  return (
    <div className="instr-graph instr-graph--filter" aria-hidden>
      <svg className="instr-graph__svg" viewBox="0 0 100 48" preserveAspectRatio="none">
        <line x1="0" y1="44" x2="100" y2="44" className="instr-graph__axis" />
        <path d={path} className="instr-graph__curve" />
      </svg>
      <span className="instr-graph__caption">Filter</span>
    </div>
  );
}
