import { registerMidiActionHandlers, initMidiPipeline } from '../input/MidiRouter';
import {
  transportPlay,
  transportPresetNext,
  transportPresetPrevious,
  transportPresetRandom,
  transportProgramChange,
  transportSetHold,
  transportStop,
  transportToggleHold,
  toggleTransportPlayStop,
} from './transportActions';

let initialized = false;

/** Register MIDI handlers and pipeline once — all routes use transportActions. */
export function initTransport(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  initMidiPipeline();

  registerMidiActionHandlers({
    onPlay: () => void transportPlay('midi'),
    onStop: () => transportStop('midi'),
    onToggleHold: transportToggleHold,
    onSetHold: transportSetHold,
    onPresetPrevious: () => transportPresetPrevious(),
    onPresetNext: () => transportPresetNext(),
    onPresetRandom: () => transportPresetRandom(),
    onProgramChange: transportProgramChange,
  });
}

/** Spacebar toggles play/stop through the unified transport. */
export function attachTransportKeyboard(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.code !== 'Space') {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement
    ) {
      return;
    }

    event.preventDefault();
    void toggleTransportPlayStop('keyboard');
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
