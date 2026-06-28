import { getKeyboardNote, midiToNoteName } from './noteMap';

export type KeyboardInputHandlers = {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff: (midi: number) => void;
  onOctaveChange?: (offset: number) => void;
};

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'SELECT' ||
    tag === 'TEXTAREA' ||
    target.isContentEditable
  );
}

export class KeyboardInput {
  private enabled = true;
  private attached = false;
  private octaveOffset = 0;
  private readonly heldKeys = new Set<string>();
  private readonly handlers: KeyboardInputHandlers;

  constructor(handlers: KeyboardInputHandlers) {
    this.handlers = handlers;
  }

  getOctaveOffset(): number {
    return this.octaveOffset;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.releaseAllKeys();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  attach(): void {
    if (this.attached) {
      return;
    }

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) {
      return;
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.releaseAllKeys();
    this.attached = false;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || event.repeat) {
      return;
    }

    if (shouldIgnoreTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'z') {
      event.preventDefault();
      this.shiftOctave(-1);
      return;
    }

    if (key === 'x') {
      event.preventDefault();
      this.shiftOctave(1);
      return;
    }

    const mapping = getKeyboardNote(key);
    if (!mapping || this.heldKeys.has(key)) {
      return;
    }

    event.preventDefault();
    this.heldKeys.add(key);
    const midi = mapping.midi + this.octaveOffset * 12;
    this.handlers.onNoteOn(midi, 100);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (!this.heldKeys.has(key)) {
      return;
    }

    const mapping = getKeyboardNote(key);
    if (!mapping) {
      return;
    }

    if (shouldIgnoreTarget(event.target)) {
      return;
    }

    event.preventDefault();
    this.heldKeys.delete(key);
    const midi = mapping.midi + this.octaveOffset * 12;
    this.handlers.onNoteOff(midi);
  };

  private handleBlur = (): void => {
    this.releaseAllKeys();
  };

  private shiftOctave(delta: number): void {
    this.releaseAllKeys();
    this.octaveOffset = Math.max(-2, Math.min(2, this.octaveOffset + delta));
    this.handlers.onOctaveChange?.(this.octaveOffset);
  }

  private releaseAllKeys(): void {
    for (const key of this.heldKeys) {
      const mapping = getKeyboardNote(key);
      if (mapping) {
        const midi = mapping.midi + this.octaveOffset * 12;
        this.handlers.onNoteOff(midi);
      }
    }
    this.heldKeys.clear();
  }
}

/** Human-readable keyboard range label for UI. */
export function keyboardRangeLabel(octaveOffset = 0): string {
  const baseMidi = 60 + octaveOffset * 12;
  const topMidi = 72 + octaveOffset * 12;
  return `${midiToNoteName(baseMidi)}–${midiToNoteName(topMidi)}`;
}
