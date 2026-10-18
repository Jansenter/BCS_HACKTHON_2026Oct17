import type { Feature, Polygon, MultiPolygon, Position } from 'geojson';
import raw from '../data/local-area-boundary.json';
import type { LatLon } from './geo';

export type Neighbourhood = Feature<Polygon | MultiPolygon, { name: string; approximate?: boolean }>;
// Approximate exploration areas, not administrative or heritage district boundaries.
// Context: https://vancouver.ca/news-calendar/downtown.aspx
// https://vancouver.ca/streets-transportation/gastown-public-spaces-plan.aspx
const SMALL_AREAS: Neighbourhood[] = [
  { type: 'Feature', properties: { name: 'Yaletown', approximate: true }, geometry: {
    type: 'Polygon', coordinates: [[[-123.1268,49.2758],[-123.1175,49.2820],[-123.1090,49.2767],[-123.1130,49.2720],[-123.1223,49.2702],[-123.1268,49.2758]]],
  } },
  { type: 'Feature', properties: { name: 'Gastown', approximate: true }, geometry: {
    type: 'Polygon', coordinates: [[[-123.1138,49.2858],[-123.1095,49.2870],[-123.0990,49.2846],[-123.0990,49.2813],[-123.1108,49.2826],[-123.1138,49.2858]]],
  } },
];

// Small areas come first so location detection prefers a neighbourhood within Downtown.
export const NEIGHBOURHOODS: Neighbourhood[] = [...SMALL_AREAS, ...raw.map((area): Neighbourhood => ({
  type: 'Feature', properties: { name: area.name },
  geometry: area.geom.geometry as Polygon | MultiPolygon,
})).sort((a, b) => a.properties.name.localeCompare(b.properties.name))];

// GeoJSON uses longitude, latitude. Ray casting includes points on the outer edge.
function inRing(ring: Position[], { lat: y, lon: x }: LatLon): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (Math.abs(cross) < 1e-12 && x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && y >= Math.min(ay, by) && y <= Math.max(ay, by)) return true;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
export function containsArtwork(area: Neighbourhood, point: LatLon): boolean {
  const polygons = area.geometry.type === 'Polygon' ? [area.geometry.coordinates] : area.geometry.coordinates;
  return polygons.some(([outer, ...holes]) => inRing(outer, point) && !holes.some((hole) => inRing(hole, point)));
}

/** Stable colours shared by the map and selector. */
export function neighbourhoodColor(name: string): string {
  const index = NEIGHBOURHOODS.findIndex((area) => area.properties.name === name);
  return `hsl(${Math.round(((Math.max(0, index) * 137.508) + 12) % 360)}, 65%, 38%)`;
}
