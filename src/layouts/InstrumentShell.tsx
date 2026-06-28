import type { ReactNode } from 'react';

type InstrumentShellProps = {
  visualizer: ReactNode;
  controls: ReactNode;
  error: string | null;
};

export function InstrumentShell({ visualizer, controls, error }: InstrumentShellProps) {
  return (
    <div id="plantasia-app" className="instrument-shell" data-stage="instrument">
      <main className="instrument-stage">{visualizer}</main>
      {error ? (
        <div className="instrument-error" role="alert">
          {error}
        </div>
      ) : null}
      <footer className="instrument-footer">{controls}</footer>
    </div>
  );
}
