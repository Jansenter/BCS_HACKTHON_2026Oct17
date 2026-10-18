import { useEffect, useMemo, useRef, useState } from 'react';
import type { Tour } from '../data/tours';
import { tourStops } from '../lib/data';
import { distance, formatDistance, walkMinutes } from '../lib/geo';
import { useGeolocation, useWalkRoute } from '../lib/route';
import { navigate } from '../lib/router';
import { useChallenges, useVisited } from '../lib/storage';
import ArtCover from './ArtCover';
import ArtMap from './ArtMap';
import Completion from './Completion';
import Shell, { BackIcon, IconButton, LocateIcon } from './Shell';
import StoryPanel from './StoryPanel';

export default function TourView({ tour, artId }: { tour: Tour; artId?: number }) {
  const stops = useMemo(() => tourStops(tour), [tour]);
  const { isVisited, toggle, reset } = useVisited();
  const { answers } = useChallenges();
  const [locate, setLocate] = useState(false);
  const { pos: me, error: geoError } = useGeolocation(locate);
  const route = useWalkRoute(tour.id, stops.map((s) => s.art));

  const done = stops.filter((s) => isVisited(s.art.id)).length;
  const complete = done === stops.length;
  const nextIdx = stops.findIndex((s) => !isVisited(s.art.id));
  const next = nextIdx >= 0 ? stops[nextIdx] : undefined;

  // Celebrate only on the transition to complete, not when reopening a finished tour.
  const [celebrate, setCelebrate] = useState(false);
  const wasComplete = useRef(complete);
  useEffect(() => {
    if (complete && !wasComplete.current) setCelebrate(true);
    wasComplete.current = complete;
  }, [complete]);

  const openIdx = artId ? stops.findIndex((s) => s.art.id === artId) : -1;
  const open = openIdx >= 0 ? stops[openIdx] : undefined;
  const go = (id?: number) => navigate({ view: 'tour', tourId: tour.id, art: id });

  const quizKeys = stops.flatMap((s) => [`material-${s.art.id}`, `year-${s.art.id}`, `look-${s.art.id}`]);
  const challengesDone = quizKeys.filter((k) => answers[k] !== undefined).length;
  const challengesRight = quizKeys.filter((k) => answers[k] === true).length;

  const header = (
    <div className="border-b border-line px-4 pb-3 pt-3">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate({ view: 'explore' })} className="-ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2" aria-label="Back to Explore">
          <BackIcon />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tour.accent }}>
            Walking tour
          </p>
          <h1 className="truncate font-display text-[22px] font-semibold leading-tight">{tour.title}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold leading-none">
            {done}
            <span className="text-base text-ink-3">/{stops.length}</span>
          </p>
          <p className="text-[11px] font-medium text-ink-3">visited</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuemin={0} aria-valuemax={stops.length} aria-valuenow={done} aria-label="Tour progress">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(done / stops.length) * 100}%`, background: tour.accent }} />
      </div>
      <p className="mt-2 text-xs text-ink-3">
        {formatDistance(route.metres)} {route.source === 'estimate' ? 'est. walk' : 'walk'} · ~{Math.max(tour.minutes, walkMinutes(route.metres))} min with stops
      </p>
    </div>
  );

  const panel = (
    <div className="px-4 pb-10 pt-4">
      {complete ? (
        <button onClick={() => setCelebrate(true)} className="mb-4 w-full rounded-2xl p-4 text-left text-white" style={{ background: tour.accent }}>
          <p className="font-display text-xl font-semibold">Tour complete 🎉</p>
          <p className="text-sm text-white/85">See your walk summary</p>
        </button>
      ) : (
        next && (
          <button
            onClick={() => go(next.art.id)}
            className="rise mb-5 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-line bg-card p-2 pr-4 text-left shadow-sm transition hover:shadow-md"
          >
            <ArtCover art={next.art} compact className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: tour.accent }}>
                {done === 0 ? 'Start here' : 'Next stop'} · {nextIdx + 1}
              </p>
              <p className="truncate font-display text-lg font-semibold leading-snug">{next.art.title}</p>
              <p className="truncate text-sm text-ink-3">
                {me ? `${formatDistance(distance(me, next.art))} from you` : next.art.site ?? next.art.address}
              </p>
            </div>
            <span className="text-xl" aria-hidden>
              →
            </span>
          </button>
        )
      )}

      <ol className="relative">
        {stops.map(({ art }, i) => {
          const v = isVisited(art.id);
          const leg = i > 0 ? distance(stops[i - 1].art, art) * 1.3 : 0;
          return (
            <li key={art.id} className="relative pl-12">
              {i < stops.length - 1 && <span className="absolute bottom-0 left-[17px] top-9 w-0.5 bg-line" aria-hidden />}
              <button
                onClick={() => toggle(art.id)}
                className="absolute left-0 top-1.5 grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold transition active:scale-90"
                style={v ? { background: '#2f7d4f', borderColor: '#2f7d4f', color: 'white' } : { borderColor: tour.accent, color: tour.accent, background: '#fffdf8' }}
                aria-label={v ? `Unmark ${art.title} as visited` : `Mark ${art.title} as visited`}
                aria-pressed={v}
              >
                {v ? '✓' : i + 1}
              </button>
              {i > 0 && <p className="-mt-1 mb-1 text-[11px] font-medium text-ink-3">↓ {formatDistance(leg)} walk</p>}
              <button onClick={() => go(art.id)} className="mb-3 block w-full rounded-xl px-2 py-2 text-left transition hover:bg-paper-2">
                <p className={`font-semibold leading-snug ${v ? 'text-ink-3 line-through decoration-1' : ''}`}>{art.title}</p>
                <p className="text-sm text-ink-3">
                  {art.year ?? '—'} · {art.type}
                </p>
              </button>
            </li>
          );
        })}
      </ol>

      {done > 0 && (
        <button onClick={() => reset(stops.map((s) => s.art.id))} className="mt-4 text-sm font-semibold text-ink-3 underline underline-offset-4">
          Reset tour progress
        </button>
      )}
    </div>
  );

  const map = (
    <>
      <ArtMap
        mode="tour"
        fitKey={tour.id}
        accent={tour.accent}
        points={stops.map(({ art }, i) => ({ art, label: String(i + 1), visited: isVisited(art.id) }))}
        path={route.path}
        activeId={open?.art.id ?? next?.art.id}
        focusId={open?.art.id}
        onSelect={(id) => go(id)}
        me={me}
      />
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <IconButton label={locate ? 'Stop showing my location' : 'Show my location'} onClick={() => setLocate((v) => !v)}>
          <LocateIcon on={locate && !!me} />
        </IconButton>
      </div>
      {geoError && locate && (
        <p className="absolute left-3 top-3 z-[500] max-w-[70%] rounded-xl bg-card px-3 py-2 text-xs shadow">{geoError}</p>
      )}
    </>
  );

  const story = open && (
    <StoryPanel
      key={open.art.id}
      art={open.art}
      tour={tour}
      stop={open.stop}
      index={openIdx}
      total={stops.length}
      prev={stops[openIdx - 1]?.art}
      next={stops[openIdx + 1]?.art}
      visited={isVisited(open.art.id)}
      me={me}
      onToggleVisited={() => toggle(open.art.id)}
      onClose={() => go(undefined)}
      onGo={(id) => go(id)}
    />
  );

  return (
    <>
      <Shell header={header} panel={panel} map={map} story={story || undefined} />
      {celebrate && (
        <Completion
          tour={tour}
          metres={route.metres}
          stops={stops.length}
          challengesDone={challengesDone}
          challengesRight={challengesRight}
          onClose={() => {
            setCelebrate(false);
            go(undefined);
          }}
        />
      )}
    </>
  );
}
