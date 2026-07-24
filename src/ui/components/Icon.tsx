import type { CSSProperties, ReactNode } from 'react';

/**
 * Íconos vectoriales (estilo Material / trazo) inline — sin CDN, sin emojis,
 * 100% offline. Usan currentColor, así que heredan el color del texto.
 */
const ICONS = {
  'chevron-left': <polyline points="15 18 9 12 15 6" />,
  'chevron-right': <polyline points="9 18 15 12 9 6" />,
  'chevron-up': <polyline points="18 15 12 9 6 15" />,
  'chevron-down': <polyline points="6 9 12 15 18 9" />,
  'arrow-left': (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  'arrow-right': (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  hourglass: (
    <>
      <path d="M7 3h10" />
      <path d="M7 21h10" />
      <path d="M8 3v3.5a2 2 0 0 0 .6 1.4L12 11l3.4-3.1A2 2 0 0 0 16 6.5V3" />
      <path d="M8 21v-3.5a2 2 0 0 1 .6-1.4L12 13l3.4 3.1a2 2 0 0 1 .6 1.4V21" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 4 21 9 16 9" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v1.5a3 3 0 0 0 3 3" />
      <path d="M17 6h3v1.5a3 3 0 0 1-3 3" />
    </>
  ),
  cards: (
    <>
      <rect x="4" y="6" width="11" height="14" rx="2" />
      <path d="M8 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1" />
    </>
  ),
  chip: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6.4a3 3 0 0 1 0 5.6" />
      <path d="M15.5 14.3A6 6 0 0 1 21 20" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="8.5" r="4" />
      <path d="M11.5 11.5 20 20" />
      <path d="M16.5 15.5 19 13" />
    </>
  ),
  play: <polygon points="7 4 20 12 7 20 7 4" />,
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-3z" />
      <polyline points="9 12 11.5 14.5 15.5 10" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

export function Icon({ name, size = 20, className, strokeWidth = 2, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
