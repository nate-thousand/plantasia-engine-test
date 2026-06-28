type InstrSwitchProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  onChange: (checked: boolean) => void;
};

export function InstrSwitch({ label, checked, disabled, hint, onChange }: InstrSwitchProps) {
  return (
    <label className="instr-switch">
      <input
        type="checkbox"
        className="instr-switch__input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="instr-switch__track" aria-hidden />
      <span className="instr-switch__label">{label}</span>
      {hint ? <span className="instr-hint">{hint}</span> : null}
    </label>
  );
}
