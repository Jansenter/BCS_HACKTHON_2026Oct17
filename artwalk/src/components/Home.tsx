import { TOURS } from '../data/tours';
import { ARTWORKS, tourStops } from '../lib/data';
import { formatDistance, walkingEstimate } from '../lib/geo';
import { href } from '../lib/router';
import { useVisited } from '../lib/storage';
import ArtCover from './ArtCover';

export default function Home() {
  const { isVisited, visited } = useVisited();
  const totalVisited = ARTWORKS.filter((a) => visited.includes(a.id)).length;

  return (
    <div className="grain min-h-full">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-5 sm:px-8">
        <nav className="flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2" aria-label="ArtWalk home">
            <img src="/favicon.svg" alt="" width={30} height={30} />
            <span className="font-display text-xl font-semibold tracking-tight">ArtWalk</span>
          </a>
          <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold">📍 Downtown Vancouver</span>
        </nav>

        <header className="rise pb-8 pt-10 sm:pt-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-vermilion">Your personal city art storyteller</p>
          <h1 className="max-w-3xl font-display text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[68px]">
            Every corner has a story. <span className="italic text-ink-2">Go find it.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
            Pick a themed walk, listen to the story behind each artwork as you arrive, and look closer with small observation challenges along the way.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            <span>
              <strong className="font-display text-lg text-ink">{ARTWORKS.length}</strong> public artworks
            </span>
            <span>
              <strong className="font-display text-lg text-ink">{TOURS.length}</strong> curated walks
            </span>
            <span>
              <strong className="font-display text-lg text-ink">{totalVisited}</strong> visited by you
            </span>
          </div>
        </header>

        <section aria-labelledby="walks">
          <h2 id="walks" className="mb-4 font-display text-2xl font-semibold">
            Choose a walk
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {TOURS.map((tour, ti) => {
              const stops = tourStops(tour);
              const km = walkingEstimate(stops.map((s) => s.art));
              const done = stops.filter((s) => isVisited(s.art.id)).length;
              const pct = (done / stops.length) * 100;
              return (
                <a
                  key={tour.id}
                  href={href({ view: 'tour', tourId: tour.id })}
                  className="rise group flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-[0_1px_0_rgb(28_26_23/0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-18px_rgb(28_26_23/0.45)]"
                  style={{ animationDelay: `${80 + ti * 80}ms` }}
                >
                  <div className="grid h-40 grid-cols-3 gap-0.5 bg-line">
                    {stops.slice(0, 3).map(({ art }) => (
                      <ArtCover key={art.id} art={art} compact className="h-full" />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: tour.accent }}>
                      {tour.theme}
                    </p>
                    <h3 className="mt-1 font-display text-[28px] font-semibold leading-tight">{tour.title}</h3>
                    <p className="mt-1 text-ink-2">{tour.tagline}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full px-2.5 py-1" style={{ background: tour.accentSoft, color: tour.accent }}>
                        ⏱ ~{tour.minutes} min
                      </span>
                      <span className="rounded-full bg-paper-2 px-2.5 py-1">{formatDistance(km)}</span>
                      <span className="rounded-full bg-paper-2 px-2.5 py-1">{stops.length} stops</span>
                      <span className="rounded-full bg-paper-2 px-2.5 py-1">🎧 audio</span>
                    </div>
                    <div className="mt-auto pt-5">
                      {done > 0 && (
                        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tour.accent }} />
                        </div>
                      )}
                      <span
                        className="inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold text-white transition group-hover:gap-3"
                        style={{ background: tour.accent }}
                      >
                        {done === 0 ? 'Start the walk' : done === stops.length ? 'Completed ✓ · Revisit' : `Continue · ${done}/${stops.length}`}
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <a
            href={href({ view: 'explore' })}
            className="rise mt-5 flex items-center gap-4 rounded-3xl border border-dashed border-ink/25 p-5 transition hover:border-ink/50 hover:bg-card"
            style={{ animationDelay: '260ms' }}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-2xl text-paper" aria-hidden>
              ✦
            </span>
            <span className="flex-1">
              <span className="block font-display text-xl font-semibold">Wander freely</span>
              <span className="block text-sm text-ink-2">All {ARTWORKS.length} artworks on one map — filter, search, and find what’s nearest to you.</span>
            </span>
            <span className="text-xl" aria-hidden>
              →
            </span>
          </a>
        </section>

        <section className="mt-14 grid gap-6 sm:grid-cols-3" aria-label="How ArtWalk works">
          {[
            ['01', 'Pick a walk', 'Two curated routes through Downtown, each under an hour.'],
            ['02', 'Listen as you arrive', 'Every stop has a narrated story with a readable transcript.'],
            ['03', 'Look closer', 'Spot details, answer a question, and collect each stop.'],
          ].map(([n, t, d]) => (
            <div key={n} className="border-t-2 border-ink pt-3">
              <p className="font-display text-sm font-semibold text-vermilion">{n}</p>
              <p className="mt-1 font-display text-lg font-semibold">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 border-t border-line pt-5 text-xs leading-relaxed text-ink-3">
          Artwork data from the{' '}
          <a className="underline" href="https://opendata.vancouver.ca/explore/dataset/public-art/" target="_blank" rel="noreferrer">
            City of Vancouver Public Art Registry
          </a>
          , licensed under the Open Government Licence – Vancouver. Map © OpenStreetMap contributors © CARTO. ArtWalk is a hackathon prototype; progress is stored only on this device.
        </footer>
      </div>
    </div>
  );
}
