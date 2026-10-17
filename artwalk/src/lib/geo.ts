export type LatLon = { lat: number; lon: number };

/** Great-circle distance in metres. */
export function distance(a: LatLon, b: LatLon): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Straight-line path length × a street-grid factor ≈ walking distance. */
export function walkingEstimate(points: LatLon[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total * 1.3;
}

export function formatDistance(m: number): string {
  if (m < 950) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/** ~80 m per minute of relaxed walking. */
export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 80));

export function osmDirections(from: LatLon, to: LatLon): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from.lat}%2C${from.lon}%3B${to.lat}%2C${to.lon}`;
}
