import { useMemo, useState } from 'react';
import { ARTWORKS, CATEGORIES, artistCredit, artworkById, categoryOf, stopFor, tourStops } from '../lib/data';
import { TOURS } from '../data/tours';
import { distance, formatDistance } from '../lib/geo';
import { useGeolocation } from '../lib/route';
import { navigate } from '../lib/router';
import { useVisited } from '../lib/storage';
import ArtMap, { categoryColor, type WalkPath } from './ArtMap';
import Shell, { BackIcon, IconButton, LocateIcon, LanguageButton } from './Shell';
import { useLanguage } from '../lib/language';
import StoryPanel from './StoryPanel';

export default function ExploreView({ artId }: { artId?: number }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [walkFilter, setWalkFilter] = useState('all');
  const [locate, setLocate] = useState(false);
  const { pos: me, error: geoError } = useGeolocation(locate);
  const { isVisited, toggle, visited } = useVisited();

  const walkPaths = useMemo<WalkPath[]>(() => TOURS.map((tour) => {
    const stops = tourStops(tour);
    return {
      id: tour.id,
      color: tour.accent,
      stopIds: stops.map(({ art }) => art.id),
      positions: stops.map(({ art }) => [art.lat, art.lon] as [number, number]),
    };
  }), []);
  const allWalkStopIds = useMemo(() => new Set(walkPaths.flatMap((walk) => walk.stopIds)), [walkPaths]);
  const visibleWalkPaths = useMemo(
    () => walkFilter === 'all' || walkFilter === 'walks' ? walkPaths : walkPaths.filter((walk) => walk.id === walkFilter),
    [walkFilter, walkPaths],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ARTWORKS.filter((a) => {
      if (walkFilter === 'walks' && !allWalkStopIds.has(a.id)) return false;
      if (walkFilter !== 'all' && walkFilter !== 'walks' && !walkPaths.find((walk) => walk.id === walkFilter)?.stopIds.includes(a.id)) return false;
      if (cats.length && !cats.includes(categoryOf(a.type))) return false;
      if (!q) return true;
      return [a.title, a.site, a.address, a.type, a.material, ...a.artists, String(a.year ?? '')]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
    return me ? [...list].sort((a, b) => distance(me, a) - distance(me, b)) : [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, [query, cats, me, walkFilter, allWalkStopIds, walkPaths]);

  const open = artId ? artworkById(artId) : undefined;
  const ctx = open ? stopFor(open.id) : undefined;
  const go = (id?: number) => navigate({ view: 'explore', art: id });
  const toggleCat = (k: string) => setCats((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  const visitedHere = ARTWORKS.filter((a) => visited.includes(a.id)).length;

  const header = (
    <div className="border-b border-line px-4 pb-3 pt-3">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate({ view: 'home' })} className="-ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2" aria-label={t('Back home')}>
          <BackIcon />
        </button>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-vermilion">{t('Art map')}</p>
          <h1 className="font-display text-[22px] font-semibold leading-tight">{t('Explore Downtown')}</h1>
        </div>
        <p className="text-right text-xs text-ink-3">
          <span className="font-display text-lg font-semibold text-ink">{visitedHere}</span>/{ARTWORKS.length}
          <br />
          {t('visited')}
        </p>
      </div>
      <label className="mt-3 flex items-center gap-2 rounded-full border border-line bg-card px-4 focus-within:border-ink/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-ink-3" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Search title, artist, place, material…')}
          className="h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
          aria-label={t('Search artworks')}
        />
      </label>
      <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {CATEGORIES.map((c) => {
          const on = cats.includes(c.key);
          const color = categoryColor(c.types[0]);
          return (
            <button
              key={c.key}
              onClick={() => toggleCat(c.key)}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-card'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">{t('Walking routes')}</p>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {[
            { id: 'all', label: t('All artworks'), color: undefined },
            { id: 'walks', label: t('Walk stops'), color: undefined },
            ...TOURS.map((tour) => ({ id: tour.id, label: tour.title, color: tour.accent })),
          ].map((option) => {
            const on = walkFilter === option.id;
            return <button
              key={option.id}
              onClick={() => setWalkFilter(option.id)}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-card'}`}
            >
              {option.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: option.color }} aria-hidden />}
              {option.label}
            </button>;
          })}
        </div>
      </div>
    </div>
  );

  const panel = (
    <ul className="divide-y divide-line px-2 pb-10">
      <li className="px-2 py-2 text-xs text-ink-3">
        {filtered.length} {filtered.length === 1 ? 'artwork' : 'artworks'}{me ? ' · nearest first' : ''}
      </li>
      {filtered.map((a) => {
        const credit = artistCredit(a, stopFor(a.id)?.stop);
        return (
          <li key={a.id}>
            <button onClick={() => go(a.id)} className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-paper-2">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: categoryColor(a.type) }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{a.title}</span>
                <span className="block truncate text-sm text-ink-3">
                  {a.year ?? '—'} · {credit.source === 'unknown' ? a.type : credit.name}
                </span>
              </span>
              <span className="shrink-0 text-xs text-ink-3">
                {isVisited(a.id) ? <span className="font-semibold text-good">✓</span> : me ? formatDistance(distance(me, a)) : ''}
              </span>
            </button>
          </li>
        );
      })}
      {!filtered.length && <li className="px-2 py-10 text-center text-ink-3">{t('No artworks match. Try another word or clear the filters.')}</li>}
    </ul>
  );

  const map = (
    <>
      <ArtMap
        mode="explore"
        fitKey={`explore-${cats.join(',')}-${walkFilter}-${query.length > 1 ? query : ''}`}
        points={filtered.map((art) => ({ art, visited: isVisited(art.id) }))}
        activeId={open?.id}
        focusId={open?.id}
        onSelect={(id) => go(id)}
        me={me}
        walkPaths={visibleWalkPaths}
        fitPositions={walkFilter === 'all' ? undefined : visibleWalkPaths.flatMap((walk) => walk.positions)}
      />
      <div className="absolute right-3 top-3 z-[500] flex items-center gap-2">
        <IconButton label={locate ? t('Stop showing my location') : t('Show my location')} onClick={() => setLocate((v) => !v)}>
          <LocateIcon on={locate && !!me} />
        </IconButton>
        <LanguageButton />
      </div>
      {geoError && locate && <p className="absolute left-3 top-3 z-[500] max-w-[70%] rounded-xl bg-card px-3 py-2 text-xs shadow">{geoError}</p>}
    </>
  );

  const story = open && (
    <StoryPanel
      key={open.id}
      art={open}
      stop={ctx?.stop}
      partOf={ctx?.tour}
      visited={isVisited(open.id)}
      me={me}
      onToggleVisited={() => toggle(open.id)}
      onClose={() => go(undefined)}
      onGo={(id) => go(id)}
    />
  );

  return <Shell header={header} panel={panel} map={map} story={story || undefined} />;
}
