export type PointerStoreState = {
  /** Grid column 0–width. */
  gridX: number;
  /** Grid row 0–height. */
  gridY: number;
  active: boolean;
  /** True when last input was touch (mobile). */
  isTouch: boolean;
  /** Normalized pointer speed 0–1. */
  velocity: number;
  /** Decaying activity 0–1 for visual energy. */
  activity: number;
};

const initialState: PointerStoreState = {
  gridX: 0,
  gridY: 0,
  active: false,
  isTouch: false,
  velocity: 0,
  activity: 0,
};

let state: PointerStoreState = { ...initialState };
const listeners = new Set<() => void>();

let lastGridX = 0;
let lastGridY = 0;
let lastMoveAt = 0;

export function getPointerStore(): PointerStoreState {
  return state;
}

export function subscribePointerStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Update pointer position in ASCII grid coordinates. */
export function updatePointerGrid(
  gridX: number,
  gridY: number,
  active: boolean,
  isTouch = false,
): void {
  const now = performance.now();
  const dx = gridX - lastGridX;
  const dy = gridY - lastGridY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dt = Math.max(1, now - lastMoveAt);
  const speed = Math.min(1, dist / (dt * 0.08));

  lastGridX = gridX;
  lastGridY = gridY;
  lastMoveAt = now;

  const activityBoost = active
    ? isTouch
      ? 0.35 + speed * 0.85
      : 0.2 + speed * 0.65
    : speed * 0.35;

  state = {
    gridX,
    gridY,
    active,
    isTouch,
    velocity: speed,
    activity: Math.max(state.activity, activityBoost),
  };
  emit();
}

export function clearPointer(): void {
  state = { ...state, active: false, velocity: 0 };
  emit();
}

/** Per-frame decay — pointer activity settles back toward idle. */
export function decayPointerActivity(step = 0.018): void {
  if (state.activity > 0) {
    state = {
      ...state,
      activity: Math.max(0, state.activity - step),
      velocity: state.velocity * 0.92,
    };
    emit();
  }
}
