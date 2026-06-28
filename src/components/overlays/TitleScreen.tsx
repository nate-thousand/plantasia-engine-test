import { useSyncExternalStore } from 'react';
import { beginInstrumentSession } from '../../transport/sessionStart';
import {
  getTransportStore,
  isSessionStarted,
  isTransportAmbientActive,
  subscribeTransportStore,
} from '../../transport/transportStore';
import { useTransport } from '../../transport/useTransport';
import {
  PLANTASONIC_BANNER_COMPACT,
  PLANTASONIC_BANNER_STANDARD,
} from './plantasonicTitleBanner';

function isTitleVisible(): boolean {
  return !isSessionStarted() && !isTransportAmbientActive();
}

/** First-run title — full-screen tap target + spacebar ritual. Dismisses on begin. */
export function TitleScreen() {
  const transport = useTransport();
  const error = useSyncExternalStore(
    subscribeTransportStore,
    () => getTransportStore().error,
    () => null,
  );
  const visible = useSyncExternalStore(
    subscribeTransportStore,
    isTitleVisible,
    () => true,
  );

  if (!visible) {
    return null;
  }

  const prompt = transport.isInitializing
    ? 'Awakening…'
    : 'Press spacebar or tap anywhere to begin';

  const begin = () => {
    if (transport.isInitializing) {
      return;
    }
    beginInstrumentSession('pointer');
  };

  return (
    <div
      className="title-screen"
      role="button"
      tabIndex={0}
      aria-label="Begin Plantasonic"
      aria-hidden={!visible}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        begin();
      }}
    >
      <div className="title-screen__veil" aria-hidden="true" />
      <div className="title-screen__content" aria-hidden="true">
        <pre className="title-screen__logo title-screen__logo--standard">
          {PLANTASONIC_BANNER_STANDARD}
        </pre>
        <pre className="title-screen__logo title-screen__logo--compact">
          {PLANTASONIC_BANNER_COMPACT}
        </pre>
        <p className="title-screen__prompt">{prompt}</p>
        {error ? <p className="title-screen__error">{error}</p> : null}
      </div>
    </div>
  );
}
