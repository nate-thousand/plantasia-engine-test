import type { ReactNode } from 'react';

type InstrPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function InstrPanel({ title, subtitle, children, className = '' }: InstrPanelProps) {
  return (
    <section className={`instr-panel${className ? ` ${className}` : ''}`} aria-label={title}>
      <header className="instr-panel__header">
        <h2 className="instr-panel__title">{title}</h2>
        {subtitle ? <span className="instr-panel__subtitle">{subtitle}</span> : null}
      </header>
      <div className="instr-panel__body">{children}</div>
    </section>
  );
}

type InstrSubsectionProps = {
  label: string;
  children: ReactNode;
};

export function InstrSubsection({ label, children }: InstrSubsectionProps) {
  return (
    <div className="instr-subsection">
      <h3 className="instr-subsection__label">{label}</h3>
      <div className="instr-subsection__grid">{children}</div>
    </div>
  );
}
