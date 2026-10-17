import raw from '../data/artworks.json';
import { TOURS, type Tour, type TourStop } from '../data/tours';

export interface Artwork {
  id: number;
  title: string;
  type: string;
  year: number | null;
  material: string | null;
  site: string | null;
  address: string | null;
  locationOnSite: string | null;
  lat: number;
  lon: number;
  description: string | null;
  statement: string | null;
  artistIds: string[];
  artists: string[];
  ownership: string | null;
  photoCredit: string | null;
  url: string;
}

export const ARTWORKS = raw as Artwork[];
const byId = new Map(ARTWORKS.map((a) => [a.id, a]));

export const artworkById = (id: number) => byId.get(id);

/** Artist credit for display, with where it came from. */
export function artistCredit(art: Artwork, stop?: TourStop): { name: string; source: 'registry' | 'curator' | 'unknown' } {
  if (art.artists.length) return { name: art.artists.join(' & '), source: 'registry' };
  if (stop?.curatedArtist) return { name: stop.curatedArtist, source: 'curator' };
  const ids = art.artistIds.length ? ` (registry artist #${art.artistIds.join(', #')})` : '';
  return { name: `Artist not named in open data${ids}`, source: 'unknown' };
}

export function tourStops(tour: Tour): { stop: TourStop; art: Artwork }[] {
  return tour.stops
    .map((stop) => ({ stop, art: byId.get(stop.id)! }))
    .filter((s) => s.art);
}

/** Find the tour (if any) an artwork belongs to, preferring the one in context. */
export function stopFor(artId: number, tourId?: string): { tour: Tour; stop: TourStop; index: number } | undefined {
  const order = [...TOURS.filter((t) => t.id === tourId), ...TOURS.filter((t) => t.id !== tourId)];
  for (const tour of order) {
    const index = tour.stops.findIndex((s) => s.id === artId);
    if (index >= 0) return { tour, stop: tour.stops[index], index };
  }
  return undefined;
}

/** Group the registry's many types into a few friendly filter categories. */
export const CATEGORIES: { key: string; label: string; types: string[] }[] = [
  { key: 'sculpture', label: 'Sculpture', types: ['Sculpture', 'Figurative'] },
  { key: 'site', label: 'Built into the city', types: ['Site-integrated work', 'Gateway'] },
  { key: 'memorial', label: 'Memorials', types: ['Memorial or monument'] },
  { key: 'water', label: 'Fountains', types: ['Fountain or water feature'] },
  { key: 'wall', label: 'Murals & mosaics', types: ['Mural', 'Mosaic', 'Relief', 'Two-dimensional artwork'] },
  { key: 'indigenous', label: 'Totem poles', types: ['Totem pole'] },
  { key: 'media', label: 'Media', types: ['Media work'] },
];

export const categoryOf = (type: string) => CATEGORIES.find((c) => c.types.includes(type))?.key ?? 'sculpture';
