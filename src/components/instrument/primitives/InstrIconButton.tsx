import type { ButtonHTMLAttributes } from 'react';
import { InstrIcon, type InstrIconName } from './InstrIcon';

type InstrIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: InstrIconName;
  label: string;
  active?: boolean;
};

export function InstrIconButton({
  icon,
  label,
  active = false,
  className = '',
  ...props
}: InstrIconButtonProps) {
  return (
    <button
      type="button"
      className={`instr-icon-btn${active ? ' instr-icon-btn--active' : ''}${className ? ` ${className}` : ''}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <InstrIcon name={icon} />
    </button>
  );
}
