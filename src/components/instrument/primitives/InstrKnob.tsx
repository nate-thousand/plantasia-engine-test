import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react';

type InstrKnobProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  active?: boolean;
  learnActive?: boolean;
  title?: string;
  onSelectLearn?: () => void;
  onChange: (value: number) => void;
};

const RING_RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ARC_FRACTION = 0.75;

export function InstrKnob({
  label,
  value,
  min = 0,
  max = 100,
  disabled = false,
  active = false,
  learnActive = false,
  title,
  onSelectLearn,
  onChange,
}: InstrKnobProps) {
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null);

  const norm = (value - min) / (max - min);
  const dashOffset = CIRCUMFERENCE * (1 - norm * ARC_FRACTION);
  const angle = -135 + norm * 270;
  const indicatorRad = (angle * Math.PI) / 180;
  const indicatorX = 32 + Math.cos(indicatorRad) * 14;
  const indicatorY = 32 + Math.sin(indicatorRad) * 14;

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (disabled) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { startY: event.clientY, startValue: value };
    },
    [disabled, value],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragRef.current || disabled) {
        return;
      }
      const delta = dragRef.current.startY - event.clientY;
      const next = Math.round(
        dragRef.current.startValue + (delta / 120) * (max - min),
      );
      onChange(Math.max(min, Math.min(max, next)));
    },
    [disabled, max, min, onChange],
  );

  const handlePointerUp = useCallback((event: PointerEvent) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) {
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        event.preventDefault();
        onChange(Math.min(max, value + 1));
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        event.preventDefault();
        onChange(Math.max(min, value - 1));
      }
    },
    [disabled, max, min, onChange, value],
  );

  return (
    <div
      className={`instr-knob${active ? ' instr-knob--active' : ''}${learnActive ? ' instr-knob--learn' : ''}${disabled ? ' instr-knob--disabled' : ''}`}
      title={title}
    >
      <div
        className="instr-knob__body"
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <svg className="instr-knob__svg" viewBox="0 0 64 64" aria-hidden>
          <circle className="instr-knob__ring-bg" cx="32" cy="32" r={RING_RADIUS} />
          <circle
            className="instr-knob__ring-value"
            cx="32"
            cy="32"
            r={RING_RADIUS}
            strokeDasharray={`${CIRCUMFERENCE * ARC_FRACTION} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            transform="rotate(135 32 32)"
          />
          <circle className="instr-knob__cap" cx="32" cy="32" r="12" />
          <line
            className="instr-knob__indicator"
            x1="32"
            y1="32"
            x2={indicatorX}
            y2={indicatorY}
          />
        </svg>
      </div>
      {onSelectLearn ? (
        <button type="button" className="instr-knob__label" onClick={onSelectLearn}>
          {label}
        </button>
      ) : (
        <span className="instr-knob__label">{label}</span>
      )}
      <span className="instr-knob__value">{value}</span>
    </div>
  );
}
