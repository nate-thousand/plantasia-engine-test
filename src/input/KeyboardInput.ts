import { getKeyboardNote } from './noteMap';

export type KeyboardInputHandlers = {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff: (midi: number) => void;
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
  private heldKeys = new Set<string>();
  private handlers: KeyboardInputHandlers;

  constructor(handlers: KeyboardInputHandlers) {
    this.handlers = handlers;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      for (const key of this.heldKeys) {
        const mapping = getKeyboardNote(key);
        if (mapping) {
          this.handlers.onNoteOff(mapping.midi);
        }
      }
      this.heldKeys.clear();
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

    const mapping = getKeyboardNote(event.key);
    if (!mapping || this.heldKeys.has(event.key.toLowerCase())) {
      return;
    }

    event.preventDefault();
    this.heldKeys.add(event.key.toLowerCase());
    this.handlers.onNoteOn(mapping.midi, 100);
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
    this.handlers.onNoteOff(mapping.midi);
  };

  private handleBlur = (): void => {
    this.releaseAllKeys();
  };

  private releaseAllKeys(): void {
    for (const key of this.heldKeys) {
      const mapping = getKeyboardNote(key);
      if (mapping) {
        this.handlers.onNoteOff(mapping.midi);
      }
    }
    this.heldKeys.clear();
  }
}
