type ControlButtonProps = {
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  active?: boolean;
  placeholder?: boolean;
};

export function ControlButton({
  label,
  onClick,
  disabled = false,
  active = false,
  placeholder = false,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      className={`control-button${active ? ' control-button--active' : ''}${
        placeholder ? ' control-button--placeholder' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
