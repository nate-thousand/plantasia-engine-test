const ASCII_ECOSYSTEM_PREVIEW = `              ●
       ╱──────┼──────╲
     ●        ●        ●
   ╱ │ ╲            ╱ │ ╲
 ●  ●  ●          ●  ●  ●
       ╲          ╱
        ●────────●
        · · · · ·
            ●`;

const STATUS_ITEMS = [
  { label: 'Engine dependency', value: 'pending' },
  { label: 'Audio context', value: 'not started' },
  { label: 'Preset system', value: 'pending' },
  { label: 'MIDI', value: 'pending' },
] as const;

const PLACEHOLDER_CONTROLS = [
  'Start Audio',
  'Load Preset',
  'Play Note',
  'Stop Note',
] as const;

export function App() {
  return (
    <div id="plantasia-app" className="plantasia-app-shell min-vh-100" data-stage="shell">
      <header className="container py-4 py-md-5">
        <h1 className="display-6 mb-2">Plantasia Engine Test</h1>
        <p className="lead text-secondary mb-0">
          Living audiovisual instrument prototype.
        </p>
      </header>

      <main className="container pb-5">
        <section className="plantasia-section mb-5" aria-labelledby="sound-engine-status">
          <h2 id="sound-engine-status" className="h5 text-uppercase text-secondary mb-3">
            Sound Engine Status
          </h2>
          <div className="row g-3">
            {STATUS_ITEMS.map(({ label, value }) => (
              <div key={label} className="col-sm-6 col-lg-3">
                <div className="card h-100 plantasia-status-card">
                  <div className="card-body">
                    <h3 className="card-title h6 text-secondary mb-2">{label}</h3>
                    <p className="card-text mb-0">
                      <span className="badge plantasia-status-badge">{value}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="plantasia-section mb-5" aria-labelledby="ascii-grammar-preview">
          <h2 id="ascii-grammar-preview" className="h5 text-uppercase text-secondary mb-3">
            ASCII Grammar Preview
          </h2>
          <div className="card plantasia-ascii-card">
            <div className="card-body">
              <p className="small text-secondary mb-2">Ecosystem — complete instrument</p>
              <pre className="plantasia-ascii-preview mb-0" aria-label="ASCII ecosystem preview">
                {ASCII_ECOSYSTEM_PREVIEW}
              </pre>
            </div>
          </div>
        </section>

        <section className="plantasia-section" aria-labelledby="next-controls">
          <h2 id="next-controls" className="h5 text-uppercase text-secondary mb-3">
            Next Controls
          </h2>
          <div className="d-flex flex-wrap gap-2">
            {PLACEHOLDER_CONTROLS.map((label) => (
              <button
                key={label}
                type="button"
                className="btn btn-outline-primary"
                disabled
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
