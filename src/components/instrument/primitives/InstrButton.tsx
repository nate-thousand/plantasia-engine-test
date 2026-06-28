import type { ButtonHTMLAttributes, ReactNode } from 'react';

type InstrButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: 'default' | 'ghost' | 'compact';
  children: ReactNode;
};

export function InstrButton({
  active = false,
  variant = 'default',
  className = '',
  children,
  ...props
}: InstrButtonProps) {
  const variantClass =
    variant === 'ghost' ? ' instr-btn--ghost' : variant === 'compact' ? ' instr-btn--compact' : '';

  return (
    <button
      type="button"
      className={`instr-btn${active ? ' instr-btn--active' : ''}${variantClass}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
