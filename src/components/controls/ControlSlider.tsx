type ControlSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: boolean;
};

export function ControlSlider({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = false,
}: ControlSliderProps) {
  return (
    <label
      className={`control-slider${placeholder ? ' control-slider--placeholder' : ''}${
        disabled ? ' control-slider--disabled' : ''
      }`}
    >
      <span className="control-slider__label">{label}</span>
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
