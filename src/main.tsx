import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { bootstrapInstrumentDefaults } from './instrument/bootstrapDefaults';
import { runDevBootGuard } from './dev/bootGuard';
import './styles/main.scss';

if (runDevBootGuard()) {
  throw new Error('Stopped boot: open http://localhost:5270/ via npm run dev.');
}

bootstrapInstrumentDefaults();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
