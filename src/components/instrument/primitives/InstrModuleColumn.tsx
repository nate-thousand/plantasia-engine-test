import type { ReactNode } from 'react';

type InstrModuleColumnProps = {
  index: string;
  title: string;
  children: ReactNode;
  className?: string;
};

/** Hardware module column — numbered zone with vertical divider. */
export function InstrModuleColumn({
  index,
  title,
  children,
  className = '',
}: InstrModuleColumnProps) {
  return (
    <section
      className={`ws-module${className ? ` ${className}` : ''}`}
      aria-label={title}
    >
      <header className="ws-module__head">
        <span className="ws-module__index">{index}</span>
        <h2 className="ws-module__title">{title}</h2>
      </header>
      <div className="ws-module__body">{children}</div>
    </section>
  );
}

type WsZoneProps = {
  label: string;
  children: ReactNode;
};

export function WsZone({ label, children }: WsZoneProps) {
  return (
    <div className="ws-zone">
      <span className="ws-zone__label">{label}</span>
      <div className="ws-zone__content">{children}</div>
    </div>
  );
}
