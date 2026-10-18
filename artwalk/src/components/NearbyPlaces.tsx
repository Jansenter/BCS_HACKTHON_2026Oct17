import { useEffect, useRef, useState, type FormEvent } from 'react';
import NearbyMap from './NearbyMap';
import type { NearbyPlace, NearbySelection } from '../lib/nearby';
import type { Artwork } from '../lib/data';
import { formatDistance } from '../lib/geo';

type Category = 'coffee' | 'food' | 'explore';
interface Result {
  places: NearbyPlace[];
  mode: 'ai' | 'distance';
  message: string;
  fetchedAt: string;
  aiAvailable?: boolean;
}
const resultCache = new Map<string, { result: Result; expires: number }>();
const OPTIONS: { key: Category; label: string; icon: string }[] = [
  { key: 'coffee', label: 'Coffee', icon: '☕' },
  { key: 'food', label: 'Food', icon: '🍽️' },
  { key: 'explore', label: 'Explore', icon: '🧭' },
];

export default function NearbyPlaces({ art, nearby, onNearbyChange }: { art: Artwork; nearby?: NearbySelection; onNearbyChange: (selection: NearbySelection) => void }) {
  const [category, setCategory] = useState<Category>('coffee');
  const [radius, setRadius] = useState(800);
  const [preferences, setPreferences] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [refining, setRefining] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);
  const mapSearch = `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: `${category === 'coffee' ? 'cafes' : category === 'food' ? 'restaurants' : 'museums and attractions'} near ${art.lat},${art.lon}` })}`;

  useEffect(() => {
    active.current?.abort();
    setResult(null);
    onNearbyChange({ artworkId: art.id, places: [] });
    setError('');
    setLoading(false);
    setRefining(false);
    return () => active.current?.abort();
  }, [art.id, category, radius, preferences]);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    active.current?.abort();
    const cacheKey = `${art.id}:${category}:${radius}:${preferences.trim()}`;
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      setResult(cached.result);
      setError('');
      setLoading(false);
      setRefining(false);
      onNearbyChange({ artworkId: art.id, places: cached.result.places, selectedId: cached.result.places[0]?.id });
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    const timer = window.setTimeout(() => controller.abort(new DOMException('Search timed out', 'TimeoutError')), 18000);
    setLoading(true);
    setRefining(false);
    setError('');
    setResult(null);
    onNearbyChange({ artworkId: art.id, places: [] });
    try {
      const response = await fetch(new URL('api/nearby', new URL(import.meta.env.BASE_URL, window.location.href)), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: art.id, category, radius, preferences, rankWithAI: false }), signal: controller.signal,
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Nearby search is not available on this site yet.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not find nearby places.');
      if (!controller.signal.aborted) {
        setResult(data as Result);
        onNearbyChange({ artworkId: art.id, places: data.places, selectedId: data.places[0]?.id });
        setLoading(false);
        let finalResult = data as Result;
        if (data.aiAvailable && data.places.length) {
          setRefining(true);
          try {
            const rankedResponse = await fetch(new URL('api/nearby', new URL(import.meta.env.BASE_URL, window.location.href)), {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ artworkId: art.id, category, radius, preferences, rankWithAI: true }), signal: controller.signal,
            });
            if (rankedResponse.ok) {
              const ranked = await rankedResponse.json() as Result;
              if (!controller.signal.aborted) {
                finalResult = ranked;
                setResult(ranked);
                onNearbyChange({ artworkId: art.id, places: ranked.places, selectedId: ranked.places[0]?.id });
              }
            }
          } catch { /* Keep the already visible map results when AI is slow or offline. */ }
          if (!controller.signal.aborted) setRefining(false);
        }
        if (!controller.signal.aborted) {
          if (resultCache.size >= 100) resultCache.delete(resultCache.keys().next().value!);
          resultCache.set(cacheKey, { result: finalResult, expires: Date.now() + 600000 });
        }
      }
    } catch (cause) {
      if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError') return;
      setError(controller.signal.reason?.name === 'TimeoutError' ? 'Search took too long. Please try again.' : cause instanceof Error ? cause.message : 'Nearby search is unavailable. Please try again.');
    } finally {
      window.clearTimeout(timer);
      if (active.current === controller && (!controller.signal.aborted || controller.signal.reason?.name === 'TimeoutError')) setLoading(false);
      if (active.current === controller) setRefining(false);
    }
  };

  return (
    <details className="rounded-2xl border border-line bg-card p-4">
      <summary className="cursor-pointer font-semibold">Explore Nearby</summary>
      <p className="mt-2 text-sm text-ink-3">Find a coffee break, a bite to eat, or another discovery near {art.title}.</p>
      <form onSubmit={search} className="mt-4 space-y-3">
        <fieldset>
          <legend className="sr-only">What would you like to find?</legend>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((option) => <label key={option.key} className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${category === option.key ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'}`}>
              <input type="radio" name={`nearby-category-${art.id}`} value={option.key} checked={category === option.key} onChange={() => setCategory(option.key)} className="sr-only" />
              <span aria-hidden="true">{option.icon}</span>{option.label}
            </label>)}
          </div>
        </fieldset>
        <label className="block text-xs font-semibold text-ink-3">
          Search radius from this artwork
          <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink">
            <option value={400}>400 m</option><option value={800}>800 m</option><option value={1200}>1.2 km</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-ink-3">
          Preferences (optional)
          <input value={preferences} onChange={(event) => setPreferences(event.target.value)} maxLength={200} placeholder="For example: vegetarian food, outdoor seating" className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink" />
        </label>
        <p className="text-xs text-ink-3">Search uses the artwork’s location. When AI is enabled, your preferences and nearby place details are sent to OpenAI.</p>
        <button type="submit" disabled={loading} className="min-h-11 w-full rounded-full bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-50">{loading ? 'Finding nearby places…' : 'Find nearby places'}</button>
      </form>
      <div aria-live="polite" aria-busy={loading || refining}>
        {refining && <p className="mt-3 text-xs text-ink-3">Places found. AI is personalizing the order…</p>}
        {error && <div className="mt-3 text-sm text-ink-3">
          <p role="alert">{error}</p>
          <a href={mapSearch} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold underline">Open nearby map search ↗</a>
        </div>}
        {result && <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">{result.mode === 'ai' ? 'AI picks · real mapped places' : 'Nearby · sorted by distance'}</p>
          <p className="mt-1 text-xs text-ink-3">{result.message}</p>
          {result.places.length > 0 && <>
            <NearbyMap origin={art} places={result.places} selectedId={nearby?.selectedId} onSelect={(id) => onNearbyChange({ artworkId: art.id, places: result.places, selectedId: id })} />
            <p className="mt-2 text-xs text-ink-3">Orange dot: artwork · numbered pins: nearby places. Tap a pin or result to highlight it.</p>
          </>}
          <ul className="mt-3 space-y-3">
            {result.places.map((place, index) => <li key={place.id} className={`rounded-xl border p-3 ${nearby?.selectedId === place.id ? 'border-vermilion bg-paper-2' : 'border-line bg-paper'}`}>
              <h4><button type="button" onClick={() => onNearbyChange({ artworkId: art.id, places: result.places, selectedId: place.id })} aria-pressed={nearby?.selectedId === place.id} className="min-h-11 w-full text-left font-semibold">{index + 1}. {place.name}<span className="ml-2 text-xs font-normal text-ink-3">Show on map</span></button></h4>
              <p className="mt-1 text-xs text-ink-3">{place.kind.replaceAll('_', ' ')} · {formatDistance(place.metres)} straight-line distance</p>
              {place.address && <p className="mt-1 text-xs text-ink-3">{place.address}</p>}
              {place.cuisine && <p className="mt-1 text-xs text-ink-3">Cuisine listed: {place.cuisine}</p>}
              <div className="mt-2 flex flex-wrap gap-1 text-xs text-ink-2">
                {place.vegetarian && <span className="rounded-full bg-good/10 px-2 py-1">Vegetarian options listed</span>}
                {place.vegan && <span className="rounded-full bg-good/10 px-2 py-1">Vegan options listed</span>}
                {place.outdoorSeating && <span className="rounded-full bg-paper-2 px-2 py-1">Outdoor seating listed</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
                <a href={place.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center underline">Walking directions ↗</a>
                <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center underline">View place ↗</a>
              </div>
            </li>)}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Mapped data may be incomplete or outdated. Check hours, prices and dietary needs with the venue. Distances are not walking routes.</p>
          <p className="mt-2 text-xs text-ink-3">Data © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · retrieved {new Date(result.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </>}
      </div>
    </details>
  );
}
