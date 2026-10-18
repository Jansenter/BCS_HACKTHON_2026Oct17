import { useEffect, useState } from 'react';
import { TOURS } from '../data/tours';
import { ARTWORKS, tourStops } from '../lib/data';
import { formatDistance, walkingEstimate } from '../lib/geo';
import { href, navigate } from '../lib/router';
import { useVisited } from '../lib/storage';
import ArtCover from './ArtCover';
import ArtMap from './ArtMap';
import CommunityHub from './CommunityHub';

const HERO_IMAGES = [
  { src: '/images/vancouver-lighthouse.webp', alt: 'Lighthouse on the rocky Vancouver coast' },
  { src: '/images/gastown.webp', alt: 'Tree-lined street in historic Gastown' },
  { src: '/images/vancouver-waterfront.webp', alt: 'Vancouver waterfront at sunset' },
  { src: '/images/capilano-bridge.jpg', alt: 'Suspension bridge through a Vancouver forest' },
];

export default function Home() {
  const { isVisited, visited } = useVisited();
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const totalVisited = ARTWORKS.filter((a) => visited.includes(a.id)).length;
  const previewTour = TOURS[0];
  const previewStops = tourStops(previewTour);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroImageIndex((index) => (index + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="grain min-h-full">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-5 sm:px-8">
        <nav className="relative z-10 flex items-center justify-between text-white">
          <a href="#/" className="flex items-center gap-2" aria-label="ArtWalk home">
            <img src="/favicon.svg" alt="" width={30} height={30} />
            <span className="font-display text-xl font-semibold tracking-tight">ArtWalk</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="location-badge rounded-full border px-3 py-1.5 text-xs font-semibold">📍 Downtown Vancouver</span>
          </div>
        </nav>

        <div className="hero-slideshow">
          <div className="hero-slideshow-images" aria-hidden="true">
            {HERO_IMAGES.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt=""
                className={`hero-slideshow-image ${index === heroImageIndex ? 'is-active' : ''}`}
              />
            ))}
          </div>

        <header className="rise pb-8 pt-10 text-center sm:pt-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-vermilion">Your personal city art storyteller</p>
          <h1 className="mx-auto max-w-3xl font-display text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[68px]">
            Every corner has a story. <span className="home-cta-fade italic text-ink-2">Go find it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
            Pick a themed walk, listen to the story behind each artwork as you arrive, and look closer with small observation challenges along the way.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-2">
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

        <section className="hero-wander" aria-label="Explore artworks">
          <a
            href={href({ view: 'explore' })}
            className="rise wander-link mb-5 flex items-center gap-4 rounded-3xl border border-dashed border-ink/25 p-5"
            style={{ animationDelay: '260ms' }}
          >
            <span className="wander-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-2xl text-paper" aria-hidden>
              ✦
            </span>
            <span className="flex-1">
              <span className="block font-display text-xl font-semibold">Wander freely</span>
              <span className="wander-description block text-sm text-ink-2">All {ARTWORKS.length} artworks on one map — filter, search, and find what’s nearest to you.</span>
            </span>
            <span className="text-xl" aria-hidden>
              →
            </span>
          </a>
        </section>

        </div>

        <section className="walks-section px-5 pb-5 pt-12 text-[#1c1a17]" aria-labelledby="walks">
          <h2 id="walks" className="mb-4 font-display text-3xl font-semibold sm:text-4xl">
            Choose a walk
          </h2>
          <div className="grid grid-cols-1 gap-5">
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
                      <span className="rounded-full bg-paper-2 px-2.5 py-1">🎧 audio</span>
                    </div>
                    <div
                      className="relative mt-5 flex items-center justify-between px-1"
                      role="img"
                      aria-label={`${stops.length} stops along this walk`}
                      style={{ color: tour.accent }}
                    >
                      <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2" style={{ background: `${tour.accent}55` }} aria-hidden="true" />
                      {stops.map(({ art }, stopIndex) => (
                        <span
                          key={art.id}
                          className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-card shadow-[0_0_0_2px_var(--color-card)]"
                          style={{ background: isVisited(art.id) ? tour.accent : 'var(--color-paper-2)', borderColor: tour.accent }}
                          title={`Stop ${stopIndex + 1}: ${art.title}`}
                          aria-hidden="true"
                        />
                      ))}
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
        </section>

        <section className="mt-14 grid grid-cols-1 gap-6" aria-label="How ArtWalk works">
          {[
            ['01', 'Pick a walk', 'Two curated routes through Downtown, each under an hour.'],
            ['02', 'Listen as you arrive', 'Every stop has a narrated story with a readable transcript.'],
            ['03', 'Look closer', 'Spot details, answer a question, and collect each stop.'],
          ].map(([n, t, d]) => (
            <div key={n} className={`border-t-2 border-ink pt-3 ${n === '01' ? 'grid gap-5 sm:grid-cols-2 sm:items-center' : ''}`}>
              <div>
                <p className="font-display text-sm font-semibold text-vermilion">{n}</p>
                <p className="mt-1 font-display text-lg font-semibold">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
              </div>
              {n === '01' && (
                <div className="h-56 overflow-hidden rounded-2xl border border-line shadow-sm" role="region" aria-label={`${previewTour.title} route preview map`}>
                  <ArtMap
                    mode="tour"
                    points={previewStops.map(({ art }, index) => ({ art, label: String(index + 1) }))}
                    path={previewStops.map(({ art }) => [art.lat, art.lon])}
                    accent={previewTour.accent}
                    fitKey="home-waterfront-route-preview"
                    onSelect={() => navigate({ view: 'tour', tourId: previewTour.id })}
                  />
                </div>
              )}
            </div>
          ))}
        </section>

        <CommunityHub />

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
