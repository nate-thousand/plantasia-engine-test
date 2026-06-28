type ControlSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: boolean;
  highlighted?: boolean;
  learnActive?: boolean;
  onSelectLearn?: () => void;
};

export function ControlSlider({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = false,
  highlighted = false,
  learnActive = false,
  onSelectLearn,
}: ControlSliderProps) {
  return (
    <label
      className={`control-slider${placeholder ? ' control-slider--placeholder' : ''}${
        disabled ? ' control-slider--disabled' : ''
      }${highlighted ? ' control-slider--midi' : ''}${learnActive ? ' control-slider--learn' : ''}`}
    >
      <span className="control-slider__label">
        {onSelectLearn ? (
          <button
            type="button"
            className="control-slider__learn-btn"
            disabled={disabled}
            onClick={onSelectLearn}
          >
            {label}
          </button>
        ) : (
          label
        )}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="control-slider__value">{value}</span>
    </label>
  );
}
