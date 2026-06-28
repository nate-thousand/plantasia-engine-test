import type { ReactNode } from 'react';

type ControlGroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ControlGroup({ label, children, className, bodyClassName }: ControlGroupProps) {
  const groupClass = className ? `control-group ${className}` : 'control-group';
  const bodyClass = bodyClassName
    ? `control-group__body ${bodyClassName}`
    : 'control-group__body';

  return (
    <section className={groupClass} aria-label={label}>
      <h3 className="control-group__label">{label}</h3>
      <div className={bodyClass}>{children}</div>
    </section>
  );
}
