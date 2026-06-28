type InstrEnvelopeGraphProps = {
  attack: number;
  sustain: number;
  release: number;
};

/** Envelope shape — driven by growth, energy, drift. */
export function InstrEnvelopeGraph({ attack, sustain, release }: InstrEnvelopeGraphProps) {
  const a = 0.08 + (attack / 100) * 0.35;
  const s = 0.25 + (sustain / 100) * 0.55;
  const r = 0.12 + (release / 100) * 0.4;
  const path = [
    `M 0 44`,
    `L ${a * 100} ${44 - s * 40}`,
    `L ${(a + 0.35) * 100} ${44 - s * 40}`,
    `L ${(a + 0.35 + r) * 100} 44`,
  ].join(' ');

  return (
    <div className="instr-graph instr-graph--envelope" aria-hidden>
      <svg className="instr-graph__svg" viewBox="0 0 100 48" preserveAspectRatio="none">
        <line x1="0" y1="44" x2="100" y2="44" className="instr-graph__axis" />
        <path d={path} className="instr-graph__curve" />
      </svg>
      <span className="instr-graph__caption">Envelope</span>
    </div>
  );
}
