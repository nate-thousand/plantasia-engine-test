import type { SelectHTMLAttributes } from 'react';

type InstrSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function InstrSelect({ className = '', children, ...props }: InstrSelectProps) {
  return (
    <select className={`instr-select${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </select>
  );
}
