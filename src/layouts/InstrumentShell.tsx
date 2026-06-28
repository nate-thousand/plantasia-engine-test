import type { ReactNode } from 'react';

type InstrumentShellProps = {
  visualizer: ReactNode;
  workstation: ReactNode;
  error: string | null;
};

export function InstrumentShell({ visualizer, workstation, error }: InstrumentShellProps) {
  return (
    <div
      id="plantasia-app"
      className="instrument-shell instrument-shell--m14"
      data-ui="m14-workstation"
      data-stage="instrument"
    >
      <main className="instrument-stage">{visualizer}</main>
      {error ? (
        <div className="instrument-error" role="alert">
          {error}
        </div>
      ) : null}
      <aside className="instrument-workstation" aria-label="Instrument workstation">
        {workstation}
      </aside>
    </div>
  );
}
