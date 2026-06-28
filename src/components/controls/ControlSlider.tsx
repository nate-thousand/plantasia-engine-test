type ControlSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  placeholder?: boolean;
  highlighted?: boolean;
  learnActive?: boolean;
  onSelectLearn?: () => void;
  title?: string;
};

export function ControlSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  disabled = false,
  placeholder = false,
  highlighted = false,
  learnActive = false,
  onSelectLearn,
  title,
}: ControlSliderProps) {
  return (
    <label
      title={title}
      className={`control-slider${placeholder ? ' control-slider--placeholder' : ''}${
        disabled ? ' control-slider--disabled' : ''
      }${highlighted ? ' control-slider--active control-slider--midi' : ''}${learnActive ? ' control-slider--learn' : ''}`}
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
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="control-slider__value">{value}</span>
    </label>
  );
}
