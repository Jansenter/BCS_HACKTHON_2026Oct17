import { useEffect, useRef, useState } from 'react';
import { TOURS, type Tour } from '../data/tours';
import { formatDistance } from '../lib/geo';
import { navigate } from '../lib/router';
import { useLanguage } from '../lib/language';

export default function Completion({
  tour,
  metres,
  stops,
  challengesDone,
  challengesRight,
  onClose,
}: {
  tour: Tour;
  metres: number;
  stops: number;
  challengesDone: number;
  challengesRight: number;
  onClose: () => void;
}) {
  const { t, language } = useLanguage();
  const other = TOURS.find((t) => t.id !== tour.id);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const share = async () => {
    const text = `I just completed “${tour.title}” on ArtWalk — ${stops} public artworks across ${formatDistance(metres)} of Downtown Vancouver. 🎨`;
    try {
      if (navigator.share) await navigator.share({ title: 'ArtWalk', text, url: location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${location.origin}`);
        setCopied(true);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] grid place-items-center bg-ink/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="done-title">
      <div className="pop w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="relative grid place-items-center px-6 pb-6 pt-8 text-white" style={{ background: tour.accent }}>
          <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="3" strokeDasharray="4 6" />
            <circle cx="48" cy="48" r="34" fill="#fffdf8" />
            <path d="M33 49l10 10 20-22" fill="none" stroke={tour.accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/80">{t('Walk complete')}</p>
          <h2 id="done-title" className="mt-1 text-center font-display text-3xl font-semibold leading-tight">
            {tour.title}
          </h2>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line text-center">
          <Stat value={String(stops)} label={t('artworks')} />
          <Stat value={formatDistance(metres)} label={language === 'zh' ? '步行' : t('walked')} />
          <Stat value={challengesDone ? `${challengesRight}/${challengesDone}` : '—'} label={t('challenges')} />
        </div>
        <div className="space-y-2 p-5">
          <p className="pb-2 text-center text-sm text-ink-2">You’ve discovered the stories hidden in your city. Thanks for looking closer.</p>
          <button onClick={share} className="h-12 w-full rounded-full bg-ink font-semibold text-paper">
            {copied ? (language === 'zh' ? '已复制 ✓' : language === 'fr' ? 'Copié ✓' : 'Copied to clipboard ✓') : t('Share your walk')}
          </button>
          {other && (
            <button
              onClick={() => {
                onClose();
                navigate({ view: 'tour', tourId: other.id });
              }}
              className="h-12 w-full rounded-full border border-line font-semibold"
            >
              {language === 'zh' ? `接下来尝试“${other.title}”` : language === 'fr' ? `Essayez « ${other.title} » ensuite` : `Try “${other.title}” next`}
            </button>
          )}
          <button ref={closeRef} onClick={onClose} className="h-10 w-full text-sm font-semibold text-ink-3">
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-4">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">{label}</p>
    </div>
  );
}
