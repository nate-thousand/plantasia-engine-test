/**
 * Dev-only guard for opening index.html via the file:// protocol.
 * Stripped from production builds via import.meta.env.DEV.
 */
export function runDevBootGuard(): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }

  if (window.location.protocol !== 'file:') {
    return false;
  }

  const root = document.getElementById('root');
  if (!root) {
    return true;
  }

  root.innerHTML =
    '<div class="boot-panel" style="padding:1rem;font-family:system-ui,sans-serif">' +
    '<h1 style="font-size:1rem;margin:0 0 .5rem">Dev server required</h1>' +
    '<p style="margin:0 0 .75rem;opacity:.9">Do not open this HTML file directly.</p>' +
    '<p style="margin:0;opacity:.9">Run <code>npm run dev</code> in <code>plantasia-engine-test</code>, then open <code>http://localhost:5270/</code></p>' +
    '</div>';

  return true;
}
