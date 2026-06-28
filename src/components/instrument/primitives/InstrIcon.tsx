export type InstrIconName =
  | 'play'
  | 'stop'
  | 'record'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'panel';

type InstrIconProps = {
  name: InstrIconName;
  size?: number;
};

const PATHS: Record<InstrIconName, string> = {
  play: 'M9 7l10 5-10 5V7z',
  stop: 'M7 7h10v10H7z',
  record: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  panel: 'M4 6h16M4 12h16M4 18h10',
};

export function InstrIcon({ name, size = 18 }: InstrIconProps) {
  return (
    <svg
      className="instr-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
