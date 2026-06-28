import { bootstrapInstrumentDefaults } from '../instrument/bootstrapDefaults';
import { registerMidiActionHandlers, initMidiPipeline } from '../input/MidiRouter';
import { beginInstrumentSession, toggleDemoSession } from './sessionStart';
import {
  transportPresetNext,
  transportPresetPrevious,
  transportPresetRandom,
  transportProgramChange,
  transportSetHold,
  transportStartSession,
  transportStop,
  transportToggleHold,
} from './transportActions';
import { isSessionStarted } from './transportStore';

let initialized = false;

/** Register MIDI handlers and pipeline once — all routes use transportActions. */
export function initTransport(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  bootstrapInstrumentDefaults();

  initMidiPipeline();

  registerMidiActionHandlers({
    onPlay: () => {
      if (!isSessionStarted()) {
        beginInstrumentSession('midi');
        return;
      }
      toggleDemoSession('midi');
    },
    onStop: () => transportStop('midi'),
    onToggleHold: transportToggleHold,
    onSetHold: transportSetHold,
    onPresetPrevious: () => transportPresetPrevious(),
    onPresetNext: () => transportPresetNext(),
    onPresetRandom: () => transportPresetRandom(),
    onProgramChange: transportProgramChange,
  });
}

function shouldIgnoreSpaceTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/** Spacebar toggles play/stop through the unified transport. */
export function attachTransportKeyboard(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.code !== 'Space') {
      return;
    }

    if (shouldIgnoreSpaceTarget(event.target)) {
      return;
    }

    event.preventDefault();

    if (!isSessionStarted()) {
      beginInstrumentSession('keyboard');
      return;
    }

    void transportStartSession('keyboard');
  };

  window.addEventListener('keydown', onKeyDown, { capture: true });
  return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
}
