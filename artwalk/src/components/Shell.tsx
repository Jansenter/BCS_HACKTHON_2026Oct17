import type { ReactNode } from 'react';

/**
 * Responsive map + panel layout.
 *  - Phone: map on top (~46% height), panel below; an open story covers the screen.
 *  - Desktop: panel (list or story) in a 440px left column, map fills the rest.
 */
export default function Shell({ header, map, panel, story }: { header: ReactNode; map: ReactNode; panel: ReactNode; story?: ReactNode }) {
  return (
    <div className="flex h-full flex-col md:grid md:grid-cols-[440px_1fr] md:grid-rows-1">
      <div className="relative order-2 flex min-h-0 flex-1 flex-col border-line bg-paper md:order-1 md:border-r">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{panel}</div>
        {story && <div className="fixed inset-0 z-[1200] md:absolute md:z-10">{story}</div>}
      </div>
      <div className="relative order-1 h-[46svh] shrink-0 md:order-2 md:h-full">{map}</div>
    </div>
  );
}

export function IconButton({ label, onClick, children, className = '' }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-full bg-card text-ink shadow-[0_2px_10px_rgb(28_26_23/0.18)] transition hover:bg-white active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const LocateIcon = ({ on }: { on: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on ? '#2b6cdf' : 'currentColor'} strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4" fill={on ? '#2b6cdf' : 'none'} />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);
