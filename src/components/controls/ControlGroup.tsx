import type { ReactNode } from 'react';

type ControlGroupProps = {
  label: string;
  children: ReactNode;
};

export function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <section className="control-group" aria-label={label}>
      <h3 className="control-group__label">{label}</h3>
      <div className="control-group__body">{children}</div>
    </section>
  );
}
